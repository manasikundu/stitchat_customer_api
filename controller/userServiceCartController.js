const { da } = require('date-fns/locale');
const cartService = require('../service/userServiceCartService')
const moment = require('moment')
const categoryItem = require("../model/categoryItemModel")
const Users = require("../model/userModel")
const tailorService = require("../service/tailorService")
const Service = require('../service/userService')
const { generateAccessToken, auth } = require("../jwt");
const logService = require('../service/logService')
const cron = require('node-cron');


exports.createServiceCart = async (req, res) => {
  try {
    const user_id = req.body.user_id
    // const g_token = auth(req)
    // const user_id = g_token.user_id;
    const item_id = req.body.item_id
    const service_id = req.body.service_id
    const type = req.body.type
    const fit_type = req.body.fit_type
    const fit_description = req.body.fit_description
    const tailor_note = req.body.tailor_note
    const item_description = req.body.item_description
    const repair_location = req.body.repair_location
    const amount = req.body.amount;
    const repair_description = req.body.repair_description
    const quantity = req.body.quantity
    var method_name = await Service.getCallingMethodName()
    var apiEndpointInput = JSON.stringify(req.body)
    var apiTrack = await Service.trackApi(req.query.user_id, method_name, apiEndpointInput, req.query.device_id, req.query.device_info, req.ip)

    if (!user_id || !item_id || !service_id || !type || !amount) {
      return res.status(400).send({ HasError: true, Message: "Invalid parameter." })
    } else {
      const item = await categoryItem.findOne({ where: { id: item_id } });
      if (!item) {
        return res.status(200).send({ HasError: true, Message: "Item id does not exist." })
      } else {
        const userId = await Users.findOne({ where: { id: user_id } })
        if (!userId) {
          return res.status(200).send({ HasError: true, Message: "User id does not exist." })
        } else {
          var currentDate = new Date();
          var formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ")
          const data = {
            user_id, item_id, service_id, order_id: null, type, amount, service_date_time: null, status: 0, created_at: formattedDate, updated_at: formattedDate,
            fit_type, fit_description, tailor_note, item_description, repair_location, repair_description, quantity
          }
          const newService = await cartService.createServiceCart(data)
          var dataJson = {}
          dataJson.id = newService.id
          dataJson.user_id = newService.user_id
          dataJson.item_id = newService.item_id
          dataJson.service_id = newService.service_id
          dataJson.type = newService.type
          if (newService.type == 1) {
            dataJson.type_name = "ALTER"
          } else if (newService.type == 2) {
            dataJson.type_name = "REPAIR"
          }
          dataJson.amount = newService.amount
          // dataJson.service_date_time = newService.service_date_time
          dataJson.status = newService.status
          dataJson.created_at = moment(newService.created_at).format('YYYY-MM-DD HH:mm:ss')
          dataJson.fit_type = newService.fit_type
          dataJson.fit_description = newService.fit_description
          dataJson.tailor_note = newService.tailor_note
          dataJson.item_description = newService.item_description
          dataJson.repair_location = newService.repair_location
          dataJson.repair_description = newService.repair_description

          return res.status(200).send({ HasError: false, Message: "Service cart data inserted successfully.", result: dataJson });
        }
      }
    }
  } catch (error) {
    console.error(error)
    const logData = { user_id: "", status: 'false', message: error.message, device_id: '', created_at: Date.now(), updated_at: Date.now(), device_info: '', action: req.url }
    const log = await logService.createLog(logData)
    return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message });
  }
}

