const errorLog = require('../service/logService')

exports.createLog = async (req, res) => {
    const message = req.body.message
    const current_time = req.body.current_time
    const g_token = auth(req)
    const user_id = g_token.user_id || null
    var status = false
    var method_name = await Service.getCallingMethodName()
    var apiEndpointInput = JSON.stringify(req.body)
    var apiTrack = await Service.trackApi(req.query.user_id,method_name,apiEndpointInput,req.query.device_id,req.query.device_info,req.ip)
    const data = {user_id, status: status, message, created_at: current_time, action: method_name }
    if (!message || !current_time) {
        return res.status(400).send({HasError: true,Message: "Invalid parameter.",})
    } else {
        const logData = await errorLog.createLog(data)
        return res.status(200).send({HasError: false})
    }
}