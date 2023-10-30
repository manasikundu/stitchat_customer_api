const Order = require("../model/userServiceOrderModel")


exports.createOrder = async (data) => {
  var result = await Order.create(data,{ returning: true })
  return result
}
exports.updateOrder = async (id,data) => {
  var result = await Order.update(data, { where: { id: id } ,returning:true})
  return result
}
exports.orderDetails = async (id) => {
  var result = await Order.findOne({ where: { id: id } })
  return result
}
exports.getCartHistory = async (user_id, order_id) => {
  try {
    if (!user_id && !order_id) {
      const orders = await Order.findAll()
      return orders
    } else if (user_id && !order_id) {
      const orders = await Order.findAll({ where: { user_id: user_id } })
      return orders
    } else if (!user_id && order_id) {
      const orders = await Order.findAll({ where: { id: order_id } })
      return orders
    } else {
      const orders = await Order.findAll({ where: { user_id: user_id, id: order_id } })
      return orders
    }
  } catch (error) {
    console.log(error)
    return error
  }
}

exports.getHistory = async (user_id) => {
  try {
    const orders = await Order.findAll({ where: { user_id: user_id } })
    return orders
  } catch (error) {
    console.log(error)
    return error
  }
}


