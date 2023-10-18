const UserServiceOrder = require("../model/userServiceOrderModel")


exports.createServiceCart = async (cartData) => {
    try {
        var serviceCartOrder = await UserServiceOrder.create(cartData)
        return serviceCartOrder
    } catch (error) {
        console.log(error)
        return error
    }
}