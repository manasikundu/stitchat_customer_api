const videoInquireService = require('../service/videoEnquireService')
const moment = require('moment')
const Users = require("../model/userModel")
const VideoInquire = require("../model/videoEnquireModel")
const categoryItem = require("../model/categoryItemModel")
const Service = require('../service/userService')
const logService = require('../service/logService')


exports.createVideoInquire = async (req, res) => {
    try {
        const name = req.body.name
        const email = req.body.email
        const guest_email = req.body.guest_email
        const item_id = req.body.item_id
        const service_type = req.body.service_type
        const note = req.body.note
        const date_time = req.body.date_time
        const currentDate = new Date()
        const inputDate = new Date(date_time)
        var method_name = await Service.getCallingMethodName()
        var apiEndpointInput = JSON.stringify(req.body)
        var apiTrack = await Service.trackApi(req.query.user_id, method_name, apiEndpointInput, req.query.device_id, req.query.device_info, req.ip)

        if (inputDate < currentDate) {
            return res.status(400).send({ message: "Invalid date_time.", HasError: true })
        } else {
            const data = { name, email, guest_email, item_id, service_type, note, date_time }
            // const parsedDateTime = moment(date_time, ['Y-M-D H:m:s', 'D-M-YY H:m:s', 'M/D/Y H:m:s', 'Y/M/D H:m:s'], true);
            const formattedDate = moment(date_time).format('YYYY-MM-DD HH:mm:ss')

            const newService = await videoInquireService.createVideoInquire({ ...data, date_time: formattedDate })
            // const newService = await videoInquireService.createVideoInquire(data)
            var enquiry_id = "STIVI3526" + newService.id.toString().padStart(3, '0')
            newService.enquiry_id = enquiry_id
            var dataJson = {}
            dataJson.id = newService.id ? newService.id : 0
            dataJson.name = newService.name ? newService.name : ''
            dataJson.email = newService.email ? newService.email : ''
            dataJson.item_id = newService.item_id ? newService.item_id : ''
            dataJson.service_type = newService.service_type ? newService.service_type : ''
            dataJson.note = newService.note ? newService.note : ''
            dataJson.date_time = formattedDate ? formattedDate : ''
            dataJson.enquiry_id = enquiry_id ? newService.enquiry_id : ''

            return res.status(200).send({ HasError: false, Message: "Video Inquiry data inserted successfully.", result: dataJson });
        }
    } catch (error) {
        console.error(error)
        const logData = { user_id: "", status: 'false', message: error.message, device_id: '', created_at: Date.now(), updated_at: Date.now(), device_info: '', action: req.url }
        const log = await logService.createLog(logData)
        return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message });
    }
}
