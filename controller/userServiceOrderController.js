const cartServiceOrder = require('../service/userServiceOrderService')
const moment = require('moment')
const Users = require("../model/userModel")
const UsersAddress = require("../model/userAddressModel")


exports.createServiceOrder = async (req, res) => {
  try {
    const user_id = req.body.user_id
    const total_amount = req.body.total_amount
    const address_details = req.body.address_details
    const address_id = req.body.address_id
    
    if (!user_id || !total_amount || !address_details || !address_id) {
        return res.status(400).send({ HasError: true, Message: "Invalid parameter." })
    } else {
        const addressId = await UsersAddress.findOne({ where: { id: address_id } });
        if (!addressId) {
            return res.status(200).send({ HasError: true, Message: "Address id does not exist." })
        } else {
            const userId = await Users.findOne({ where: { id: user_id } })
            if (!userId) {
                return res.status(200).send({ HasError: true, Message: "User id does not exist." })
            } else {
                var currentDate = new Date();
                var formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ")
                const data = {user_id, total_amount, address_details, address_id, status: 1, created_at: formattedDate, updated_at: formattedDate}
                const newService = await cartServiceOrder.createServiceCart(data)
                var dataJson = {}
                dataJson.id = newService.id
                dataJson.user_id = newService.user_id
                dataJson.total_amount = newService.total_amount
                dataJson.address_details = newService.address_details
                dataJson.address_id = newService.address_id
                dataJson.status = newService.status
                dataJson.created_at = moment(newService.created_at).format('YYYY-MM-DD HH:mm:ss')
    
                return res.status(200).send({ HasError: false, Message: "Service order data inserted successfully.", result: dataJson });
            }
        }
    }
    } catch (error) {
        console.error(error)
        return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message });
    }
}
