const ShowroomOrder = require('../model/showroomServiceOrderModel')

exports.createShowroomServiceOrder = async (data) => {
    try {
        const result = await ShowroomOrder.create(data, { returning: true })
        return result
    } catch (error) {
        console.error(error);
        return error;
    }
}

exports.boutiqueAssign = async (boutique_id, order_id) => {
    const result = await ShowroomOrder.update({ boutique_id: boutique_id }, { where: { id: order_id }, returning: true })
    return result
}

exports.updateStatus = async (order_id, status) => {
    const result = await ShowroomOrder.update({ status: status }, { where: { id: order_id }, returning: true })
    return result
}