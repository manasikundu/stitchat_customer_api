let designersController = require("../controller/FDController");
const route = require("express-promise-router");
const router = new route();

router.post("/fashionDesignerListing", designersController.fashionDesignerList);
router.post("/designersDetails", designersController.FashionDesignerDetails);
router.post("/fashionDesignerTimeSlot", designersController.fashionDesignerTimeSlot)
router.post("/addNewAddress", designersController.addNewAddress)
router.get("/getStateList", designersController.getStateList)
router.post("/getCityList", designersController.getCityList)
router.get("/addressList", designersController.getAddressList)
router.delete("/deleteAddress", designersController.deleteAddress)
router.post("/bookAppointment", designersController.bookAppointment)
router.get("/appointmentList", designersController.appointmentList)
router.get("/fashionDesignerAppointmentDetails", designersController.fashionDesignerAppointmentDetails)



module.exports = router;
