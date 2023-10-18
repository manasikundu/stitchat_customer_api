const videoInquireService = require('../service/videoEnquireService')
const moment = require('moment')
const Users = require("../model/userModel")
const VideoInquire = require("../model/videoEnquireModel")
const categoryItem = require("../model/categoryItemModel")



exports.createVideoInquire = async (req, res) => {
    try {
        const name = req.body.name
        const email = req.body.email
        const guest_email = req.body.guest_email
        const item_id = req.body.item_id
        const service_type = req.body.service_type
        const note = req.body.note
        const date_time = req.body.date_time
        const data = {name, email, guest_email, item_id, service_type, note, date_time}
        const newService = await videoInquireService.createVideoInquire(data)
        var dataJson = {}
        dataJson.id = newService.id
        dataJson.user_id = newService.name
        dataJson.total_amount = newService.email
        dataJson.address_details = newService.item_id
        dataJson.address_id = newService.service_type
        dataJson.note = newService.note
        dataJson.date_time = moment(newService.date_time).format('YYYY-MM-DD HH:mm:ss')

        return res.status(200).send({ HasError: false, Message: "Video Inquiry data inserted successfully.", result: dataJson });

    // if (!name || !email || !guest_email || !item_id || !service_type || !note || !date_time) {
    //     return res.status(400).send({ HasError: true, Message: "Invalid parameter." })
    // } else {
    //     const itemId = await categoryItem.findOne({ where: { id: item_id } });
    //     if (!itemId) {
    //         return res.status(200).send({ HasError: true, Message: "Item id does not exist." })
    //     } else {
    //         const existingEmail = await VideoInquire.findOne({ where: { email } })
    //         if (existingEmail) {
    //             return res.status(200).send({ HasError: true, Message: "Email is already in use." })
    //         } else {
    //             const data = {name, email, guest_email, item_id, service_type, note, date_time}
    //             const newService = await videoInquireService.createVideoInquire(data)
    //             var dataJson = {}
    //             dataJson.id = newService.id
    //             dataJson.user_id = newService.name
    //             dataJson.total_amount = newService.email
    //             dataJson.address_details = newService.item_id
    //             dataJson.address_id = newService.service_type
    //             dataJson.note = newService.note
    //             dataJson.date_time = moment(newService.date_time).format('YYYY-MM-DD HH:mm:ss')

    //             return res.status(200).send({ HasError: false, Message: "Video Inquiry data inserted successfully.", result: dataJson });
    //         }
    //     }
    // }
    } catch (error) {
    console.error(error)
    return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message });
}
}
