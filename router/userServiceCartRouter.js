const UserServiceCart = require("../controller/userServiceCartController")
const route = require("express-promise-router")
const router = new route();

router.post("/createServiceCart", UserServiceCart.createServiceCart)

module.exports = router
