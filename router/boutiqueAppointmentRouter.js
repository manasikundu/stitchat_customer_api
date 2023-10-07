const boutiqueAppointmentController = require("../controller/boutiqueAppointmentController");
const route = require("express-promise-router");
const router = new route();

router.post("/bookBoutiqueAppointment", boutiqueAppointmentController.bookBoutiqueAppointment);

module.exports = router;
