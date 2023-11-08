const errorLog = require('../service/logService')

exports.createLog = async (req, res) => {
    try {
        
        var method_name = await Service.getCallingMethodName()
        var apiEndpointInput = JSON.stringify(req.body)
        var apiTrack = await Service.trackApi(req.query.user_id,method_name,apiEndpointInput,req.query.device_id,req.query.device_info,req.ip)
        
        
    } catch (error) {
        
    }
}