const orderController = require("../controller/orderController");
const route = require("express-promise-router");
const router = new route();

router.get("/orderList", orderController.orderList);

module.exports = router;
