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