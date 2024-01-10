const showroomRequestController = require("../controller/showroomRequestController");
const route = require("express-promise-router");
const router = new route();

router.post("/createShowroomRequest", showroomRequestController.createShowroomRequest)
module.exports = router;
