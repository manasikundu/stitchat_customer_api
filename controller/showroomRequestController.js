ShowroomRequestService = require('../service/showroomRequestService')
const logService = require('../service/logService')

exports.createShowroomRequest = async (req, res) => {
    try {
        const { body } = req
        // const name = req.body.name 
        // const type = req.body.type
        // const registration_date = req.body.registration_date
        // const phone_no = req.body.phone_no
        // const email = req.body.email
        // const website = req.body.website
        // const logo = req.body.logo
        // const address = req.body.address
        // const city = req.body.city
        // const state = req.body.state
        // const country = req.body.country
        // const pincode = req.body.pincode
        // const contact_person_name = req.body.contact_person_name
        // const contact_person_phone = req.body.contact_person_phone
        // const contact_person_email = req.body.contact_person_email
        // const currentDate = new Date()
        // const formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ")
        // const body = {name, type, registration_date, phone_no, email, website, logo, address, city, state, country, pincode, contact_person_name, contact_person_phone, contact_person_email, created_at: formattedDate, updated_at: formattedDate}
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