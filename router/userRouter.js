let Controller = require("../controller/userController");
let boutiqueController = require("../controller/userBoutiqueController");
const route = require("express-promise-router");
const router = new route();

router.post("/insertMobileNumber", Controller.insertMobileNumber);
router.post("/verifyOTP", Controller.verifyOTP);
router.get("/apiTrack", Controller.apiTrackList);
router.post("/login", Controller.logIn);
router.get("/verifyToken", Controller.verifyToken);
router.post("/userProfile", Controller.userProfile);
router.patch("/updateProfile/:id", Controller.updateProfile);



module.exports = router;
