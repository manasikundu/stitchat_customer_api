const ShowroomServiceOrderService = require('../service/showroomServiceOrderService')
const Users = require("../model/userModel");
const UsersAddress = require('../model/userAddressModel');

exports.createShowroomServiceOrder = async (req, res) => {
    try {
        const { body } = req;
        const currentDate = new Date()
        const formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ")

        const data = {
            s_user_id: body.user_id,
            c_name: body.customer_name,
            c_mobile_number: body.customer_mobile_number,
            c_email: body.customer_email,
            c_area: body.customer_area,
            c_address: body.customer_address,
            c_landmark: body.customer_landmark,
            c_pincode: body.customer_pincode,
            c_city: body.customer_city,
            c_state: body.customer_state,
            category_item_dic_id: body.category_item_dic_id,
            alternation_type: body.alternation_type,
            quantity: body.quantity,
            total_amount: body.total_amount,
            exp_delivery_date: body.exp_delivery_date,
            invoice_number: body.invoice_number,
            created_at: formattedDate,                   //generate booking code
            updated_at: formattedDate,
            note: body.note,
            d_name: body.deliver_customer_name,
            d_mobile_number: body.deliver_customer_mobile_number,
            delivery_label: body.delivery_label,
            alternation_json: JSON.stringify(body.alternation_json),
            delivery_type: body.delivery_type,
        }
        if (data.s_user_id) {//showroom user
            const s_user = await Users.findOne({ where: { id: data.s_user_id } })
            if (s_user) {
                Users.hasMany(UsersAddress, { foreignKey: 'user_id' });
                UsersAddress.belongsTo(Users, { foreignKey: 'user_id' });
                var fe = await Users.findOne({
                    where: {
                        user_type_id: 1,
                    },
                    include: [
                        {
                            model: UsersAddress,
                            where: {
                                pincode: data.c_pincode,
                            },
                        },
                    ],
                });
                if (fe) {
                    fe = fe.toJSON()
                    data.fe_id = fe.id
                    const result = await ShowroomServiceOrderService.createShowroomServiceOrder(data);
                    if (result) {
                        const currentDate = new Date();
                        const year = currentDate.getFullYear();
                        const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
                        const day = currentDate.getDate().toString().padStart(2, '0');
                        const id = result.toJSON().id
                        const code = `SATALT${year}${month}${day}${id}`;
                        const updateBookingCode = await ShowroomServiceOrderService.updateBookingCode(id, code);
                        return res.status(200).send({ message: "Order Placed Successfully", HasError: false, result: updateBookingCode });
                    } else {
                        return res.status(500).send({ message: "Failed to place order", HasError: true });
                    }
                } else {
                    return res.status(200).send({ message: "Unable to find field executive", HasError: true });
                }
            } else {
                return res.status(200).send({ message: "This showroom doesn't exist.", HasError: true });
            }
        } else {
            return res.status(400).send({ message: "Please enter showroom id.", HasError: true });
        }
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
        const status = req.body.status
        if (order_id && status) {
            const result = await ShowroomServiceOrderService.updateStatus(order_id, status)
            if (result.length != 0) {
                return res.status(200).send({ message: "Status updated succesfully.", HasError: false, data: result[1] });
            } else {
                return res.status(500).send({ message: "Failed to assign a boutique.", HasError: true });
            }
        } else {
            return res.status(200).send({ message: "Please enter required field.", HasError: true });
        }
    } catch (error) {
        return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message });
    }
}