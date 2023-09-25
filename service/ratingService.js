const db = require('../dbConnection')
const Rating = require('../model/ratingModel')
const Order = require('../model/boutiqueOrderModel')
const Appointment = require('../model/appointmentModel')

exports.createRatings = async (ratingData) => {
    try {
        var currentDate = new Date();
        var formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");
        ratingData.created_at = formattedDate;
        var newRating = await Rating.create(ratingData)
        return newRating
    } catch (error) {
        console.log(error)
        return error
    }
}

exports.updateRatings = async (rate_id, ratingData) => {
  try {
    var currentDate = new Date();
    var formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");
    ratingData.created_at = formattedDate;
    const editRating = await Rating.update(ratingData, { where: { id: rate_id } });
    return editRating
  } catch (error) {
    console.log(error)
    return error
  }
}

exports.listRatings = async (user_id) => {
  try {
      const ratings = await Rating.findAll({where: { user_id: user_id }})
      return ratings
  } catch (error) {
      console.error(error);
      return error;
  }
}

