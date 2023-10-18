const VideoInquire = require("../model/videoEnquireModel")


exports.createVideoInquire = async (data) => {
    try {
        var videoInquireData = await VideoInquire.create(data)
        return videoInquireData
    } catch (error) {
        console.log(error)
        return error
    }
}