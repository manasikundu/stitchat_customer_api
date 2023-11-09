const errorLog = require('../service/logService')

exports.createLog = async (req, res) => {
    try {
        const message = req.body.message
        const current_time = req.body.current_time
        const g_token = auth(req)
        const user_id = g_token.user_id
        const data = {message, current_time, user_id}
        var method_name = await Service.getCallingMethodName()
        var apiEndpointInput = JSON.stringify(req.body)
        var apiTrack = await Service.trackApi(req.query.user_id,method_name,apiEndpointInput,req.query.device_id,req.query.device_info,req.ip)
        if (!message || !current_time) {
            return res.status(400).send({HasError: true,Message: "Invalid parameter.",})
        } else {
            const logData = await errorLog.createLog(data)
            return res.status(200).send({HasError: false,Message: "Log data inserted successfully.",})
        }
    } catch (error) {
        return res.status(400).send({HasError: true,Message: "Invalid parameter.",})   
    }
}