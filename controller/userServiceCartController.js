const { da } = require('date-fns/locale');
const cartService = require('../service/userServiceCartService')
const moment = require('moment')
const categoryItem = require("../model/categoryItemModel")
const Users = require("../model/userModel")


exports.createServiceCart = async (req, res) => {
  try {
    const user_id = req.body.user_id
    const item_id = req.body.item_id
    const service_id = req.body.service_id
    const type = req.body.type
    const fit_type = req.body.fit_type
    const fit_description = req.body.fit_description
    const tailor_note = req.body.tailor_note
    const item_description = req.body.item_description
    const repair_location = req.body.repair_location
    const amount = req.body.amount;
    const repair_description = req.body.repair_description
    if (!user_id || !item_id || !service_id || !type || !amount) {
      return res.status(400).send({ HasError: true, Message: "Invalid parameter." })
    } else {
      const item = await categoryItem.findOne({ where: { id: item_id } });
      if (!item) {
        return res.status(200).send({ HasError: true, Message: "Item id does not exist." })
      } else {
        const userId = await Users.findOne({ where: { id: user_id } })
        if (!userId) {
          return res.status(200).send({ HasError: true, Message: "User id does not exist." })
        } else {
          var currentDate = new Date();
          var formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ")
          const data = {
            user_id, item_id, service_id, order_id: null, type, amount, service_date_time: null, status: 0, created_at: formattedDate, updated_at: formattedDate,
            fit_type, fit_description, tailor_note, item_description, repair_location, repair_description
          }
          const newService = await cartService.createServiceCart(data)
          var dataJson = {}
          dataJson.id = newService.id
          dataJson.user_id = newService.user_id
          dataJson.item_id = newService.item_id
          dataJson.service_id = newService.service_id
          dataJson.type = newService.type
          if (newService.type == 1) {
            dataJson.type_name = "ALTER"
          } else if (newService.type == 2) {
            dataJson.type_name = "REPAIR"
          }
          dataJson.amount = newService.amount
          // dataJson.service_date_time = newService.service_date_time
          dataJson.status = newService.status
          dataJson.created_at = moment(newService.created_at).format('YYYY-MM-DD HH:mm:ss')
          dataJson.fit_type = newService.fit_type
          dataJson.fit_description = newService.fit_description
          dataJson.tailor_note = newService.tailor_note
          dataJson.item_description = newService.item_description
          dataJson.repair_location = newService.repair_location
          dataJson.repair_description = newService.repair_description

          return res.status(200).send({ HasError: false, Message: "Service cart data inserted successfully.", result: dataJson });
        }
      }
    }
  } catch (error) {
    console.error(error)
    return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message });
  }
}

exports.getCart = async (req, res) => {
  try {
    const user_id = req.query.user_id
    if (user_id) {
      const user = await Users.findOne({ where: { id: user_id } })
      if (user) {
        var data = await cartService.getCartByUserId(user_id)
        if (data.length != 0) {
          const sub_total=data.reduce((total,num)=>total + parseFloat(num.amount),0)
          const delivery_fee=50
          const total=parseFloat(sub_total)+parseFloat(delivery_fee)
          return res.status(200).send({ message: "Successfully fetched data", HasError: false, result: {data:data,sub_total:sub_total,delivery_fee:`${delivery_fee}`,total:`${total}` } });
        }
      } else {
        return res.status(200).send({ message: "This user doesn't exist", HasError: false });
      }
    } else {
      return res.status(400).send({ message: "Please enter a userId", HasError: true });
    }
  } catch (error) {
    return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message });
  }
}

exports.removeCart = async (req, res) => {
  try {
    const id = req.body.id
    const result = await cartService.deleteCart(id)
    if (result == 0) {
      return res.status(200).send({
        message: "Successfully Proceed data",
      })
    } else {
      return res.status(500).send({
        message: "failed to remove",
      })
    }
  } catch (error) {
    return res.status(500).send({ message: "Some thing went wrong.", HasError: true, error: error.message })
  }
}

exports.updateCart = async (req, res) => {
  try {
    const requestData = req.body;
    const results = await Promise.all(
      requestData.map(async (updateData) => {
        const id = updateData.cart_id;
        const data = { ...updateData };
        delete data['cart_id'];
        const result = await cartService.updateCart(id, data);
        return result[0] !== 0;
      })
    );

    const successCount = results.filter((result) => result).length;
    if (successCount === requestData.length) {
      return res.status(200).send({
        message: "All Carts Successfully Updated.",
        HasError: false,
      });
    } else {
      return res.status(500).send({
        message: "Some Carts failed to update.",
        HasError: true,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Something went wrong.", HasError: true });
  }
};
