let boutiqueController = require("../controller/userBoutiqueController");
const route = require("express-promise-router");
const router = new route();

router.post("/getAddress", boutiqueController.getAddress);
router.post("/homepage", boutiqueController.getNearestBoutiqueList);

module.exports = router;
