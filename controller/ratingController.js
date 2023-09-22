const { tr } = require('date-fns/locale');
const ratingservice = require('../service/ratingService')
const RatingService = require('../services/RatingService');

exports.createAndUpdateRatings = async (req, res) => {
    try {
        const { user_id, rating_id, rating_flag, rate, comment } = req.body;
        const ratingData = {user_id,rating_id,rating_flag,rate,comment};
        const newRating = await ratingservice.addRatings(rating_id, ratingData);
        return res.status(200).send({
            HasError: false,
            Message: "Rating added successfully.",
            result: newRating
          });
    } catch (error) {
        console.error(error);
        return res.status(200).send({
            HasError: true,
            Message: "Failed to add rating.",
          });
    }
}

