const tailorController = require("../controller/tailorController");
const route = require("express-promise-router");
const router = new route();

router.get("/itemListForTailor", tailorController.itemListForTailor)
router.get("/serviceType", tailorController.serviceType)
router.get("/alterationType", tailorController.alterationType)


module.exports = router;
