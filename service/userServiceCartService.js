const UserServiceCart = require("../model/userServiceCartModel")

exports.createServiceCart = async (cartData) => {
    try {
      var serviceCart = await UserServiceCart.create(cartData)
      return serviceCart
    } catch (error) {
        console.log(error)
      return error;
    }
}
exports.getCartByUserId = async (user_id) => {
  const result = await UserServiceCart.findAll({ where: { user_id: user_id } })
  return result
}

exports.deleteCart = async (id) => {
  const result = await UserServiceCart.destroy({ where: { id: id } })
  return result
}
exports.updateCart = async (id, data) => {
  const result = await UserServiceCart.update(data, { where: { id: id } ,returning:true})
  return result
}