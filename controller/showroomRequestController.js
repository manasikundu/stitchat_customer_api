ShowroomRequestService = require('../service/showroomRequestService')
const logService = require('../service/logService')

exports.createShowroomRequest = async (req, res) => {
    try {
        const { body } = req
        const currentDate = new Date()
        const formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ")
        body.created_at = formattedDate
        body.updated_at = formattedDate
        const result = await ShowroomRequestService.createRequest(body)
        if (!result) {
            return res.status(500).send({ message: "Failed to insert data.", HasError: true, result: {} })
        } else {
            return res.status(200).send({ message: "Successfully insert data.", HasError: false, result: result })
        }

    } catch (error) {
        const logData = { user_id: "", status: 'false', message: error.message, device_id: '', created_at: Date.now(), updated_at: Date.now(), device_info: '', action: req.url }
        const log = await logService.createLog(logData);
        return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message });
    }
}