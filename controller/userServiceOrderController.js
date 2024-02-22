const OrderService = require('../service/userServiceOrderService')
const moment = require('moment')
const Users = require("../model/userModel")
const UsersAddress = require("../model/userAddressModel")
const Service = require('../service/userService')
const cartService = require('../service/userServiceCartService')
const logService = require('../service/logService')
const FCM = require('fcm-node');
const s3 = require("../config/s3Config");
const dotenv = require("dotenv");
dotenv.config();
const Item = require('../model/categoryItemModel')
const TailorService = require('../model/tailorServiceModel')
const notificationService = require('../service/notificationService')
const Boutique = require("../model/userBoutiqueInfoModel");
const BoutiqueService = require("../service/userBoutiqueService");
const { generateAccessToken, auth } = require("../jwt");
var ejs = require("ejs");
var genearatePdf = require("html-pdf");
const path = require("path");
const fs = require('fs')
const { dateFormat } = require('../customModule')


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
            if (user) {
                var cart = await cartService.getCart(user_id);
                if (cart.length != 0) {
                    const newOrder = await OrderService.createOrder(data);
                    if (newOrder) {
                        const today = dateFormat(new Date())
                        const orderId = "STIAR" + today.day + today.month + today.year + newOrder.id;
                        const updateOrderId = await OrderService.updateOrder(newOrder.id, { order_id: orderId });
                        const updateOrderIdInCart = await cartService.updateCartByUserId(newOrder.user_id, { order_id: orderId });
                        if (updateOrderIdInCart != 0) {
                            newOrder.order_id = orderId
                            var boutique_name = await BoutiqueService.getBoutiqueById(boutique_id)
                            var fullName = user.first_name && user.last_name ? user.first_name + " " + user.last_name : user.first_name || user.last_name;

                            var serverKey = "AAAAeWjlHHQ:APA91bEmHAGr364Xhn2Tr-gtkPhNCT6aHFzjJnQc1BHThevx06c7WjFLgzDHug7qCiPz77nJQsMIesruMdaincRc9T8i20weW20GP36reD9UfwfkeqIMFG84pNjXZVbtNOfhLjPQNExt";
                            var fcm = new FCM(serverKey);
                            var image_url = s3.getSignedUrl("getObject", { Bucket: process.env.AWS_BUCKET, Key: `boutique/default-img.jpg` });

                            var notification_body = {
                                to: "d3jOfE4OQnicy1bvQ8AbwH:APA91bH_dbwMjkvBK3b-iPQBKOi4aaqlytk7cLVuJZthPdNkT8dSUc6FJ2NzI2RL3Ie2bKpFOc6O5NRt7VBZL_932aDF0GdE3vT33hUJ8ACLkaY8CkMbErWRqziLCxD5pSDHhE2niYyD",
                                notification: {
                                    "title": "Place Order",
                                    "body": `Order placed successfully ${orderId}`,
                                },
                                data: {}
                            };
                            var notification_body_receiver = {
                                to: "d3jOfE4OQnicy1bvQ8AbwH:APA91bH_dbwMjkvBK3b-iPQBKOi4aaqlytk7cLVuJZthPdNkT8dSUc6FJ2NzI2RL3Ie2bKpFOc6O5NRt7VBZL_932aDF0GdE3vT33hUJ8ACLkaY8CkMbErWRqziLCxD5pSDHhE2niYyD",
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
                                if (err)
                                    console.log(err);
                                var notificationData = await notificationService.insertNotification(senderData);
                            })
                            fcm.send(notification_body_receiver, async function (err, response) {
                                if (err)
                                    console.log(err);
                                var notificationData = await notificationService.insertNotification(receiverData);
                            })

                            const addressDetails = await UsersAddress.findOne({ where: { id: newOrder.address_id } })
                            var billingAddress = {}
                            billingAddress.first_name = addressDetails.first_name
                            billingAddress.last_name = addressDetails.last_name
                            billingAddress.area = addressDetails.area
                            billingAddress.street = addressDetails.street
                            billingAddress.city = addressDetails.city
                            billingAddress.state = addressDetails.state
                            billingAddress.pincode = addressDetails.pincode
                            billingAddress.mobile_number = addressDetails.mobile_number

                            var orderDetails = {}
                            orderDetails.order_id = newOrder.order_id
                            orderDetails.delivery_date = newOrder.delivery_date
                            orderDetails.item_total = newOrder.sum_amount
                            orderDetails.discount = newOrder.discount_price
                            orderDetails.delivery_charges = newOrder.delivery_price
                            orderDetails.extra_charge = newOrder.extra_charge
                            orderDetails.total_price = newOrder.total_price
                            const today = dateFormat(new Date())
                            orderDetails.current_date = today.year + "-" + today.month + "-" + today.day

                            var cartData = []
                            for (var i in cart) {
                                var cartDetails = {}
                                cartDetails.item_id = cart[i].item_id
                                var item = await Item.findOne({ where: { id: cart[i].item_id } })
                                cartDetails.item = item.name
                                var service = await TailorService.findOne({ where: { id: cart[i].service_id } })
                                cartDetails.service = service.name
                                cartDetails.unitPrice = service.amount
                                cartDetails.quantity = cart[i].quantity
                                cartDetails.itemTotal = cart[i].quantity * service.amount
                                cartData.push(cartDetails)
                            }

                            var pdfData = {
                                billingAddress: billingAddress,
                                orderDetails: orderDetails,
                                cartDetails: cartData
                            }
                            var alphaNumericString = Math.random().toString(36).replace("0.", "");
                            var pdfName = "invoice" + "_" + alphaNumericString + ".pdf";
                            var pdfDirPath = path.join(__dirname, "../invoices", pdfName);
                            var htmls = fs.readFileSync("./views/invoice.ejs", "utf8", function (err, resulte) {
                                if (err) {
                                    consolr.log(err);
                                    return res.status(500).send({
                                        message: "Failed to create invoice.",
                                    });
                                }
                            }
                            );
                            var options = { format: "A4", orientation: "portrait" };
                            var result1 = ejs.render(htmls, pdfData);
                            genearatePdf.create(result1, options).toStream(function (err, stream) {
                                stream.pipe(fs.createWriteStream(pdfDirPath));
                            });
                            return res.status(200).send({ message: "Order Placed Sucessfully", HasError: false, result: newOrder })
                        } else {
                            return res.status(500).send({ message: "Failed to update in cart.", HasError: true, result: {} })
                        }
                    } else {
                        return res.status(500).send({ message: "Failed to create order", HasError: true })
                    }
                } else {
                    return res.status(200).send({ message: "Please add item in cart to place order", HasError: false })
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

exports.cancelAlterationOrder = async (req, res) => {
    try {
        var order_id = req.query.order_id
        var method_name = await Service.getCallingMethodName()
        var apiEndpointInput = JSON.stringify(req.body)
        var apiTrack = await Service.trackApi(req.query.user_id, method_name, apiEndpointInput, req.query.device_id, req.query.device_info, req.ip)
        if (order_id == undefined || !Number.isInteger(parseInt(order_id))) {
            return res.status(400).send({
                HasError: true,
                StatusCode: 400,
                message: "Invalid parameter.",
            })
        }
        const orderCancelResult = await OrderService.cancelOrder(order_id)

        if (orderCancelResult.error) {
            return res.status(500).send({
                HasError: true,
                Message: "Error canceling the order.",
            })
        } else {
            const orderDetails = await OrderService.getOrderHistory(order_id)
            console.log(orderDetails)

            for (var i in orderDetails) {
                const utcTimestamp = moment.utc(orderDetails[i].created_at)
                const istTimestamp = utcTimestamp.clone().tz('Asia/Kolkata')
                console.log(istTimestamp.format('YYYY-MM-DD HH:mm:ss'));
                var boutique_id = orderDetails[i].boutique_id
                var boutique_name = await BoutiqueService.getBoutiqueById(boutique_id)
                // const createdTime = new Date(orderDetails[i].created_at).getTime();
                const createdTime = istTimestamp.format('YYYY-MM-DD HH:mm:ss')
                const currentTime = new Date().getTime();
                const timeDifferenceInMinutes = (currentTime - createdTime) / (1000 * 60)
                if (timeDifferenceInMinutes <= 30) {

                    const itemCancelResult = await OrderService.cancelItem(orderDetails[i].order_id)
                    if (itemCancelResult.error) {
                        return res.status(500).send({ HasError: true, Message: "Error canceling the items within the order.", })
                    }
                    var serverKey = "AAAAeWjlHHQ:APA91bEmHAGr364Xhn2Tr-gtkPhNCT6aHFzjJnQc1BHThevx06c7WjFLgzDHug7qCiPz77nJQsMIesruMdaincRc9T8i20weW20GP36reD9UfwfkeqIMFG84pNjXZVbtNOfhLjPQNExt";
                    var fcm = new FCM(serverKey);
                    // var image_url = s3.getSignedUrl("getObject", { Bucket: process.env.AWS_BUCKET, Key: `boutique/default-img.jpg` });

                    var notification_body = {
                        to: "d3jOfE4OQnicy1bvQ8AbwH:APA91bH_dbwMjkvBK3b-iPQBKOi4aaqlytk7cLVuJZthPdNkT8dSUc6FJ2NzI2RL3Ie2bKpFOc6O5NRt7VBZL_932aDF0GdE3vT33hUJ8ACLkaY8CkMbErWRqziLCxD5pSDHhE2niYyD",
                        notification: {
                            "title": "Cancel Order",
                            "body": `Order cancelled successfully ${orderDetails[i].order_id}`,
                        },
                        data: {}
                    }
                    var notification_body_receiver = {
                        to: "d3jOfE4OQnicy1bvQ8AbwH:APA91bH_dbwMjkvBK3b-iPQBKOi4aaqlytk7cLVuJZthPdNkT8dSUc6FJ2NzI2RL3Ie2bKpFOc6O5NRt7VBZL_932aDF0GdE3vT33hUJ8ACLkaY8CkMbErWRqziLCxD5pSDHhE2niYyD",
                        notification: {
                            title: 'Cancel Order',
                            body: `Dear ${boutique_name.boutique_name}, an order has been cancelled by customer with Order Details ${orderDetails[i].order_id}.`,
                        },
                    }
                    var notificationDataSender_body = notification_body.notification.body;
                    var notificationDataSender_title = notification_body.notification.title;
                    var notificationDataReceiver_body = notification_body_receiver.notification.body;
                    var notificationDataReceiver_title = notification_body_receiver.notification.title;
                    var notificationData_createdAt = moment().format('YYYY-MM-DD HH:mm:ss')
                    var senderData = {}
                    senderData.sender_id = 1
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
                            console.log(err)
                        } else {
                            var notificationData = await notificationService.insertNotification(senderData)
                            console.log("Notification sent successfully:", response)
                            console.log(JSON.stringify(notification_body, null, 2))

                            // Sending notification to the boutique
                            fcm.send(notification_body_receiver, async function (err, response) {
                                if (err) {
                                    console.error('Error sending notification to boutique:', err)
                                } else {
                                    var notificationDataReceiver = await notificationService.insertNotification(receiverData)
                                    console.log('Notification sent to boutique:', response)
                                    console.log(JSON.stringify(notification_body_receiver, null, 2))
                                }
                            })
                        }
                    })
                    return res.status(200).send({ HasError: false, Message: "Order cancelled successfully." })
                } else {
                    return res.status(400).send({ HasError: true, StatusCode: 500, message: "Order cannot be canceled after 30 minutes from creation.", })
                }
            }
        }
    } catch (error) {
        console.error(error)
        const logData = { user_id: "", status: 'false', message: error.message, device_id: '', created_at: Date.now(), updated_at: Date.now(), device_info: '', action: req.url }
        const log = await logService.createLog(logData)
        return res.status(500).send({
            HasError: true,
            Message: error.message,
        })
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

