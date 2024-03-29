const orderController = require("../controller/orderController");
const route = require("express-promise-router");
const router = new route();

router.get("/orderList", orderController.orderList);
router.get("/orderDetails", orderController.orderDetails)
router.delete("/cancelOrder", orderController.cancelOrder)

module.exports = router;
