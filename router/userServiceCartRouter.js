const UserServiceCart = require("../controller/userServiceCartController")
const route = require("express-promise-router")
const router = new route();

router.post("/createServiceCart", UserServiceCart.createServiceCart)
router.get("/getCart", UserServiceCart.getCart)
router.delete("/removeCart", UserServiceCart.removeCart)
router.post("/updateCart", UserServiceCart.updateCart)


module.exports = router