exports.getCart = async (req, res) => {
  try {
    const g_token = auth(req)
    const user_id = g_token.user_id
    var method_name = await Service.getCallingMethodName()
    var apiEndpointInput = JSON.stringify(req.body)
    var apiTrack = await Service.trackApi(req.query.user_id, method_name, apiEndpointInput, req.query.device_id, req.query.device_info, req.ip)

    if (user_id) {
      const user = await Users.findOne({ where: { id: user_id } })
      if (user) {
        var data = await cartService.getCart(user_id)
        if (data.length != 0) {
          var final_data = []
          for (var i in data) {
            var final_data_json = {}
            final_data_json.id = data[i].id
            final_data_json.user_id = data[i].user_id
            final_data_json.item_id = data[i].item_id
            var item = await tailorService.getItemDetails(data[i].item_id)
            final_data_json.item_name = item.name
            final_data_json.service_id = data[i].service_id
            var service = await tailorService.getServiceDetails(data[i].service_id)
            final_data_json.service_name = service.name
            final_data_json.order_id = data[i].order_id
            final_data_json.type = data[i].type
            final_data_json.type_name = data[i].type === 1 ? "Alter" : (data[i].type === 2 ? "Repair" : '');
            final_data_json.amount = data[i].amount
            final_data_json.service_date_time = data[i].service_date_time
            final_data_json.status = data[i].status
            final_data_json.fit_type = data[i].fit_type ? data[i].fit_type : 0
            final_data_json.fit_choice = data[i].fit_type === 1 ? "Measure Item" : (data[i].fit_type === 2 ? "Match Item" : (data[i].fit_type === 3 ? "Pin Item" : ''));
            final_data_json.fit_description = data[i].fit_description ? data[i].fit_description : ''
            final_data_json.tailor_note = data[i].tailor_note
            final_data_json.item_description = data[i].item_description
            final_data_json.repair_location = data[i].repair_location ? data[i].repair_location : ''
            final_data_json.repair_description = data[i].repair_description ? data[i].repair_description : ''
            final_data_json.created_at = data[i].created_at
            final_data_json.updated_at = data[i].updated_at
            final_data.push(final_data_json)
          }

          const sub_total = data.reduce((total, num) => total + parseFloat(num.amount), 0)
          const delivery_fee = 50
          const total = parseFloat(sub_total) + parseFloat(delivery_fee)
          return res.status(200).send({ message: "Successfully fetched data", HasError: false, result: { data: final_data, sub_total: sub_total, delivery_fee: delivery_fee, total: total } });
        } else {
          return res.status(200).send({ message: "No data available", HasError: false, result: { data: [] } })
        }
      } else {
        return res.status(200).send({ message: "This user doesn't exist", HasError: false })
      }
    } else {
      return res.status(400).send({ message: "Please enter a userId", HasError: true })
    }
  } catch (error) {
    const logData = { user_id: "", status: 'false', message: error.message, device_id: '', created_at: Date.now(), updated_at: Date.now(), device_info: '', action: req.url }
    const log = await logService.createLog(logData)
    return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message })
  }
}

exports.removeCart = async (req, res) => {
  try {
    var id = req.body.cart_id
    // var user_id = req.body.user_id
    const g_token = auth(req)
    const user_id = g_token.user_id;
    var method_name = await Service.getCallingMethodName()
    var apiEndpointInput = JSON.stringify(req.body)
    var apiTrack = await Service.trackApi(req.query.user_id, method_name, apiEndpointInput, req.query.device_id, req.query.device_info, req.ip)

    if (id && user_id) {
      const user = await Users.findOne({ where: { id: user_id } })
      if (user) {
        var cartData = await cartService.getCartById(id)
        if (cartData) {
          if (cartData.user_id == user_id) {
            const result = await cartService.deleteCart(id, user_id)
            if (result != 0) {
              return res.status(200).send({ message: "This item from cart removed sucessfully.", HasError: false })
            } else {
              return res.status(500).send({ message: "failed to remove", HasError: true })
            }
          } else {
            return res.status(400).send({ message: "The provided cart_id does not belong to the specified user.", HasError: true })
          }
        } else {
          return res.status(200).send({ message: "This cart Id doesn't exist.", HasError: true })
        }
      } else {
        return res.status(200).send({ HasError: true, Message: "User id does not exist." })
      }
    } else {
      return res.status(400).send({ message: "Please enter Id to delete", HasError: true })
    }
  } catch (error) {
    const logData = { user_id: "", status: 'false', message: error.message, device_id: '', created_at: Date.now(), updated_at: Date.now(), device_info: '', action: req.url }
    const log = await logService.createLog(logData)
    return res.status(500).send({ message: "Some thing went wrong.", HasError: true, error: error.message })
  }
}

exports.updateCart = async (req, res) => {
  try {
    var id = req.body.cart_id
    // var user_id = req.body.user_id
    const g_token = auth(req)
    const user_id = g_token.user_id;
    if (id && user_id) {
      const user = await Users.findOne({ where: { id: user_id } })
      if (user) {
        var cartData = await cartService.getCartById(id)
        if (cartData) {
          if (cartData.user_id == user_id) {
            const data = req.body;
            delete data['id'];
            const result = await cartService.updateCart(id, data)
            if (result != 0) {
              return res.status(200).send({ message: "Cart updated sucessfully", HasError: false })
            } else {
              return res.status(500).send({ message: "failed to update", HasError: true })
            }
          } else {
            return res.status(400).send({ message: "The provided cart_id does not belong to the specified user.", HasError: true })
          }
        } else {
          return res.status(200).send({ message: "This cart Id doesn't exist.", HasError: true })
        }
      } else {
        return res.status(200).send({ HasError: true, Message: "User id does not exist." })
      }
    } else {
      return res.status(400).send({ message: "Please enter Id to update", HasError: true })
    }
  } catch (error) {
    console.log(error);
    const logData = { user_id: "", status: 'false', message: error.message, device_id: '', created_at: Date.now(), updated_at: Date.now(), device_info: '', action: req.url }
    const log = await logService.createLog(logData)
    res.status(500).send({ message: "Something went wrong.", HasError: true ,error: error.message });
  }
};
