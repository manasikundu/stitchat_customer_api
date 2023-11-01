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
exports.getCouponDetails = async (coupon_code) => {
    const result = await Coupon.findOne({ where: { coupon_code: coupon_code } })
    return result
}
