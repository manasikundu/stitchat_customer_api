const showroomServiceOrderController = require("../controller/showroomServiceOrderController");
const route = require("express-promise-router");
const router = new route();

router.post("/createShowroomServiceOrder", showroomServiceOrderController.createShowroomServiceOrder)
module.exports = router;