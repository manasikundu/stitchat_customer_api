const tailorController = require("../controller/tailorController");
const route = require("express-promise-router");
const router = new route();

router.get("/itemListForTailor", tailorController.itemListForTailor)

module.exports = router;
