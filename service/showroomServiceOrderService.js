const ShowroomOrder=require('../model/showroomServiceOrderModel')

exports.createShowroomServiceOrder = async (data) => {
    try {
        const result = await ShowroomOrder.create(data,{ returning: true })
        return result
    } catch (error) {
        console.error(error);
        return error;
    }
  }