const boutiqueController = require("../controller/userBoutiqueController");
const route = require("express-promise-router");
const router = new route();

router.post("/getAddress", boutiqueController.getAddress);
router.post("/homepage", boutiqueController.getNearestBoutiqueList);
router.get("/boutiqueDetails", boutiqueController.boutiqueDetails);
router.post("/getBoutiqueByPincode", boutiqueController.getBoutiqueByPincode);


module.exports = router;
