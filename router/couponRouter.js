const Coupon = require("../controller/couponController")
const route = require("express-promise-router")
const router = new route();

router.post("/createCoupon", Coupon.createCoupon)


module.exports = router
