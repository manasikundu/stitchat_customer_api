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

exports.getCartHistory = async (user_id, order_id) => {
  try {
    if (!user_id && !order_id) {
      const orders = await UserServiceOrder.findAll()
      return orders
    } else if (user_id && !order_id) {
      const orders = await UserServiceOrder.findAll({where: { user_id: user_id }})
      return orders
    } else if (!user_id && order_id) {
      const orders = await UserServiceOrder.findAll({where: { id:order_id }})
      return orders
    } else {
      const orders = await UserServiceOrder.findAll({where: { user_id: user_id, id: order_id }})
      return orders
    }
    } catch (error) {
      console.log(error)
      return error 
    }
}

