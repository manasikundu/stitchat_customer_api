const ratingService = require('../service/ratingService')
const Service = require('../service/userService')
const moment = require('moment')

exports.addRatings = async (req, res) => {
    try {
        const { user_id, rating_id, rating_flag, rate, comment } = req.body
        var method_name = await Service.getCallingMethodName();
        var apiEndpointInput = JSON.stringify(req.body);
        apiTrack = await Service.trackApi(req.query.user_id,method_name,apiEndpointInput,req.query.device_id,req.query.device_info,req.ip)
        const ratingData = {user_id,rating_id,rating_flag,rate,comment}
        const newRating = await ratingService.createRatings(ratingData)
        if (!user_id || !rating_id || !rating_flag || !rate || !comment) {
            return res.status(400).json({HasError: true,Message: "Invalid parameter."})
        } else {
            if (rating_flag === 1 || rating_flag === 2) {
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
            }
            return res.status(200).send({HasError: false,Message: "Rating added successfully.",result: result})
        } else {
            return res.status(500).send({HasError: true,Message: "Invalid rating_flag value."})
        }
    }    
    } catch (error) {
        console.error(error);
        return res.status(200).send({HasError: true,Message: "Failed to add rating."})
    }
}

exports.updateRatings = async (req, res) => {
    try {
        const rate_id = req.query.rate_id
        var method_name = await Service.getCallingMethodName();
        var apiEndpointInput = JSON.stringify(req.body);
        apiTrack = await Service.trackApi(req.query.user_id,method_name,apiEndpointInput,req.query.device_id,req.query.device_info,req.ip)
        const ratingData = {
            user_id: req.body.user_id,
            rating_id: req.body.rating_id,
            rating_flag: req.body.rating_flag,
            rate: req.body.rate,
            comment: req.body.comment
        }
        if (Object.keys(ratingData).length === 0) {
            return res.status(400).send({HasError: true,Message: "Invalid request."})
        } else {
            if (ratingData.rating_flag !== 1 && ratingData.rating_flag !== 2) {
                return res.status(400).send({HasError: true,Message: "Invalid rating_flag value."})
            }
            const updatedRating = await ratingService.updateRatings(rate_id, ratingData)
            if (updatedRating[0] === 1) {
                return res.status(200).send({HasError: false,Message: "Rating updated successfully."})
            } else {
                return res.status(500).send({HasError: true,Message: "Invalid parameter."})
            }
        }    
    } catch (error) {
        console.error(error);
        return res.status(500).send({HasError: true,Message: "Failed to update rating."})
    }
}

exports.listOfRatings = async (req, res) => {
    try {
        const ratingFlag = req.query.rating_flag
        var method_name = await Service.getCallingMethodName();
        var apiEndpointInput = JSON.stringify(req.body);
        apiTrack = await Service.trackApi(req.query.user_id,method_name,apiEndpointInput,req.query.device_id,req.query.device_info,req.ip)
        if (!ratingFlag) {
            return res.status(400).json({HasError: true,Message: "Invalid parameter."})
        }
        const ratings = await ratingService.listRatings(ratingFlag)
        if (ratingFlag === '1' || ratingFlag === '2') {
            return res.status(200).send({HasError: false,Message: "Ratings listed successfully.",result: ratings})
        } else {
            return res.status(500).send({HasError: true,Message: "Invalid rating_flag value."})
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send({HasError: true,Message: "Failed to list ratings."})
    }
}
