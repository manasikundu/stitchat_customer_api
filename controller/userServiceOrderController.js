const OrderService = require('../service/userServiceOrderService')
const moment = require('moment')
const Users = require("../model/userModel")
const UsersAddress = require("../model/userAddressModel")
const Service = require('../service/userService')
const cartService = require('../service/userServiceCartService')
const logService = require('../service/logService')
const { generateAccessToken, auth } = require("../jwt")
const nodemailer = require('nodemailer');
const orderServiceItem = require("../service/userServiceCartService")
const { or } = require('sequelize')
const transporter = require('../invoiceConfig')
const invoiceGenerator = require('../invoiceGenerator')
const { generateHTMLInvoice, generatePDFInvoice } = require('../invoiceGenerator')
const orderService = require("../service/orderService");
const FCM = require('fcm-node');
const config=require("../config/fcm.json")
const s3 = require("../config/s3Config");
const dotenv = require("dotenv");
dotenv.config();
const notificationService = require('../service/notificationService')
const Boutique = require("../model/userBoutiqueInfoModel");
const BoutiqueService = require("../service/userBoutiqueService");

exports.createOrder = async (req, res) => {
    try {
        const user_id = req.body.user_id;
        const name = req.body.name;
        const email = req.body.email;
        const mobile_number = req.body.mobile_number;
        const address_id = req.body.address_id;
        const status = 2;
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");
        const coupon_id = req.body.coupon_id || 0;
        const coupon_code = req.body.coupon_code || '';
        const delivery_price = req.body.delivery_price || 50;
        const sum_amount = req.body.sum_amount || 0;
        const discount_price = req.body.discount_price || 0;
        const extra_charge = req.body.extra_charge || 0;
        const calculatedTotalPrice = delivery_price + sum_amount + extra_charge - discount_price;
        const coupon_amount = req.body.coupon_amount;
        const quantity = req.body.quantity;
        const boutique_id = req.body.boutique_id || 1;
        const deliveryDate = new Date(currentDate);
        deliveryDate.setDate(currentDate.getDate() + 5);
        const formattedDeliveryDate = deliveryDate.toISOString().slice(0, 19).replace("T", " ");

        const data = { user_id, name, email, mobile_number, address_id, coupon_amount, quantity, status, created_at: formattedDate, updated_at: formattedDate, coupon_id, coupon_code, delivery_price, sum_amount, discount_price, extra_charge, total_price: calculatedTotalPrice, boutique_id, delivery_date: formattedDeliveryDate };

        if (req.body.user_id) {
            const user = await Users.findOne({ where: { id: user_id } });
            // console.log(user.first_name)
            if (user) {
                const newOrder = await OrderService.createOrder(data);
                if (newOrder) {
                    const today = new Date();
                    const year = today.getFullYear();
                    const month = today.getMonth() + 1; // Months are zero-based, so we add 1.
                    const day = today.getDate();
                    const orderId = "STIAR" + day + month + year + newOrder.id;
                    const updateOrderId = await OrderService.updateOrder(newOrder.id, { order_id: orderId });

                    var cart = await cartService.getCart(user_id);
                    if (cart.length != 0) {
                        const updateOrderIdInCart = await cartService.updateCartByUserId(newOrder.user_id, { order_id: orderId });
                        if (updateOrderIdInCart != 0) {
                            newOrder.order_id = orderId
                            var boutique_name = await BoutiqueService.getBoutiqueById(boutique_id)
                            const fullNameParts = [user.first_name, user.middle_name, user.last_name].filter(Boolean);
                            const fullName = fullNameParts.join(' ')
                            
                            var serverKey = "AAAAeWjlHHQ:APA91bEmHAGr364Xhn2Tr-gtkPhNCT6aHFzjJnQc1BHThevx06c7WjFLgzDHug7qCiPz77nJQsMIesruMdaincRc9T8i20weW20GP36reD9UfwfkeqIMFG84pNjXZVbtNOfhLjPQNExt";
                            var fcm = new FCM(serverKey);
                            var image_url = s3.getSignedUrl("getObject", { Bucket: process.env.AWS_BUCKET, Key: `boutique/default-img.jpg` });

                            var notification_body = {
                                to: "dZX3eYL9TmSvR1kWW5ykXT:APA91bEEhK5aak9wzSKjaajmzZ82BS1JFzcJPVTArnSZAGOj9wOoLSVBJnmoQH5M0ETR5D0lNcqIO318fUFaL4EThlY5AL2XzkgZKgdosrzciX9ftGthDPOQG5o10yKOEUbYyZKTYyc2",
                                notification: {
                                    "title": "Place Order",
                                    "body": `Order placed successfully ${orderId}`, 
                                },
                                data: {}
                            };
                            var notification_body_receiver = {
                                to: "dZX3eYL9TmSvR1kWW5ykXT:APA91bEEhK5aak9wzSKjaajmzZ82BS1JFzcJPVTArnSZAGOj9wOoLSVBJnmoQH5M0ETR5D0lNcqIO318fUFaL4EThlY5AL2XzkgZKgdosrzciX9ftGthDPOQG5o10yKOEUbYyZKTYyc2",
                                notification: {
                                    title: 'Place Order',
                                    body: `Dear ${boutique_name.boutique_name}, an order has been successfully created by customer ${fullName} with Order Details ${orderId}.`,
                                },
                            };

                            var notificationType = req.body.notificationType;

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
                            // } 
                            var notificationDataSender_body = notification_body.notification.body;
                            var notificationDataSender_title = notification_body.notification.title;
                            var notificationDataReceiver_body = notification_body_receiver.notification.body;
                            var notificationDataReceiver_title = notification_body_receiver.notification.title;
                            var notificationData_createdAt = moment().format('YYYY-MM-DD HH:mm:ss')
                            var senderData = {}
                            senderData.sender_id = user_id
                            senderData.type = 2
                            senderData.title = notificationDataSender_title
                            senderData.body = notificationDataSender_body
                            senderData.send_time = notificationData_createdAt
                            senderData.created_at = notificationData_createdAt

                            var receiverData = {}
                            receiverData.receiver_id = 1
                            receiverData.type = 2
                            receiverData.title = notificationDataReceiver_title
                            receiverData.body = notificationDataReceiver_body
                            receiverData.send_time = notificationData_createdAt
                            receiverData.created_at = notificationData_createdAt


                            fcm.send(notification_body, async function (err, response) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    
                                        var notificationData = await notificationService.insertNotification(senderData);
                                        console.log("Notification sent successfully:", response);
                                        console.log(JSON.stringify(notification_body, null, 2));
                            
                                        // Sending notification to the boutique
                                        fcm.send(notification_body_receiver, async function (err, response) {
                                            if (err) {
                                                console.error('Error sending notification to boutique:', err);
                                            } else {
                                                    var notificationDataReceiver = await notificationService.insertNotification(receiverData)
                                                    console.log('Notification inserted:', notificationDataReceiver);

                                                    console.log('Notification sent to boutique:', response);
                                                    console.log(JSON.stringify(notification_body_receiver, null, 2));
                                                
                                                }
                                            
                            //                 })
                            // });
                            

                            // fcm.send(notification_body, async function (err, response) {
                            //     if (err) {
                            //         console.log(err)
                            //     } else {
                            //         var notificationData = await notificationService.insertNotification(dataToInsert)
                            //         console.log("Notification sent successfully." + response)
                            //         console.log(JSON.stringify(notification_body, null, 2))
                            //     }
                            //     fcm.send(notification_body_receiver, (err, response) => {
                            //         if (err) {
                            //             console.error('Error sending notification to boutique:', err);
                            //         } else {
                            //             var notificationDataReceiver = await notificationService.insertNotification(dataToInsert)
                            //             console.log('Notification sent to boutique.' + response)
                            //             console.log(JSON.stringify(notification_body_receiver, null, 2))
                                    // }
                                // });

                                return res.status(200).send({ message: "Order Placed Successfully", HasError: false, result: newOrder })
                            })
                        }
                        })
                        } else {
                            return res.status(500).send({ message: "Failed to update in cart.", HasError: true, result: {} })
                        }
                    } else {
                        return res.status(200).send({ message: "Please add item in cart to place order", HasError: false })
                    }
                } else {
                    return res.status(500).send({ message: "Failed to create order", HasError: true })
                }
            } else {
                return res.status(200).send({ message: "This user doesn't exist", HasError: false })
            }
        } else {
            return res.status(400).send({ message: "Please enter a userId", HasError: true })
        }

    } catch (error) {
        console.error(error)
        const logData = { user_id: "", status: 'false', message: error.message, device_id: '', created_at: Date.now(), updated_at: Date.now(), device_info: '', action: req.url }
        const log = await logService.createLog(logData);
        return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message })
    }
}


