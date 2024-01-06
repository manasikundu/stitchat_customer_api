const Notification = require("../controller/notificationController")
const route = require("express-promise-router")
const router = new route();

router.get("/sendNotification", Notification.sendNotification)


module.exports = router
