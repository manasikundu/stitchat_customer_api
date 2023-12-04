const botiqueAppointmentService = require('../service/boutiqueAppointmentService')
const Service = require('../service/userService')
const moment = require('moment')
const botiqueAppointment = require('../model/boutiqueAppointmentModel')
const boutiqueService = require('../service/userBoutiqueService')
const s3 = require("../config/s3Config");
const dotenv = require("dotenv");
dotenv.config();
var expirationTime = 600;
const logService = require('../service/logService')


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
      return res.status(400).send({ HasError: true, Message: "Invalid boutique or customer." });
    }
    if (isNaN(boutique_id) || isNaN(customer_id)) {
      return res.status(400).send({ HasError: true, Message: 'Invalid parameters.' });
    }
    if (
      !moment(appointment_date, 'YYYY-MM-DD', true).isValid() ||
      !moment(start_time, 'HH:mm:ss', true).isValid() ||
      !moment(end_time, 'HH:mm:ss', true).isValid()
    ) {
      return res.status(400).send({ HasError: true, Message: 'Invalid date or time format.' });
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
    var matchingSlot = slotAvailability.some((slot) => {
      var slotStartTime = slot.start_time;
      var slotEndTime = slot.end_time;
      console.log(moment(appointment_date).isoWeekday())

      return (
        // slot.week_day == moment(appointment_date).isoWeekday() &&
        start_time == slotStartTime &&
        end_time == slotEndTime 
        // slot.check_availability === 0
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
      return res.status(200).send({
        HasError: false,
        Message: 'Selected slot is not available.'
      });
    }
  } catch (error) {
    console.log(error);
    const logData = { user_id: "", status: 'false', message: error.message, device_id: '', created_at: Date.now(), updated_at: Date.now(), device_info: '', action: req.url }
    const log = await logService.createLog(logData)
    return res.status(500).send({
      HasError: true,
      Message: error.message
    })
  }
}

exports.boutiqueSlot = async (req, res) => {
  try {
    var customer_id = req.body.customer_id
    var boutique_id = req.body.boutique_id
    if (isNaN(customer_id) || customer_id === "" || isNaN(boutique_id) || boutique_id === "") {
      return res.status(400).send({ HasError: true, Message: "Invalid parameter." });
    }
    var boutiqueDetail = await boutiqueService.getBoutiqueByBoutiqueId(boutique_id)
    if (!boutiqueDetail) {
      return res.status(404).send({ HasError: true, Message: "Boutique not found." });
    }
    var schedule = await botiqueAppointmentService.boutiqueWeeklySchedule(boutique_id);

    var weekSchedules = schedule.map((boutique) => {
      var weekDay = boutique.week_day;
      // var availabilityText = boutique.check_availability === 1 ? true : false;
      var startTime = boutique.start_time;
      var endTime = boutique.end_time;
      var dayConfig = daysOfWeekConfig.find((config) => config.value === weekDay);
      var dayName = dayConfig ? dayConfig.day : "";
      var formatTime = (time) => moment(time, "HH:mm:ss").format("hh:mm A");
      var resultTime = `${formatTime(startTime)} - ${formatTime(endTime)}`;
      return {
        day: weekDay,
        dayName: dayName,
        start_time: startTime,
        end_time: endTime,
        slot_time: resultTime,
        availibility: true
      };
    }).sort((a, b) => {
      if (a.start_time < b.start_time) return -1;
      if (a.start_time > b.start_time) return 1;
      return 0;
    }).filter((slot, index, self) => {
      return index === self.findIndex((s) => (
        s.start_time === slot.start_time && s.end_time === slot.end_time
      ));
    });

    var items = await botiqueAppointmentService.itemInBoutiqueSlot(boutique_id)
    var itemArray = items.map((item) => {
      return {
        item_id: item.item_id,
        item_name: item.item_name,
        item_image: s3.getSignedUrl("getObject", {
          Bucket: process.env.AWS_BUCKET,
          Key: `category_item/${item.item_image}`,
          Expires: expirationTime,
        }),
      };
    });
    // var maskedNumber = Service.maskMobileNumber(boutiqueDetail.contact_number)
    var maskedNumber = boutiqueDetail.contact_number !== null ? Service.maskMobileNumber(boutiqueDetail.contact_number) : '';

    var boutiqueLogo = "";
    var boutiqueLogo = boutiqueDetail.boutique_logo
      ? await s3.getSignedUrl("getObject", {
        Bucket: process.env.AWS_BUCKET,
        Key: `boutique/${boutiqueDetail.boutique_logo}`,
        Expires: expirationTime,
      })
      : s3.getSignedUrl("getObject", {
        Bucket: process.env.AWS_BUCKET,
        Key: `boutique/default-img.jpg`,
        Expires: expirationTime
      })
    var slotJson = {}
    slotJson.boutique_id = boutique_id
    slotJson.boutique_name = boutiqueDetail.boutique_name ? boutiqueDetail.boutique_name : ''
    slotJson.address = boutiqueDetail.address ? boutiqueDetail.address : ''
    slotJson.image = boutiqueLogo
    slotJson.contact_number = boutiqueDetail.contact_number ? boutiqueDetail.contact_number : ''
    slotJson.masked_contact_number = maskedNumber
    slotJson.timeslot = weekSchedules ? weekSchedules : []
    slotJson.item = itemArray ? itemArray : []

    return res.status(200).send({ HasError: false, Message: "Boutique slot fetched successfully.", boutiqueDetails: slotJson });
  } catch (error) {
    console.log(error)
    const logData = { user_id: "", status: 'false', message: error.message, device_id: '', created_at: Date.now(), updated_at: Date.now(), device_info: '', action: req.url }
    const log = await logService.createLog(logData)
    return res.status(500).send({ HasError: true, Message: error.message });
  }
}


