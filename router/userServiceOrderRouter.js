const Order = require("../controller/userServiceOrderController")
const route = require("express-promise-router")
const router = new route();

router.post("/createOrder", Order.createOrder)
router.delete("/cancelAlterationOrRepairOrder", Order.cancelAlterationOrRepairOrder)

module.exports = router
