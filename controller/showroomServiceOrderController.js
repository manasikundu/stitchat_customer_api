const ShowroomServiceOrderService = require('../service/showroomServiceOrderService')
const User = require("../model/userModel");
const Boutique = require("../model/userBoutiqueInfoModel");
const Address = require('../model/userAddressModel');
const { where } = require('sequelize');

exports.createShowroomServiceOrder = async (req, res) => {
    try {
        const { body } = req;
        if (body.s_user_id) {
            const s_user = await User.findOne({ where: { id: body.s_user_id } })//need to add user_type_id
            if (s_user) {
                const fe = await Address.findAll({ where: { pincode: body.c_pincode } });
                const feJSON = fe.map(instance => instance.toJSON());
                // console.log(feJSON)
                for (let i in feJSON) {
                    console.log(feJSON[i].user_id)
                    const fe_details = await User.findOne({ where: { id: feJSON[i].user_id, user_type_id: 1 } })
                    console.log(fe_details)
                }
            } else {
                return res.status(200).send({ message: "This showroom doesn't exist.", HasError: true });
            }
        } else {
            return res.status(400).send({ message: "Please enter showroom id.", HasError: true });
        }

        //     const s_user_id = req.body.s_user_id
        //     const c_name = req.body.c_name
        //     const c_mobile_number = req.body.c_mobile_number
        //     const c_email = req.body.c_email
        //     const c_area = req.body.c_area
        //     const c_address = req.body.c_address
        //     const c_landmark = req.body.c_landmark
        //     const c_pincode = req.body.c_pincode
        //     const c_city = req.body.c_city
        //     const c_state = req.body.c_state
        //     const category_item_dic_id = req.body.category_item_dic_id
        //     const alternation_type = req.body.alternation_type
        //     const quantity = req.body.quantity
        //     const total_amount = req.body.total_amount
        //     const exp_delivery_date = req.body.exp_delivery_date
        //     const parent_id = req.body.parent_id
        //     const fe_id = req.body.fe_id
        //     const boutique_id = req.body.boutique_id
        //     const status = req.body.status
        //     const log_report = req.body.log_report
        //     const invoice_number = req.body.invoice_number
        //     const s_user = await Users.findOne({ where: { id: s_user_id ,user_type_id: 7} })
        //     if (!s_user) {
        //         return res.status(400).send({
        //             message: "Invalid user ID.", HasError: true
        //         })
        //     } else {
        //         const fe_id = await Users.findOne({ where: { id: fe_id, user_type_id: 1} });
        //         if (!fe_id) {
        //             return res.status(400).send({
        //                 message: "Invalid Field executive ID.", HasError: true
        //             })
        //     } else {
        //         const boutique = await Boutique.findOne({ where: { id: boutique_id } });
        //         if (!boutique) {
        //             return res.status(400).send({
        //                 message: "Invalid boutique ID.", HasError:true
        //             });
        //         } else {
        //             const result = await ShowroomServiceOrderService.createShowroomServiceOrder(req.body);

        //             if (!result) {
        //                 return res.status(500).send({
        //                     message: "Failed to proceed data."
        //                 });
        //             } else {
        //                 return res.status(200).send({
        //                     message: "Successfully proceed data."
        //                 });
        //             }
        //         }
        //     }
        // }
    } catch (error) {
        return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message });
    }
}

exports.boutiqueAssign = async (req, res) => {
    try {
        const boutique_id = req.body.boutique_id
        const order_id = req.body.order_id
        if (boutique_id && order_id) {
            const result = await ShowroomServiceOrderService.boutiqueAssign(boutique_id, order_id)
            console.log(result)
            if (result.length != 0) {
                return res.status(200).send({ message: "Boutique assigned sucessfully.", HasError: false, data: result[1] });
            } else {
                return res.status(500).send({ message: "Failed to assign a boutique.", HasError: true });
            }
        } else {
            return res.status(200).send({ message: "Please enter required field.", HasError: false });
        }
    } catch (error) {
        return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message });
    }
}

exports.updateStatus = async (req, res) => {
    try {
        const order_id = req.body.order_id
        const status=req.body.status
        if (order_id && status){
            const result = await ShowroomServiceOrderService.updateStatus(order_id,status)
            if (result.length != 0) {
                return res.status(200).send({ message: "Status updated succesfully.", HasError: false, data: result[1] });
            } else {
                return res.status(500).send({ message: "Failed to assign a boutique.", HasError: true });
            }
        }else{
            return res.status(200).send({ message: "Please enter required field.", HasError: true });
        }
    } catch (error) {
        return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message });
    }
}