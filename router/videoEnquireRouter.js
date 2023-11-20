const VideoInquire = require("../controller/videoEnquireController")
const route = require("express-promise-router")
const router = new route();

router.post("/createVideoInquire", VideoInquire.createVideoInquire)
router.get("/notification", VideoInquire.notification)


module.exports = router
