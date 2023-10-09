const Controller = require("../controller/userController");
const boutiqueController = require("../controller/userBoutiqueController");
const route = require("express-promise-router");
const router = new route();

router.post("/insertMobileNumber", Controller.insertMobileNumber);
router.post("/verifyOTP", Controller.verifyOTP);
router.get("/apiTrack", Controller.apiTrackList);
// router.post("/login", Controller.logIn);
// router.get("/verifyToken", Controller.verifyToken);
router.post("/userProfile", Controller.userProfile);
router.post("/updateProfile", Controller.updateProfile);
router.get("/aboutUs", Controller.aboutUs);
router.get("/contactInfo", Controller.contactInfo);
router.post("/contactUs", Controller.contactUs);
router.get("/privacyPolicy", Controller.privacyPolicy)
router.post("/profilePicUpload", Controller.profilePicUpload)






module.exports = router;
