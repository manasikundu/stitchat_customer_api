const notificationService = require('../service/notificationService')
const cron = require('node-cron')
const FCM = require('fcm-node')
const Users = require("../model/userModel")
const moment = require('moment')
const UserServiceCart = require("../model/userServiceCartModel")
const { Op } = require("sequelize")
const db = require("../dbConnection");


exports.sendNotification = async (req, res) => {
    try {
        const noti = await notificationService.sendNotificationForItem()
        const uniqueUserIds = [...new Set(noti.map(item => item.user_id))]
        
        for (var userId of uniqueUserIds) {
            const user = await Users.findOne({ where: { id: userId } })
            const fullName = user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name || user.last_name

            const countResult = await UserServiceCart.count({where: {user_id: userId,order_id: { [Op.or]: [null, ''] }}})
            const itemCountForUser = countResult

            const serverKey = "AAAAeWjlHHQ:APA91bEmHAGr364Xhn2Tr-gtkPhNCT6aHFzjJnQc1BHThevx06c7WjFLgzDHug7qCiPz77nJQsMIesruMdaincRc9T8i20weW20GP36reD9UfwfkeqIMFG84pNjXZVbtNOfhLjPQNExt"
            const fcm = new FCM(serverKey)

            const notification_body = {
                to: "d3jOfE4OQnicy1bvQ8AbwH:APA91bH_dbwMjkvBK3b-iPQBKOi4aaqlytk7cLVuJZthPdNkT8dSUc6FJ2NzI2RL3Ie2bKpFOc6O5NRt7VBZL_932aDF0GdE3vT33hUJ8ACLkaY8CkMbErWRqziLCxD5pSDHhE2niYyD",

                // to: "dZX3eYL9TmSvR1kWW5ykXT:APA91bHigZIZ-jGkmj48S4Fau8-7Ab8wIOQ4i1VqS3lV5KvuzA2iRVH69-QJT1qPLgDKw4BGh72_1o3S5MTD9adlnSiZXiOTJLau3zB9wLjuDYteGJBaaHWZ6zmeSe-y6Wb94EoQh2Va",
                notification: {
                    title: 'Proceed with Order',
                    body: `Dear ${fullName}, you have ${itemCountForUser} item in your cart. Please proceed for checkout!`,
                },
                data: {}
            }

            var notificationData_body = notification_body.notification.body
            var notificationData_title = notification_body.notification.title
            var notificationData_createdAt = moment().format('YYYY-MM-DD HH:mm:ss')
            var dataToInsert = {}
            dataToInsert.sender_id = 2
            dataToInsert.receiver_id = userId
            dataToInsert.type = 2
            dataToInsert.title = notificationData_title
            dataToInsert.body = notificationData_body
            dataToInsert.created_at = notificationData_createdAt

            fcm.send(notification_body,async function (err, response) {
                if (err) {
                    console.log(err)
                    } else {
                        var notificationData = await notificationService.insertNotification(dataToInsert)
                        // console.log("Notification inserted successfully:", notificationData)
                        console.log("Notification sent sucessfully."+response)
                        // console.log(notification_body)
                        console.log(JSON.stringify(notification_body, null, 2))  
                        }
                    })
        }
        return res.status(200).send({ message: "Data fetched successfully", HasError: false, result: noti })
    } catch (error) {
        console.log(error);
        return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message })
    }
}

cron.schedule('0 0 * * *', async () => {
    try {
        await sendNotification();
    } catch (error) {
        console.error('Error in cron job:', error)
    }
})

// cron.schedule('0 0 * * *', async () => {
//     try {
//         const usersWithItemsInCart = await notificationService.sendNotificationForItem()

//         usersWithItemsInCart.forEach(async (user) => {
//             await this.sendNotification()
//         });

//     } catch (error) {
//         console.error('Error in cron job:', error)
//     }
// })

exports.sendProceedOrderNotification = async (req, res) => {
    try {
      const notificationBody = {
        to: userDetails.device_token, 
        notification: {
          title: 'Proceed with Order',
          body: `Dear ${userDetails.username}, you have items in your cart. Please proceed for checkout!`, 
        },
      };
  
      // Send notification
      fcm.send(notificationBody, async function (err, response) {
        if (err) {
          console.error('Error sending notification:', err)
        } else {
          console.log('Notification sent successfully.'+ response);
        }
      });
    } catch (error) {
        console.error(error)
        return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message })
    }
}
  
