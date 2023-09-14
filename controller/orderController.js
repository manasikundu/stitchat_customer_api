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
