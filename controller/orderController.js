const crypto = require("crypto");
const FCM = require("fcm-node");
const Service = require("../service/userService");
const orderService = require("../service/orderService");
const Boutique = require("../model/userBoutiqueInfoModel");
const Users = require("../model/userModel");
const { Op } = require("sequelize");
const moment = require("moment");
const jwt = require("jsonwebtoken");
const { generateAccessToken, auth } = require("../jwt");
const db = require("../dbConnection");
const s3 = require("../config/s3Config");
const dotenv = require("dotenv");
dotenv.config();

var expirationTime = 600;

// Define the controller function for fetching order details
exports.orderList = async (req, res) => {
  try {
    var user_id = req.query.user_id;
    if (user_id == undefined && !Number.isInteger(parseInt(user_id))) {
      return res.status(400).json({
        HasError: true,
        StatusCode: 400,
        message: "Invalid parameter.",
      });
    }

    var method_name = await Service.getCallingMethodName();
    var apiEndpointInput = JSON.stringify(req.body);
    var apiTrack = await Service.trackApi(
      req.query.user_id,
      method_name,
      apiEndpointInput,
      req.query.device_id,
      req.query.device_info,
      req.ip
    );
    var boutiqueOrders = await orderService.boutiqueOrder(user_id);
    var orderList = [];
    for (var order of boutiqueOrders) {
      var boutiqueAddress = await orderService.boutiqueAddress();
      var orderStatusName = await orderService.orderStatus(order.id);
      var orderDelivery = await orderService.orderDelivery();
      var orderStatus = orderStatusName.find(
        (status) => status.id === order.order_status_id
      );
      var delivery = orderDelivery.find(
        (delivery_date) => delivery_date.order_id === order.id
      );
      var orderListArray = {
        id: order.id,
        booking_code: order.booking_code,
        boutique_id: order.boutique_id,
        customer_id: order.customer_id,
        total_quantity: order.total_quantity,
        subtotal_amount: order.subtotal_amount,
        total_payable_amount: order.total_payable_amount,
        order_status: order.order_status_id,
        order_status_name: orderStatus.order_status_name,
        delivery_date: delivery.delivery_date,
        boutique_name: boutiqueAddress[0].boutique_name,
        boutique_address: boutiqueAddress[0].address,
        boutique_country_state: boutiqueAddress[0].coutry_state,
        boutique_city: boutiqueAddress[0].city,
        boutique_area: boutiqueAddress[0].area,
        boutique_landmark: boutiqueAddress[0].landmark,
      };
      orderList.push(orderListArray);
    }
    // // Generate access token using the provided secretKey
    // var secretKey = "tensorflow";
    // var token = generateAccessToken(mobile_number, secretKey);

    if (orderList.length !== 0) {
      return res.status(200).send({
        result: {
          orderList,
        },
        HasError: false,
        Message: "Order list retrieved successfully.",
      });
    } else {
      return res.status(200).send({
        result: {
          orderList,
        },
        HasError: false,
        Message: "No data found.",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      result: {
        orderList,
      },
      HasError: true,
      Message: "Some error occured.",
    });
  }
};

// order details
exports.orderDetails = async (req, res) => {
  try {
    var user_id = req.query.user_id;
    var order_id = req.query.order_id;
    if (order_id == undefined || !Number.isInteger(parseInt(order_id))) {
      return res.status(400).json({
        HasError: true,
        StatusCode: 400,
        message: "Invalid parameter.",
      });
    }
    var method_name = await Service.getCallingMethodName();
    var apiEndpointInput = JSON.stringify(req.body);
    var apiTrack = await Service.trackApi(
      req.query.user_id,
      method_name,
      apiEndpointInput,
      req.query.device_id,
      req.query.device_info,
      req.ip
    );
    var boutiqueOrders = await orderService.boutiqueOrderByOrderId(order_id);
    var orderDetails = {};
    for (var order of boutiqueOrders) {
      var boutiqueAddress = await orderService.boutiqueAddress();
      var orderStatusName = await orderService.orderStatus(order.id);
      var orderDelivery = await orderService.orderDelivery();
      var orderStatus = orderStatusName.find(
        (status) => status.id === order.order_status_id
      );
      var delivery = orderDelivery.find(
        (delivery_date) => delivery_date.order_id === order.id
      );
      orderDetails = {
        order_id: order.id,
        booking_code: order.booking_code,
        boutique_id: order.boutique_id,
        customer_id: order.customer_id,
        first_name: order.first_name,
        last_name: order.last_name,
        full_name: order.first_name + " " + order.last_name,
        mobile_number: order.mobile_number,
        email_id: order.email_id,
        total_quantity: order.total_quantity,
        subtotal_amount: order.subtotal_amount,
        discount_amount: order.discount_amount,
        coupon_applied_amount: order.coupon_applied_amount,
        tax_applied_amount: order.tax_applied_amount,
        total_payable_amount: order.total_payable_amount,
        reward_point: order.reward_point,
        order_status: order.order_status_id,
        order_status_name: orderStatus.order_status_name,
        delivery_date: delivery.delivery_date,
        boutique_name: boutiqueAddress[0].boutique_name,
        boutique_address: boutiqueAddress[0].address,
        boutique_country_state: boutiqueAddress[0].coutry_state,
        boutique_city: boutiqueAddress[0].city,
        boutique_area: boutiqueAddress[0].area,
        boutique_landmark: boutiqueAddress[0].landmark,
      };
    }
    var measurement = await orderService.getMeasurement(order_id);
    var meas = [];
    for (var m of measurement) {
      var measurementArray = {
        measurement_id: m.measurement_id,
        measurement_name: m.name,
        measurement_value: m.value,
        measurement_uom: m.uom,
      };
      meas.push(measurementArray);
    }
    var items = await orderService.getItemsByOrderId(order_id);
    var groupedItems = {};
    for (var item of items) {
      var categoryType = await orderService.getCategoryByItemId(item.id);
      if (categoryType.length > 0) {
        var category_name = categoryType[0].name;
        if (!groupedItems[category_name]) {
          groupedItems[category_name] = {
            category_id: categoryType[0].id,
            category_name: category_name,
            item: [],
          };
        }
        var itemImages = await orderService.getItemImagesByItemId(item.id);
        var item_image = s3.getSignedUrl("getObject", {
          Bucket: process.env.AWS_BUCKET,
          Key: `category_item/${itemImages[0].image}`,
          Expires: expirationTime,
        });

        groupedItems[category_name].item.push({
          item_id: item.id,
          item_name: item.name,
          item_image: item_image,
          fabric_type: item.fabric_type
        });
      }
    }
    var categoryTypeArray = Object.values(groupedItems);
    if (Object.keys(orderDetails).length !== 0) {
      return res.status(200).send({
        result: {
          ...orderDetails,
          items: categoryTypeArray,
          measurement: meas,
        },
        HasError: false,
        Message: "Order details retrieved successfully.",
      });
    } else {
      return res.status(200).send({
        result: {
          orderDetails,
        },
        HasError: false,
        Message: "No data found.",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      result: {
        orderDetails,
      },
      HasError: true,
      Message: "Some error occurred.",
    });
  }
};

