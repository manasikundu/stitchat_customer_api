const videoInquireService = require('../service/videoEnquireService')
const moment = require('moment')
const Users = require("../model/userModel")
const VideoInquire = require("../model/videoEnquireModel")
const categoryItem = require("../model/categoryItemModel")
const Service = require('../service/userService')
const logService = require('../service/logService')
const FCM = require('fcm-node');
const config=require("../config/fcm.json")
const s3 = require("../config/s3Config");
const dotenv = require("dotenv");
dotenv.config();

var expirationTime = 600;


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

            var serverKey=config.serverKey
            var fcm = new FCM(serverKey);
            var notification_body = {
            to:"dZX3eYL9TmSvR1kWW5ykXT:APA91bGJEeMtlPK9VXHTcqoTGL_If9e5sRX4hgZM2po9m4m67RhiBfWhf9aGCfQ_EdRpZxRKvYUaTOjZUrbalyLw1ApV6rprWVM6wIRsX1xikzVd_wKKDEAKYS7TsdhWnIssFw-4o1Vz",
            notification: {
                "title": "Video Inquiry",
                "body":'Congratulations!! Yor request has been submitted, we will get back to you soon.',
            },
            data: {
                image_url: s3.getSignedUrl("getObject", {
                    Bucket: process.env.AWS_BUCKET,
                    Key: `boutique/default-img.jpg`,
                    // Expires: expirationTime,
                    })
                }
            }
            fcm.send(notification_body,async function (err, response) {
                if (err) {
                    console.log(err)
                }else{
                    console.log("Notification sent sucessfully."+response)
                    console.log(notification_body)
                }
            })
            return res.status(200).send({ HasError: false, Message: "Video Inquiry data inserted successfully.", result: dataJson });
        }
    } catch (error) {
        console.error(error)
        const logData = { user_id: "", status: 'false', message: error.message, device_id: '', created_at: Date.now(), updated_at: Date.now(), device_info: '', action: req.url }
        const log = await logService.createLog(logData)
        return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message });
    }
}

// exports.notification=async(req,res)=>{
//     try {
//         var serverKey=config.serverKey
//         var fcm = new FCM(serverKey);
//         var notification = {
//             "title": "Video Inquiry",
//             "body": 'Congratulations!! Yor request has been submitted, we will get back to you soon.',
//         }
     
//         var notification_body = {
//             'notification': notification,
//             'registration_ids': "ehdnkHMwTbOaMi77F68dK0:APA91bHd165YxY8_LNynyY0CO81JH1VE2d-0TM0Z6GOxlxcjUD1VLmCFz_rkOniZgzdMdW6GIVM4voLJRUNjt7HQVS4-bnIZa50armZHgwVYhI1caeuy733_UweVnYQxIKkjnn5weBs9''ehdnkHMwTbOaMi77F68dK0:APA91bHd165YxY8_LNynyY0CO81JH1VE2d-0TM0Z6GOxlxcjUD1VLmCFz_rkOniZgzdMdW6GIVM4voLJRUNjt7HQVS4-bnIZa50armZHgwVYhI1caeuy733_UweVnYQxIKkjnn5weBs9"
//         }
//         fcm.send(notification_body, async function (err, response) {
//             if (err) {
//                 console.log('error'+err)
//             }else{
//                 console.log("Notification sent sucessfully."+response)
//                 console.log(notification_body)
//                 return res.status(200).send({ HasError: false, Message: "Notification sent sucessfully", });

//             }
//         })

//     } catch (error) {
//         console.log(error)
//         return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message });
//     }
// }