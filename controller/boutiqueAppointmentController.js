const botiqueAppointmentService = require('../service/boutiqueAppointmentService')
const Service = require('../service/userService')
const moment = require('moment')
const botiqueAppointment = require('../model/boutiqueAppointmentModel')
const boutiqueService = require('../service/userBoutiqueService')

var daysOfWeekConfig = [
    { day: "Monday", value: 1 },
    { day: "Tuesday", value: 2 },
    { day: "Wednesday", value: 3 },
    { day: "Thursday", value: 4 },
    { day: "Friday", value: 5 },
    { day: "Saturday", value: 6 },
    { day: "Sunday", value: 7 },
  ];

exports.bookBoutiqueAppointment = async (req, res) => {
    try {
      var { boutique_id, customer_id, appointment_date, start_time, end_time } = req.body
      var boutique = await boutiqueService.getBoutiqueByBoutiqueId(boutique_id)
      if (!boutique) {
        return res.status(400).send({HasError: true,Message: "Invalid boutique or customer."});
      }
      if (isNaN(boutique_id) || isNaN(customer_id)) {
        return res.status(400).send({HasError: true,Message: 'Invalid parameters.'});
      }
      if (
        !moment(appointment_date, 'YYYY-MM-DD', true).isValid() ||
        !moment(start_time, 'HH:mm:ss', true).isValid() ||
        !moment(end_time, 'HH:mm:ss', true).isValid()
      ) {
        return res.status(400).send({HasError: true,Message: 'Invalid date or time format.'});
      }
      const currentDate = moment().format('YYYY-MM-DD');
      if (moment(appointment_date).isBefore(currentDate)) {
        return res.status(400).send({
          HasError: true,
          StatusCode: 400,
          Message: 'Invalid appointment date.'
        });
      }
      var slotAvailability = await botiqueAppointmentService.boutiqueWeeklySchedule(boutique_id);
      const matchingSlot = slotAvailability.some((slot) => {
        const slotStartTime = slot.start_time;
        const slotEndTime = slot.end_time;
  
        return (
          slot.week_day === moment(appointment_date).isoWeekday() &&
          start_time === slotStartTime &&
          end_time === slotEndTime &&
          slot.check_availability === 1
        );
      });  
      if (matchingSlot) {
        const appointmentData = {
          boutique_id: boutique_id,
          customer_id: customer_id,
          appointment_date: moment(appointment_date).format('YYYY-MM-DD'),
          start_time: start_time,
          end_time: end_time,
          status: 1,
          total_fee: 0
        };  
        const appointment = await botiqueAppointmentService.boutiqueAppointment(appointmentData);  
        return res.status(200).send({
          HasError: false,
          Message: 'Thank you for booking the slot.'
        });
      } else {
        return res.status(400).send({
          HasError: true,
          StatusCode: 400,
          Message: 'Selected slot is not available.'
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        HasError: true,
        Message: 'Failed to book appointment'
      });
    }
}
  
  
