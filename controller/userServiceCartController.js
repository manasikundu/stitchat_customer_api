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
    const alternation_type = req.body.alternation_type
    const amount = req.body.amount;
    if (!user_id || !category_id || !sub_category_id || !alternation_type || !amount) {
      return res.status(400).send({ HasError: true, Message: "Invalid parameter." })
    } else {
        const categoryId = await categoryItem.findOne({ where: { id: category_id } });
        if (!categoryId) {
          return res.status(200).send({ HasError: true, Message: "Invalid category id." })
    } else {
        const userId = await Users.findOne({where: {id: user_id}})
        if (!userId) {
            return res.status(200).send({ HasError: true, Message: "Invalid user id." })
        } else {
            var currentDate = new Date();
            var formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ")
            const data = {
                user_id,
                category_id,
                sub_category_id,
                order_id: null,
                alternation_type,
                amount,
                service_date_time: null,
                status: 0,
                created_at: formattedDate,
                updated_at: formattedDate
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
            return res.status(200).send({ HasError: false, Message: "Service cart data inserted successfully.", result: dataJson });
            }
        }
    }
    } catch (error) {
        console.error(error)
        return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message });
    }
}


