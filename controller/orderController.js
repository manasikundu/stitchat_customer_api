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
var orderStatusConfig = [
  { id: 1, status: "In Draft" },
  { id: 2, status: "Waiting for confirmation" },
  { id: 3, status: "Order accepted by Boutique" },
  { id: 4, status: "In progress" },
  { id: 5, status: "Ready for Deliver" },
  { id: 6, status: "Order Delivered" },
  { id: 7, status: "Order Closed" },
  { id: 8, status: "Order Cancelled" }
];

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
    var customerType = await orderService.customerType(order_id);
    var boutiqueOrders = await orderService.boutiqueOrderByOrderId(order_id);
    var orderDetails = {};
    for (var order of boutiqueOrders) {
      var boutiqueAddress = await orderService.boutiqueAddress();
      var orderStatusName = await orderService.orderStatus(order.id);
      var orderDelivery = await orderService.orderDelivery();
      var orderStatus = orderStatusName.find(
        (status) => status.id === order.order_status_id
      );
      var deliveryDate = orderDelivery.find(
        (delivery_date) => delivery_date.order_id === order.id
      );
      var deliveryTime = orderDelivery.find(
        (deliver_time) => deliver_time.order_id === order.id
      );
      orderDetails = {
        id: order.id,
        booking_code: order.booking_code,
        boutique_id: order.boutique_id,
        customer_id: order.customer_id,
        customer_firstname: order.first_name,
        customer_lastname: order.last_name,
        customer_name: order.first_name + " " + order.last_name,
        customer_mobile_number: order.mobile_number,
        customer_email_id: order.email_id,
        total_quantity: order.total_quantity,
        subtotal_amount: order.subtotal_amount,
        discount_amount: order.discount_amount,
        coupon_applied_amount: order.coupon_applied_amount,
        tax_applied_amount: order.tax_applied_amount,
        total_payable_amount: order.total_payable_amount,
        reward_point: order.reward_point,
        order_status: order.order_status_id,
        bill_image: order.bill_image,
        order_status_name: orderStatus.order_status_name,
        customer_user_type_id: customerType[0].user_type_id,
        add_date: order.created_at,
      };
    }
    var items = await orderService.getItemsByOrderId(order_id);
    var category = await orderService.categoryType(order_id)
    var itemList = [];
    for (var item of items) {
      var categoryType = await orderService.getCategoryByItemId(
        item.category_item_dic_id
      );
      if (categoryType.length > 0) {
        var category_id = categoryType[0].id;
        var category_name = categoryType[0].name;
        var itemImages = await orderService.getItemImagesByItemId(
          item.category_item_dic_id
        );
        var item_image = s3.getSignedUrl("getObject", {
          Bucket: process.env.AWS_BUCKET,
          Key: `category_item/${itemImages[0].image}`,
          Expires: expirationTime,
        });
        var material_image = item.material_image || [];
        var cat_name      
        if (category[0].category_type === 1) {
          cat_id = 1
          cat_name = "Men"
        } else if (category[0].category_type === 2) {
          cat_id = 2
          cat_name = "Women"
        } else if (category[0].category_type === 3) {
          cat_id = 3
          cat_name = "Kids"
        } else {
          cat_id = ''
          cat_name = 'All'
        }
        itemList.push({
          id: item.id,
          item_name: item.name,
          category_item_dic_id: item.category_item_dic_id,
          category_name: category_name,
          name: cat_name,
          category_id: category_id,
          gender: category[0].category_type,
          quantity: boutiqueOrders[0].total_quantity,
          unit_price: item.unit_price,
          delivery_date: deliveryDate.delivery_date,
          deliver_time: deliveryTime.deliver_time,
          material_received: item.material_received,
          status_id: order.order_status_id,
          status: orderStatus.order_status_name,
          fabric_type: item.fabric_type,
          material_image: material_image,
          item_image: item_image,
        });
      }
    }
    var measurement = await orderService.getMeasurement(order_id);
    var meas = [];
    for (var m of measurement) {
      var measurementArray = {
        id: measurement[0].id,
        item_id: item.id,
        name: m.name,
        value: m.value,
        uom: m.uom,
        meas_id: m.measurement_id,
      };
      meas.push(measurementArray);
    }
    var itemArray = itemList.map((item) => ({
      ...item,
      measurement_info: meas,
    })) 
    if (Object.keys(orderDetails).length !== 0) {
      return res.status(200).send({
        result: {
          ...orderDetails,
          items: itemArray,
          order_status_info: [orderStatusConfig]
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

exports.cancelOrder = async (req, res) => {
  try {
    var order_id = req.query.order_id;
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
    if (order_id == undefined || !Number.isInteger(parseInt(order_id))) {
      return res.status(400).send({
        HasError: true,
        StatusCode: 400,
        message: "Invalid parameter.",
      });
    }
    const orderCancelResult = await orderService.orderCancel(order_id);
    if (orderCancelResult.error) {
      return res.status(500).send({
        HasError: true,
        Message: "Error canceling the order.",
      });
    } else {
      const itemCancelResult = await orderService.itemCancel(order_id);
      if (itemCancelResult.error) {
        return res.status(500).send({
          HasError: true,
          Message: "Error canceling the items within the order.",
        });
      } else {
        return res.status(200).send({
          HasError: false,
          Message: "Order and items canceled successfully.",
        });
      }
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

