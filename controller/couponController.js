const couponService = require('../service/couponService')
const moment = require('moment')
const Users = require("../model/userModel")
const Service = require('../service/userService')
const orderService = require('../service/userServiceOrderService')
const cartService = require('../service/userServiceCartService')
const logService = require('../service/logService')
const { generateAccessToken, auth } = require("../jwt");


exports.createCoupon = async (req, res) => {
    try {
        const coupon_code = req.body.coupon_code
        const coupon_name = req.body.coupon_name
        const description = req.body.description
        const coupon_type = req.body.coupon_type
        const minimum_order_amount = req.body.minimum_order_amount
        const discount_amount = req.body.discount_amount
        const start_date = req.body.start_date
        const end_date = req.body.end_date
        const location = req.body.location
        const valid_user = req.body.valid_user
        const status = req.body.status
        const max_discount = req.body.status

        var method_name = await Service.getCallingMethodName()
        var apiEndpointInput = JSON.stringify(req.body)
        var apiTrack = await Service.trackApi(req.query.user_id, method_name, apiEndpointInput, req.query.device_id, req.query.device_info, req.ip)
        if (!coupon_code || !coupon_name || !coupon_type || !minimum_order_amount || !start_date || !end_date) {
            return res.status(500).send({ HasError: true, message: "Invalid parameter." })
        } else {
            const data = { coupon_code, coupon_name, description, coupon_type, minimum_order_amount, discount_amount, start_date, end_date, location, valid_user, status, max_discount }
            const newCoupon = await couponService.createCoupon(data)
            var dataJson = {}
            dataJson.id = newCoupon.id ? newCoupon.id : 0
            dataJson.coupon_code = newCoupon.coupon_code ? newCoupon.coupon_code : ''
            dataJson.coupon_name = newCoupon.coupon_name ? newCoupon.coupon_name : ''
            dataJson.description = newCoupon.description ? newCoupon.description : ''
            dataJson.coupon_type = newCoupon.coupon_type ? newCoupon.coupon_type : 0
            dataJson.coupon_type_name = newCoupon.coupon_type === 1 ? "Percentage" : (newCoupon.coupon_type === 2 ? "Flat" : '')
            dataJson.minimum_order_amount = newCoupon.minimum_order_amount ? newCoupon.minimum_order_amount : 0
            dataJson.discount_amount = newCoupon.discount_amount ? newCoupon.discount_amount : 0
            dataJson.start_date = moment(newCoupon.start_date).format('YYYY-MM-DD HH:mm:ss') ? moment(newCoupon.start_date).format('YYYY-MM-DD HH:mm:ss') : ''
            dataJson.end_date = moment(newCoupon.end_date).format('YYYY-MM-DD HH:mm:ss') ? moment(newCoupon.end_date).format('YYYY-MM-DD HH:mm:ss') : ''
            dataJson.location = newCoupon.location ? newCoupon.location : ''
            dataJson.valid_user = newCoupon.valid_user ? newCoupon.valid_user : 0
            dataJson.status = newCoupon.status ? newCoupon.status : 0
            dataJson.status_name = newCoupon.status === 1 ? "Active" : (newCoupon.status === 2 ? "Inactive" : '')
            dataJson.max_discount = newCoupon.max_discount ? newCoupon.max_discount : 0

            return res.status(200).send({ HasError: false, Message: "Coupon data inserted successfully.", result: dataJson })
        }
    } catch (error) {
        console.error(error)
        const logData = { user_id: "", status: 'false', message: error.message, device_id: '', created_at: Date.now(), updated_at: Date.now(), device_info: '', action: req.url }
        const log = await logService.createLog(logData)
        return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message })
    }
}

exports.applyCoupon = async (req, res) => {
    try {
        const coupon_code = req.body.coupon_code
        // const user_id = req.body.user_id
        const g_token = auth(req)
        const user_id = g_token.user_id;
        var currentDate = new Date();
        if (coupon_code) {
            var result = await couponService.getCouponDetails(coupon_code)
            var orderDetails = await orderService.orderDetailsByCoupon(user_id, coupon_code)
            if (result) {
                if (!orderDetails) {
                    couponDetails = result.toJSON()
                    const startDate = new Date(couponDetails.start_date);
                    const endDate = new Date(couponDetails.end_date);
                    var finalresult = {}
                    finalresult.id = couponDetails.id
                    finalresult.coupon_code = couponDetails.coupon_code
                    if (currentDate >= startDate && currentDate <= endDate) {
                        if (couponDetails.valid_user == null || couponDetails.valid_user == user_id) {
                            var cartDetails = await cartService.getCart(user_id)
                            const cart_amount = cartDetails.reduce((total, num) => total + parseFloat(num.amount), 0)
                            finalresult.cart_amount = cart_amount
                            if (cart_amount >= couponDetails.minimum_order_amount) {
                                var total
                                if (couponDetails.coupon_type == 1) {//1-percentage,2-flat
                                    var discount = (couponDetails.discount_amount * cart_amount) / 100
                                    finalresult.discount_amount = discount
                                    finalresult.delivery_price = 50
                                    if (discount > couponDetails.max_discount) {
                                        discount = couponDetails.max_discount
                                    }
                                    total = cart_amount - discount + finalresult.delivery_price
                                } else {
                                    finalresult.discount_amount = couponDetails.discount_amount
                                    finalresult.delivery_price = 50
                                    total = cart_amount - couponDetails.discount_amount + finalresult.delivery_price

                                }
                                finalresult.total_amount = total
                                return res.status(200).send({ HasError: false, Message: "Coupon apply successfully", result: finalresult })
                            } else {
                                return res.status(200).send({ HasError: false, Message: `Need to add item worth ${couponDetails.minimum_order_amount} to apply this coupon.`, result: {} })
                            }
                        } else {
                            return res.status(200).send({ HasError: false, Message: "You are not eligible for this coupon.", result: {} })
                        }
                    } else {
                        return res.status(200).send({ HasError: false, Message: "This coupon has been expired.", result: {} })
                    }
                } else {
                    return res.status(200).send({ HasError: false, Message: "You have already applied this coupon.", result: {} })
                }
            } else {
                return res.status(200).send({ HasError: false, Message: "This coupon doesn't exist.", result: {} })
            }
        } else {
            return res.status(200).send({ HasError: true, Message: "Please enter a coupon.", result: {} })
        }
    } catch (error) {
        console.error(error)
        const logData = { user_id: "", status: 'false', message: error.message, device_id: '', created_at: Date.now(), updated_at: Date.now(), device_info: '', action: req.url }
        const log = await logService.createLog(logData)
        return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message })
    }
}
