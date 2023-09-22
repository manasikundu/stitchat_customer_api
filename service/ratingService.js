const db = require('../dbConnection')
const Rating = require('../model/ratingModel')
const Order = require('../model/boutiqueOrderModel')
const Appointment = require('../model/appointmentModel')

// exports.addratings = async (rating_id, ratingData) => {
//     try {
//       if (rating_id) {
//         var editRating = await rating.update(ratingData, {where: { id: rating_id }})
//         return editRating;
//       } else {
//         var newRating = await rating.create(ratingData)
//         return newRating
//       }
//     } catch (error) {
//         console.log(error)
//         return error
//     }
// }

exports.addRatings = async (rating_id, ratingData) => {
    try {
        // Check whether rating_id corresponds to an appointment or an order
        const isAppointment = await Appointment.findOne({
            where: { id: rating_id },
        });

        const isOrder = await Order.findOne({
            where: { id: rating_id },
        });

        if (!isAppointment && !isOrder) {
            return('Invalid rating_id. No matching appointment or order found.');
        }

        // Assign the correct user_id based on whether it's an appointment or order
        if (isAppointment) {
            ratingData.user_id = isAppointment.customer_id;
        } else if (isOrder) {
            ratingData.user_id = isOrder.customer_id;
        }

        // Assign the correct rating_flag based on whether it's an appointment or order
        ratingData.rating_flag = isAppointment ? 1 : 2;

        // Create a new rating entry
        var currentDate = new Date();
        var formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");
        ratingData.created_at = formattedDate;
        const newRating = await Rating.create(ratingData);

        return newRating;
    } catch (error) {
        console.error(error);
        return error;
    }
};
