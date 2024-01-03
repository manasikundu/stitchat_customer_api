const videoInquireService = require('../service/videoEnquireService')
const moment = require('moment')
const Users = require("../model/userModel")
const VideoInquire = require("../model/videoEnquireModel")
const categoryItem = require("../model/categoryItemModel")
const Service = require('../service/userService')
const logService = require('../service/logService')
const notificationService = require('../service/notificationService')
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

            var serverKey = "AAAAeWjlHHQ:APA91bEmHAGr364Xhn2Tr-gtkPhNCT6aHFzjJnQc1BHThevx06c7WjFLgzDHug7qCiPz77nJQsMIesruMdaincRc9T8i20weW20GP36reD9UfwfkeqIMFG84pNjXZVbtNOfhLjPQNExt"
            var fcm = new FCM(serverKey);  
            var image_url = s3.getSignedUrl("getObject", {Bucket: process.env.AWS_BUCKET,Key: `boutique/default-img.jpg`,})         
            var notification_body = {
                to: "dZX3eYL9TmSvR1kWW5ykXT:APA91bEEhK5aak9wzSKjaajmzZ82BS1JFzcJPVTArnSZAGOj9wOoLSVBJnmoQH5M0ETR5D0lNcqIO318fUFaL4EThlY5AL2XzkgZKgdosrzciX9ftGthDPOQG5o10yKOEUbYyZKTYyc2",
            notification: {
                "title": "Video Inquiry",
                // "body":'Congratulations!! Yor request has been submitted, we will get back to you soon.',
                "body": 'Congratulations!! Your request has been submitted, we will get back to you soon. Hope you are doing well. Waiting for you response. Thank you. ',
            
            },
            data: {}
            }
            var notificationType = req.body.notificationType

            if (notificationType === "BIGPIC") {
                notification_body.data = {
                    "type": "BIGPIC",
                    "image_url": image_url,
                };
            } else if (notificationType === "BIGTEXT") {
                notification_body.data = {
                    "type": "BIGTEXT",
                    "body": 'Congratulations!! Your request has been submitted, we will get back to you soon. Hope you are doing well. Waiting for your response. Thank you.',
                };
            } else if (notificationType === "DIRECTREPLY") {
                notification_body.data = {
                    "type": "DIRECTREPLY",
                    "title": "direct_reply_notification",
                    "message": "Please share your feedback.",
                    "actions": [
                        {
                            "action_type": "view",
                            "title": "View",
                            "intent": {
                                "type": "activity",
                                "target": "MainActivity"
                            }
                        },
                        {
                            "action_type": "dismiss",
                            "title": "Dismiss",
                            "intent": {
                                "type": "broadcast",
                                "target": "NotificationReceiver",
                                "extra": {
                                    "ID": 0
                                }
                            }
                        }
                    ]
                }
            } else if (notificationType == "INBOX") {
                notification_body.data = {
                    "type": "INBOX",
                    "title": "Inbox style notification",
                    "message": "Please check your today's tasks.",
                    "contentList": ["Add items", "Edit your items if you want to add/delete any item", "Place order"]
                    }
                }
            } 
            var notificationData_body = notification_body.data.body
            var notificationData_title = notification_body.notification.title
            var notificationData_createdAt = moment().format('YYYY-MM-DD HH:mm:ss')
            var dataToInsert = {}
            dataToInsert.sender_id = 2
            dataToInsert.receiver_id = 1
            dataToInsert.type = 2
            dataToInsert.title = notificationData_title
            dataToInsert.body = notificationData_body
            dataToInsert.created_at = notificationData_createdAt

            fcm.send(notification_body,async function (err, response) {
                if (err) {
                    console.log(err)
                    }else{
                        var notificationData = await notificationService.insertNotification(dataToInsert)
                        // console.log("Notification inserted successfully:", notificationData)
                        console.log("Notification sent sucessfully."+response)
                        // console.log(notification_body)
                        console.log(JSON.stringify(notification_body, null, 2))  
                        }
                    })
            return res.status(200).send({ HasError: false, Message: "Video Inquiry data inserted successfully.", result: dataJson });
    } catch (error) {
        console.error(error)
        const logData = { user_id: "", status: 'false', message: error.message, device_id: '', created_at: Date.now(), updated_at: Date.now(), device_info: '', action: req.url }
        const log = await logService.createLog(logData)
        return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message });
    }
}

// Firebase Cloud Function to handle direct replies
// exports.handleDirectReply = functions.https.onRequest(async (req, res) => {
//     const userReply = req.body.data.reply; // Assuming 'data.reply' holds the user's reply

//     if (userReply) {
//         // Process the user's reply and perform necessary actions

//         // Send a follow-up message (Thank you for your feedback)
//         const thankYouMessage = {
//             to: "USER_DEVICE_TOKEN",
//             notification: {
//                 title: "Thank You",
//                 body: "Thank you for your feedback!",
//             },
//         };

//         // Send the 'Thank you' message using FCM
//         await admin.messaging().send(thankYouMessage);
//     }

//     res.status(200).send("Reply processed.");
// })

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