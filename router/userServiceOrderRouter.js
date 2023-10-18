const UserServiceOrder = require("../controller/userServiceOrderController")
const route = require("express-promise-router")
const router = new route();

router.post("/createServiceOrder", UserServiceOrder.createServiceOrder)


module.exports = router
