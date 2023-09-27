const ratingService = require('../service/ratingService')
const Service = require('../service/userService')
const moment = require('moment')

exports.addAndUpdateRating = async (req, res) => {
    try {
        const rate_id = req.query.rate_id;
        const { user_id, rating_id, rating_flag, rate, comment } = req.body;
        var method_name = await Service.getCallingMethodName();
        var apiEndpointInput = JSON.stringify(req.body);
        apiTrack = await Service.trackApi(req.query.user_id, method_name, apiEndpointInput, req.query.device_id, req.query.device_info, req.ip);
        const ratingData = { user_id, rating_id, rating_flag, rate, comment };
        if (rating_flag !== 1 && rating_flag !== 2) {
            return res.status(400).send({ HasError: true, Message: "Invalid flag value." });
        }
        if (rate_id) {
            const updatedRating = await ratingService.updateRatings(rate_id, ratingData)
            if (updatedRating[0] === 1) {
                return res.status(200).send({ HasError: false, Message: "Rating updated successfully." });
            } else if (Object.keys(ratingData).length === 0) {
                return res.status(400).send({HasError: true,Message: "Invalid parameter."})
            } else {
                return res.status(500).send({ HasError: true, Message: "Invalid rating info." });
            }
        } else {
            const newRating = await ratingService.createRatings(ratingData)
            const result = {
                id: newRating.id,
                user_id: newRating.user_id,
                rating_id: newRating.rating_id,
                rating_flag: newRating.rating_flag,
                rate: newRating.rate,
                comment: newRating.comment,
                created_at: moment(newRating.created_at).format('YYYY-MM-DD HH:mm:ss'),
                ip: req.ip,
                device_id: newRating.device_id,
                device_info: newRating.device_info,
            };
            return res.status(200).json({ HasError: false, Message: "Rating added successfully.", result: result });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ HasError: true, Message: "Failed to add/update rating." });
    }
}

exports.ratingList = async (req, res) => {
    try {
        const user_id = req.query.user_id
        var method_name = await Service.getCallingMethodName();
        var apiEndpointInput = JSON.stringify(req.body);
        apiTrack = await Service.trackApi(req.query.user_id,method_name,apiEndpointInput,req.query.device_id,req.query.device_info,req.ip)
        if (!user_id) {
            return res.status(400).send({HasError: true,Message: "Invalid parameter."})
        } else {
            const ratings = await ratingService.listRatings(user_id)
            return res.status(200).send({HasError: false,Message: "Ratings listed successfully.",result: ratings})
        } 
    } catch (error) {
        console.error(error);
        return res.status(500).send({HasError: true,Message: "Failed to list ratings."})
    }
}
