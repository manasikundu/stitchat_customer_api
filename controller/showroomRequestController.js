ShowroomRequestService = require('../service/showroomRequestService')

exports.createShowroomRequest = async (req, res) => {
    try {
        const { body } = req;
        const result = await ShowroomRequestService.createRequest(body);

        if (!result) {
            return res.status(500).send({
                message: "Failed to proceed data."
            })
        }
        return res.status(200).send({
            message: "Successfully proceed data."
        });
    } catch (error) {
        return res.status(500).send({ message: "Some error occurred.", HasError: true, error: error.message });
    }
}