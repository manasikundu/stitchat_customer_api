const db = require('../dbConnection')
const Rating = require('../model/ratingModel')
const Order = require('../model/boutiqueOrderModel')
const Appointment = require('../model/appointmentModel')

exports.addAndUpdateRating = async (rate_id, ratingData) => {
  try {
    var currentDate = new Date();
    var formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");
    ratingData.created_at = formattedDate
    if (rate_id) {
      var editRating = await Rating.update(ratingData, { where: { id: rate_id } });
      return editRating
    } else {
      var newRating = await Rating.create(ratingData)
      return newRating
    }
  } catch (error) {
    return error;
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

