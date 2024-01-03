const Notification = require("../model/notificationModel")


exports.insertNotification = async (data) => {
    try {
        var notificationData = await Notification.create(data)
        return notificationData
    } catch (error) {
        console.log(error)
        return error
    }
}