exports.orderHistory = async (req, res) => {
    try {
        const user_id = req.body.user_id
        const id = req.body.id
        var method_name = await Service.getCallingMethodName()
        var apiEndpointInput = JSON.stringify(req.body)
        var apiTrack = await Service.trackApi(user_id, method_name, apiEndpointInput, req.query.device_id, req.query.device_info, req.ip)
        const orderHistory = await OrderService.getCartHistory(user_id, id)
        if (orderHistory.length === 0) {
            return res.status(200).send({ message: "No matching orders found", HasError: false, result: [] })
        } else {
            const final_data = []
            for (var item of orderHistory) {
                const orderData = {}
                orderData.id = item.id || 0
                orderData.user_id = item.user_id || 0
                orderData.name = item.name || 0
                orderData.email = item.email || ''
                orderData.mobile_number = item.mobile_number || ''
                orderData.address_id = item.address_id || 0
                orderData.status = item.status || 0
                orderData.order_id = item.order_id || 0
                orderData.coupon_id = item.coupon_id || 0
                orderData.coupon_code = item.coupon_code || ''
                orderData.coupon_name = ''
                orderData.coupon_description = ''
                orderData.coupon_discount_amount = 0
                // coupon name
                // coupon_code
                // description
                // discount amout
                // coupon id (id)
                orderData.delivery_price = item.delivery_price || 0
                orderData.sum_amount = item.sum_amount || 0
                orderData.discount_price = item.discount_price || 0
                orderData.extra_charge = item.extra_charge || 0
                orderData.total_price = item.total_price || 0
                orderData.created_at = moment(item.created_at).format('YYYY-MM-DD HH:mm:ss') || ''
                final_data.push(orderData);
            }
            return res.status(200).send({ message: "Successfully fetched order history", HasError: false, result: final_data })
        }
    } catch (error) {
        console.log(error)
        const logData = { user_id: "", status: 'false', message: error.message, device_id: '', created_at: Date.now(), updated_at: Date.now(), device_info: '', action: req.url }
        const log = await logService.createLog(logData)
        return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message })
    }
}

