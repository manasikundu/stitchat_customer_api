const { tr } = require('date-fns/locale');
const ratingservice = require('../service/ratingService')

exports.addRatings = async (req, res) => {
    try {
        const { rating_id } = req.body; 
        const ratingData = req.body; 

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
};