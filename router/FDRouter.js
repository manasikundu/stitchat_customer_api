let designersController = require("../controller/FDController");
const route = require("express-promise-router");
const router = new route();

router.post("/fashionDesignerListing", designersController.fashionDesignerList);
router.post("/designersDetails", designersController.FashionDesignerDetails);
router.post("/fashionDesignerTimeSlot", designersController.fashionDesignerTimeSlot)
router.post("/addNewAddress", designersController.addNewAddress)
router.get("/getStateList", designersController.getStateList)
router.post("/getCityList", designersController.getCityList)
router.post("/addressList", designersController.getAddressList)

module.exports = router;
