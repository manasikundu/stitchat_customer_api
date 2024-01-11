const ShowroomServiceOrderService = require('../service/showroomServiceOrderService')
const Users = require("../model/userModel");
const Boutique = require("../model/userBoutiqueInfoModel");

exports.createShowroomServiceOrder = async (req, res) => {
    try {
        // const { body } = req;
        const s_user_id = req.body.s_user_id
        const c_name = req.body.c_name
        const c_mobile_number = req.body.c_mobile_number
        const c_email = req.body.c_email
        const c_area = req.body.c_area
        const c_address = req.body.c_address
        const c_landmark = req.body.c_landmark
        const c_pincode = req.body.c_pincode
        const c_city = req.body.c_city
        const c_state = req.body.c_state
        const category_item_dic_id = req.body.category_item_dic_id
        const alternation_type = req.body.alternation_type
        const quantity = req.body.quantity
        const total_amount = req.body.total_amount
        const exp_delivery_date = req.body.exp_delivery_date
        const parent_id = req.body.parent_id
        const fe_id = req.body.fe_id
        const boutique_id = req.body.boutique_id
        const status = req.body.status
        const log_report = req.body.log_report
        const invoice_number = req.body.invoice_number
        const s_user = await Users.findOne({ where: { id: s_user_id ,user_type_id: 7} })
        if (!s_user) {
            return res.status(400).send({
                message: "Invalid user ID.", HasError: true
            })
        } else {
            const fe_id = await Users.findOne({ where: { id: fe_id, user_type_id: 1} });
            if (!fe_id) {
                return res.status(400).send({
                    message: "Invalid Field executive ID.", HasError: true
                })
        } else {
            const boutique = await Boutique.findOne({ where: { id: boutique_id } });
            if (!boutique) {
                return res.status(400).send({
                    message: "Invalid boutique ID.", HasError:true
                });
            } else {
                const result = await ShowroomServiceOrderService.createShowroomServiceOrder(req.body);

                if (!result) {
                    return res.status(500).send({
                        message: "Failed to proceed data."
                    });
                } else {
                    return res.status(200).send({
                        message: "Successfully proceed data."
                    });
                }
            }
        }
    }
    } catch (error) {
        return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message });
    }
}