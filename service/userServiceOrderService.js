const Order = require("../model/userServiceOrderModel")
const Items = require("../model/userServiceCartModel")
const db = require("../dbConnection");


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

exports.getOrderHistory = async (order_id) => {
  try {
    const orders = await Order.findAll({ where: { id: order_id } })
    return orders
  } catch (error) {
    console.log(error)
    return error
  }
}

exports.orderDetailsByCoupon = async (user_id,coupon_code) => {
  var result = await Order.findOne({ where: { user_id: user_id, coupon_code:coupon_code} })
  return result
}

exports.getItems = async (order_id) => {
  var result = await Items.findOne({ where: {order_id: order_id} })
  return result
}

exports.cancelOrder = async (order_id) => {
  try {
    var query = `UPDATE public.sarter__users_service_order AS o SET "status" = s.id FROM public.sarter__order_status_dic AS s WHERE o.id = ${order_id} AND s.status = 'Order Cancelled'`
    var result = await db.query(query) 
    return result[0]
  } catch (error) {
    console.log(error)
    return error
  }
}  

exports.cancelItem = async (order_id) => {
  try {
    var query = `UPDATE public.sarter__users_service_cart AS i SET status = 8 WHERE i.order_id = '${order_id}'`
    // var query = `UPDATE public.sarter__users_service_cart AS i SET status = s.status, status_id = 8 FROM public.sarter__order_status_dic AS s WHERE i.order_id = ${order_id} AND s.status = 'Order Cancelled'`
    var result = await db.query(query)
    return result[0]
  } catch (error) {
    console.log(error)
    return error
  }
}

