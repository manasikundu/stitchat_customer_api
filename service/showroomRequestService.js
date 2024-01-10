const ShowroomRequest=require('../model/showroomRequestModel')

exports.createRequest = async (data) => {
    try {
        const result = await ShowroomRequest.create(data,{ returning: true })
        return result
    } catch (error) {
        console.error(error);
        return error;
    }
  }