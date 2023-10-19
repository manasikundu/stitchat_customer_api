const cartServiceOrder = require('../service/userServiceOrderService')
const moment = require('moment')
const Users = require("../model/userModel")
const UsersAddress = require("../model/userAddressModel")
const Service = require('../service/userService')

exports.createServiceOrder = async (req, res) => {
    try {
        const serviceOrdersData = req.body
        var method_name = await Service.getCallingMethodName()
        var apiEndpointInput = JSON.stringify(req.body)
        var apiTrack = await Service.trackApi(req.query.user_id,method_name,apiEndpointInput,req.query.device_id,req.query.device_info,req.ip)
        if (!serviceOrdersData) {
            return res.status(400).send({ HasError: true, Message: "Invalid parameter." })
        } else {
            const results = []
            var hasError = false
            const processOrder = async (orderData) => {
                const user_id = orderData.user_id
                const total_amount = orderData.total_amount
                const address_details = orderData.address_details
                const address_id = orderData.address_id
  
            if (!user_id || !total_amount || !address_details || !address_id) {
                results.push({ HasError: true, Message: "Invalid parameter." })
                hasError = true
            } else {
                const addressId = await UsersAddress.findOne({ where: { id: address_id } })
                if (!addressId) {
                    results.push({ HasError: true, Message: "Address id does not exist." })
                    hasError = true;
                } else {
                    const userId = await Users.findOne({ where: { id: user_id } })
                    if (!userId) {
                    results.push({ HasError: true, Message: "User id does not exist." })
                    hasError = true;
                } else {
                    const currentDate = new Date();
                    const formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ")
                    const data = { user_id, total_amount, address_details, address_id, status: 1, created_at: formattedDate, updated_at: formattedDate }
                    const newService = await cartServiceOrder.createServiceCart(data)
                    var dataJson = {}
                    dataJson.id = newService.id
                    dataJson.user_id = newService.user_id
                    dataJson.total_amount = newService.total_amount
                    dataJson.address_details = newService.address_details
                    dataJson.address_id = newService.address_id
                    dataJson.status = newService.status
                    dataJson.created_at = moment(newService.created_at).format('YYYY-MM-DD HH:mm:ss')
                    results.push(dataJson)
                    hasError = true
                }
            }
        }
    }
    if (Array.isArray(serviceOrdersData)) {
        const promises = serviceOrdersData.map(processOrder)
        await Promise.all(promises)
    } else {
        const singleOrderArray = [serviceOrdersData]
        const promises = singleOrderArray.map(processOrder)
        await Promise.all(promises)
    }
    return res.status(200).send({ HasError: false, Message: "Service orders inserted successfully.", results })
    }
    } catch (error) {
      console.error(error)
      return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message })
    }
}

exports.orderHistory = async (req, res) => {
    try {
        const user_id = req.body.user_id
        const order_id = req.body.order_id
        var method_name = await Service.getCallingMethodName()
        var apiEndpointInput = JSON.stringify(req.body)
        var apiTrack = await Service.trackApi(user_id,method_name,apiEndpointInput,req.query.device_id,req.query.device_info,req.ip)
        const orderHistory = await cartServiceOrder.getCartHistory(user_id, order_id)
        if (orderHistory.length === 0) {
            return res.status(200).send({ message: "No matching orders found", HasError: false, result: [] })
        } else {
            const final_data = []
            for (var item of orderHistory) {
                const orderData = {}
                orderData.order_id = item.id || 0
                orderData.user_id = item.user_id || 0
                orderData.total_amount = item.total_amount || 0
                orderData.address_details = item.address_details || ''
                orderData.address_id = item.address_id || 0
                orderData.status = item.status || 0
                orderData.created_at = moment(item.created_at).format('YYYY-MM-DD HH:mm:ss') || ''
                final_data.push(orderData);
            }
            return res.status(200).send({ message: "Successfully fetched order history", HasError: false, result: final_data })
        }
    } catch (error) {
        console.log(error)
        return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message })
    }
}

