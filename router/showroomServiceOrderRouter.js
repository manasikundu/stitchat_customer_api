const showroomServiceOrderController = require("../controller/showroomServiceOrderController");
const route = require("express-promise-router");
const router = new route();

router.post("/createShowroomServiceOrder", showroomServiceOrderController.createShowroomServiceOrder)
router.post('/boutiqueAssign',showroomServiceOrderController.boutiqueAssign)
router.post('/updateStatus',showroomServiceOrderController.updateStatus)

module.exports = router;