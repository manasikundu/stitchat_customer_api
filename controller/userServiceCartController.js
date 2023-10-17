const { da } = require('date-fns/locale');
const cartService = require('../service/userServiceCartService')
const moment = require('moment')
const categoryItem = require("../model/categoryItemModel")
const Users = require("../model/userModel")


exports.createServiceCart = async (req, res) => {
  try {
    const user_id = req.body.user_id
    const category_id = req.body.category_id
    const sub_category_id = req.body.sub_category_id
    const alternataion_type = req.body.alternation_type
    const filter_choice= req.body.filter_choice
    const filter_type_description=req.body.filter_type_description
    const tailor_note=req.body.tailor_note
    const item_description=req.body.item_description
    const repair_location=req.body.repair_location
    const amount = req.body.amount;
    if (!user_id || !category_id || !sub_category_id || !alternataion_type || !amount) {
      return res.status(400).send({ HasError: true, Message: "Invalid parameter." })
    } else {
      const categoryId = await categoryItem.findOne({ where: { id: category_id } });
      if (!categoryId) {
        return res.status(200).send({ HasError: true, Message: "category id does not exist." })
      } else {
        const userId = await Users.findOne({ where: { id: user_id } })
        if (!userId) {
          return res.status(200).send({ HasError: true, Message: "User id does not exist." })
        } else {
          var currentDate = new Date();
          var formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ")
          const data = {
            user_id,
            category_id,
            sub_category_id,
            order_id: null,
            alternataion_type,
            amount,
            service_date_time: null,
            status: 0,
            created_at: formattedDate,
            updated_at: formattedDate,
            filter_choice,
            filter_type_description,
            tailor_note,
            item_description,
            repair_location
          }
          const newService = await cartService.createServiceCart(data)
          var dataJson = {}
          dataJson.id = newService.id
          dataJson.user_id = newService.user_id
          dataJson.sub_category_id = newService.sub_category_id
          dataJson.order_id = newService.order_id
          dataJson.alternation_type = newService.alternataion_type
          dataJson.amount = newService.amount
          dataJson.service_date_time = newService.service_date_time
          dataJson.status = newService.status
          dataJson.created_at = moment(newService.created_at).format('YYYY-MM-DD HH:mm:ss')
          dataJson.filter_choice = newService.filter_choice
          dataJson.filter_type_description = newService.filter_type_description
          dataJson.tailor_note = newService.tailor_note
          dataJson.item_description = newService.item_description
          dataJson.repair_location = newService.repair_location

          return res.status(200).send({ HasError: false, Message: "Service cart data inserted successfully.", result: dataJson });
        }
      }
    }
  } catch (error) {
    console.error(error)
    return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message });
  }
}



exports.removeCart = async (req, res) => {
  try {
    const id = req.body.id
    const result = await cartService.deleteCart(id)
    if (result == null) {
      return res.status(200).send({
        message: "Successfully Proceed data",
      })
    } else {
      return res.status(500).send({
        message: "failed",
      })
    }
  } catch (error) {
    return res.status(500).send({ message: "Some thing went wrong.", HasError: true, error: error.message })
  }
}