const Coupon = require("../model/couponModel")


exports.createCoupon = async (data) => {
    try {
        var coupon = await Coupon.create(data)
        return coupon
    } catch (error) {
        console.log(error)
        return error
    }
}