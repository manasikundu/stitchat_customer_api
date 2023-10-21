const OrderService = require('../service/userServiceOrderService')
const moment = require('moment')
const Users = require("../model/userModel")
const UsersAddress = require("../model/userAddressModel")
const Service = require('../service/userService')
const cartService = require('../service/userServiceCartService')

exports.createOrder = async (req, res) => {
    try {
        const user_id = req.body.user_id
        const name = req.body.name
        const email = req.body.email
        const mobile_number = req.body.mobile_number
        const address_id = req.body.address_id
        const status = 0
        var currentDate = new Date();
        var formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ")
        const coupon_id = req.body.copon_id || 0
        const coupon_code = req.body.copon_code || 0
        const delivery_price = req.body.delivery_price || 0
        const sum_amount = req.body.sum_amount || 0
        const discount_price = req.body.discount_price || 0
        const extra_charge = req.body.extra_charge || 0
        const total_price = req.body.total_price || 0
        const data = { user_id, name, email, mobile_number, address_id, status, created_at: formattedDate, updated_at: formattedDate, coupon_id, coupon_code, delivery_price, sum_amount, discount_price, extra_charge, total_price }
        if (req.body.user_id) {
            const user = await Users.findOne({ where: { id: user_id } })
            if (user) {
                const newOrder = await OrderService.createOrder(data)
                if (newOrder) {
                    const today = new Date();
                    const year = today.getFullYear();
                    const month = today.getMonth() + 1; // Months are zero-based, so we add 1.
                    const day = today.getDate();
                    const orderId = "STIAR" + day + month + year + newOrder.id
                    const updateOrderId = await OrderService.updateOrder(newOrder.id, { order_id: orderId })
                    var cart = await cartService.getCart(user_id)
                    if(cart.length!=0){
                        const updateOrderIdInCart = await cartService.updateCartByUserId(newOrder.user_id, { order_id: orderId })
                        if (updateOrderIdInCart != 0) {
                            return res.status(200).send({ message: "Order Placed Sucessfully", HasError: false })
                        } else {
                            return res.status(500).send({ message: "failed to update in cart.", HasError: true })
                        }
                    }else{
                        return res.status(200).send({ message: "Please add item in cart to place order", HasError: false })
                    }
                } else {
                    return res.status(500).send({ message: "Failed to create order", HasError: true });
                }
            } else {
                return res.status(200).send({ message: "This user doesn't exist", HasError: false });
            }
        } else {
            return res.status(400).send({ message: "Please enter a userId", HasError: true });
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
        var apiTrack = await Service.trackApi(user_id, method_name, apiEndpointInput, req.query.device_id, req.query.device_info, req.ip)
        const orderHistory = await OrderService.getCartHistory(user_id, order_id)
        if (orderHistory.length === 0) {
            return res.status(200).send({ message: "No matching orders found", HasError: false, result: [] })
        } else {
            const final_data = []
            for (var item of orderHistory) {
                const orderData = {}
                orderData.order_id = item.id || 0
                orderData.user_id = item.user_id || 0
                orderData.name = item.name || 0
                orderData.email = item.email || ''
                orderData.mobile_number = item.mobile_number || ''
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

