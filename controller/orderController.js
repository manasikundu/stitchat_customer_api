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
    // Extract query parameters from the request
    var {
      id,
      booking_code,
      boutique_id,
      customer_id,
      order_status_id,
      order_status_name,
    } = req.query;
    var query = {};
    if (id) {
      query.id = id;
    }
    if (booking_code) {
      query.booking_code = booking_code;
    }
    if (boutique_id) {
      query.boutique_id = boutique_id;
    }
    if (customer_id) {
      query.customer_id = customer_id;
    }
    if (order_status_id) {
      query.order_status_id = order_status_id;
    }
    if (order_status_name) {
      query.order_status_name = order_status_name;
    }

    // Get the method name and API input for tracking
    var method_name = await Service.getCallingMethodName();
    var apiEndpointInput = JSON.stringify(req.body);

    // Track API hit
    var apiTrack = await Service.trackApi(
      req.query.user_id,
      method_name,
      apiEndpointInput,
      req.query.device_id,
      req.query.device_info,
      req.ip
    );

    // Fetch a list of orders using your service functions
    var boutiqueOrders = await orderService.boutiqueOrder();
    var orderList = [];

    // Loop through each order and fetch additional details
    for (var order of boutiqueOrders) {
      var boutiqueAddress = await orderService.boutiqueAddress();
      var orderStatusName = await orderService.orderStatus(order.id);
      var orderDelivery = await orderService.orderDelivery()

      // Find the order_status_name for the current order's order_status
      var orderStatus = orderStatusName.find(
        (status) => status.id === order.order_status_id
      );

      var delivery = orderDelivery.find((delivery_date) => delivery_date.order_id === order.id)

      // Create an order object with combined details
      var orderListArray = {
        id: order.id,
        booking_code: order.booking_code,
        boutique_id: order.boutique_id,
        customer_id: order.customer_id,
        total_quantity: order.total_quantity,
        subtotal_amount: order.subtotal_amount,
        total_payable_amount: order.total_payable_amount,
        order_status: order.order_status_id,
        order_status_name: orderStatus
          ? orderStatus.order_status_name
          : "Unknown",
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
    // Handle any errors that may occur during processing
    console.error(error);
    return res.status(500).send({
      result: {
        orderList,
      },
      HasError: true,
      Message: "An error occurred while processing the request.",
    });
  }
};

