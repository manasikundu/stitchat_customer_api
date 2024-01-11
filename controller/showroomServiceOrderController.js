ShowroomServiceOrderService = require('../service/showroomServiceOrderService')

exports.createShowroomServiceOrder = async (req, res) => {
    try {
        const { body } = req;
        const result = await ShowroomServiceOrderService.createShowroomServiceOrder(body);

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