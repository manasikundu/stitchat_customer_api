const ErrorLog = require("../model/logModel")


exports.createLog = async (data) => {
    try {
        var logData = await ErrorLog.create(data)
        return logData
    } catch (error) {
        console.log(error)
        return error
    }
}