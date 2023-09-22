const db = require('../dbConnection')
const Rating = require('../model/ratingModel')
const Order = require('../model/boutiqueOrderModel')
const Appointment = require('../model/appointmentModel')

exports.createAndUpdateRatings = async (rating_id, ratingData) => {
    try {
      if (rating_id) {
        var editRating = await Rating.update(ratingData, {where: { id: rating_id }})
        return editRating;
      } else {
        var currentDate = new Date();
        var formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");
        ratingData.created_at = formattedDate;
        var newRating = await Rating.create(ratingData)
        return newRating
      }
    } catch (error) {
        console.log(error)
        return error
    }
}

// exports.addRatings = async (rating_id, ratingData) => {
//     try {
//         var currentDate = new Date();
//         var formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");
//         ratingData.created_at = formattedDate;
//         const newRating = await Rating.create(ratingData);
//         return newRating;
//     } catch (error) {
//         console.error(error);
//         return error;
//     }
// };
