const Notification = require("../model/notificationModel")
const { Op } = require("sequelize")
const UserServiceCart = require("../model/userServiceCartModel")

exports.insertNotification = async (data) => {
    try {
        var notificationData = await Notification.create(data)
        return notificationData
    } catch (error) {
        console.log(error)
        return error
    }
}

exports.sendNotificationForItem = async () => {
    try {
        const itemNotification = await UserServiceCart.findAll({where: {order_id: { [Op.or]: [null, '']}}})
        return itemNotification
    } catch (error) {
        console.log(error)
        return error
    }
}
