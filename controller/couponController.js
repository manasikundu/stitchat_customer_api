const couponService = require('../service/couponService')
const moment = require('moment')
const Users = require("../model/userModel")
const Service = require('../service/userService')
const orderService = require('../service/userServiceOrderService')
const cartService = require('../service/userServiceCartService')


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
        const max_users = req.body.max_users
        const user_count = req.body.user_count
        const status = req.body.status
        var method_name = await Service.getCallingMethodName()
        var apiEndpointInput = JSON.stringify(req.body)
        var apiTrack = await Service.trackApi(req.query.user_id,method_name,apiEndpointInput,req.query.device_id,req.query.device_info,req.ip)
        if (!coupon_code || !coupon_name || !coupon_type || !minimum_order_amount || !start_date || !end_date ) {
            return res.status(500).send({HasError: true, message: "Invalid parameter." })
        } else {
            const data = { coupon_code, coupon_name, description, coupon_type, minimum_order_amount, discount_amount, start_date, end_date, location, max_users, user_count, status }
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
            dataJson.max_users = newCoupon.max_users ? newCoupon.max_users : 0
            dataJson.user_count = newCoupon.user_count ? newCoupon.user_count : 0
            dataJson.status = newCoupon.status ? newCoupon.status : 0
            dataJson.status_name = newCoupon.status === 1 ? "Active" : (newCoupon.status === 2 ? "Inactive" : '')

            return res.status(200).send({ HasError: false, Message: "Coupon data inserted successfully.", result: dataJson })
        }
    } catch (error) {
        console.error(error)
        return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message })
    }
}

exports.applyCoupon = async (req, res) => {
    try {
        const coupon_code = req.body.coupon_code
        const user_id = req.body.user_id
        var currentDate = new Date();

        var result = await couponService.getCouponDetails(coupon_code)
        var orderDetails = await orderService.orderDetailsByCoupon(user_id, coupon_code)
        if (result) {
            console.log(typeof (orderDetails))
            if (!orderDetails) {
                couponDetails = result.toJSON()
                const startDate = new Date(couponDetails.start_date);
                const endDate = new Date(couponDetails.end_date);
                if (currentDate >= startDate && currentDate <= endDate) {
                    if (couponDetails.valid_user == null || couponDetails.valid_user == user_id) {
                        var cartDetails = await cartService.getCart(user_id)
                        const sub_total = cartDetails.reduce((total, num) => total + parseFloat(num.amount), 0)
                        console.log(sub_total)
                        if (sub_total >= couponDetails.minimum_order_amount) {
                            var total
                            total = sub_total - couponDetails.discount_amount
                            // if (couponDetails.coupon_type == 1) {//1-percentage,2-flat
                            //     total
                            // }
                            couponDetails.total_amount=total
                            return res.status(200).send({ HasError: false, Message: "Coupon apply successfully", result: couponDetails })
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
    } catch (error) {
        console.error(error)
        return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message })
    }
}
