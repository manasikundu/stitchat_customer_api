const FDService = require("../service/FDService");
const Users = require("../model/userModel");
const Designer = require("../model/FDModel");
const ratingService = require("../service/ratingService")
const { Op, sequelize } = require("sequelize");
const db = require("../dbConnection");
const moment = require("moment");
const Service = require("../service/userService");
const boutiqueService = require('../service/userBoutiqueService')
const { generateAccessToken, auth } = require("../jwt");
const s3 = require("../config/s3Config");
const dotenv = require("dotenv");
dotenv.config();
const Appointment = require("../model/appointmentModel")

var expirationTime = 600;

var daysOfWeekConfig = [
  { day: "Monday", value: 1 },
  { day: "Tuesday", value: 2 },
  { day: "Wednesday", value: 3 },
  { day: "Thursday", value: 4 },
  { day: "Friday", value: 5 },
  { day: "Saturday", value: 6 },
  { day: "Sunday", value: 7 },
];

var formattedDaysOfWeek = {};

for (var i = 0; i < daysOfWeekConfig.length; i++) {
  var day = daysOfWeekConfig[i].day;
  var value = daysOfWeekConfig[i].value;
  formattedDaysOfWeek[day] = value;
}

var appointmentTimeConfig = [
  { slot: "start_time", time: "08:00" },
  { slot: "end_time", time: "20.00" },
  { slot: "duration", time: "30" },
  { slot: "morning_slot", time: "12:00:00" },
  { slot: "afternoon_slot", time: "17:00:00" },
  { slot: "evening_slot", time: "20:00:00" },
];

var formattedAppointmentConfig = {};

for (var i = 0; i < appointmentTimeConfig.length; i++) {
  var slot = appointmentTimeConfig[i].slot;
  var time = appointmentTimeConfig[i].time;
  formattedAppointmentConfig[slot] = time;
}

var communicationModes = [
  { id: 1, mode: "Call" },
  { id: 2, mode: "Video Call" },
  { id: 3, mode: "In Person Visit" },
];
var formattedCommunicationModes = {};

for (var i = 0; i < communicationModes.length; i++) {
  var id = communicationModes[i].id;
  var mode = communicationModes[i].mode;
  formattedCommunicationModes[id] = mode;
}

var languages = [
  { id: 1, name: "English" },
  { id: 2, name: "Hindi" },
  { id: 3, name: "Odia" },
];
var formattedLanguages = {};

for (var i = 0; i < languages.length; i++) {
  var id = languages[i].id;
  var name = languages[i].name;
  formattedLanguages[id] = name;
}

// Listing of FD
exports.fashionDesignerList = async (req, res) => {
  try {
    var { name, mobileNumber, location, address, city, area, coutry_state } = req.body
    var mobile_number = req.body.mobile_number;
    var method_name = await Service.getCallingMethodName()
    var apiEndpointInput = JSON.stringify(req.body)
    apiTrack = await Service.trackApi(
      req.query.user_id,
      method_name,
      apiEndpointInput,
      req.query.device_id,
      req.query.device_info,
      req.ip
    );
    var searchFilters = {};
    if (name) {
      searchFilters[Op.or] = [
        { first_name: { [Op.iLike]: `%${name}%` } },
        { last_name: { [Op.iLike]: `%${name}%` } },
      ];
    }
    if (mobileNumber) {
      searchFilters.mobile_number = mobileNumber;
    }
    var boutiqueFilters = ''
    if (location) {
      boutiqueFilters = `AND (
        i.address ILIKE '%${address}%' OR
        i.city ILIKE '%${city}%' OR
        i.area ILIKE '%${area}%' OR
        i.coutry_state ILIKE '%${coutry_state}%')`
    }
    var fashionDesigners = await FDService.getFashionDesigners(searchFilters);
    var boutiqueInfo = await FDService.getBoutiqueInfo(boutiqueFilters);
    var schedule = await FDService.getFashionDesignerSchedules();
    var formatStartTime = (time) => moment(time, "HH:mm:ss").format("hh:mm A");
    var formatEndTime = (time) => moment(time, "HH:mm:ss").format("hh:mm A");
    var designerMap = new Map();
    fashionDesigners.forEach((user) => {
      var userId = user.user_id;
      var userSchedule = schedule.filter((item) => item.user_id === userId);
      var week_schedule = [];

      var week_schedule = userSchedule.map((scheduleItem) => {
        var dayValue = scheduleItem.week_day || "";
        var start_time = scheduleItem.start_time || "";
        var end_time = scheduleItem.end_time || "";
        var availabilityText =
          scheduleItem.check_availability === 1 ? true : false;
        var dayConfig = daysOfWeekConfig.find(
          (config) => config.value === dayValue
        );
        var dayName = dayConfig ? dayConfig.day : "";
        var time =
          formatStartTime(start_time) + " - " + formatEndTime(end_time);
        return {
          day: dayValue,
          day_name: dayName,
          time: time,
          availability: availabilityText,
        };
      });
      var availableTime = "";
      if (userSchedule.length > 0) {
        var sortedSchedule = userSchedule.sort(
          (a, b) => a.week_day - b.week_day
        );
        var firstAvailableDay = sortedSchedule.find(
          (item) => item.check_availability === 1
        );
        var lastAvailableDay = [...sortedSchedule]
          .reverse()
          .find((item) => item.check_availability === 1);
        if (firstAvailableDay && lastAvailableDay) {
          var startTime = moment(
            firstAvailableDay.start_time,
            "HH:mm:ss"
          ).format("hh:mm A");
          var endTime = moment(lastAvailableDay.end_time, "HH:mm:ss").format(
            "hh:mm A"
          );
          availableTime = `${startTime} - ${endTime}`;
        }
      }
      var full_name = user.prefix + " " + user.first_name;
      if (user.last_name !== null) {
        full_name += " " + user.last_name;
      }
      var designerBoutiqueInfo = boutiqueInfo.find(
        (boutique) => boutique.id === user.id
      );
      var maskedNumber = Service.maskMobileNumber(user.mobile_number)
      if (designerBoutiqueInfo) {
        var {
          id, boutique_id, boutique_name, coutry_state, city, area, address, location_lat, location_lng, about_me, communication_mode, language_speak, education, experience, base_price, offer_price,
        } = designerBoutiqueInfo;
        designerMap.set(userId, {
          id: user.id,
          user_id: user.user_id,
          about_me:
            "I am a Fashion designer, fusing elegance and modernity into timeless designs that inspire . ",
          boutique_id: boutique_id,
          boutique_name: boutique_name,
          address: address,
          area: area,
          city: city,
          country_state: coutry_state,
          lattitute: location_lat,
          longitude: location_lng,
          prefix: user.prefix,
          first_name: user.first_name,
          last_name: user.last_name,
          full_name: full_name,
          register_date: moment(user.reg_on, "YYYY-MM-DD hh:mm:ss").format(
            "DD-MM-YYYY hh:mm A"
          ),
          mobile_number: user.mobile_number,
          masked_mobile_number: maskedNumber,
          email: user.email_id,
          role: user.role,
          role_name: user.role === 4 ? "Designer" : user.role,
          available_time: availableTime,
          base_price: base_price,
          offer_price: offer_price,
          experience: experience,
          communication_type: "1, 2",
          communication_name: "Call, Video Call",
          language_type: "1, 2",
          language_speak: "English, Hindi",
          profile_photo: user.profile_photo,
          week_schedule: week_schedule,
          dayOfWeek: [formattedDaysOfWeek],
          appointmentTime: [formattedAppointmentConfig],
          communication_modes: [
            {
              id: 1,
              name: "Call",
            },
            {
              id: 2,
              name: "Video Call",
            },
          ],
          languages: [
            {
              id: 1,
              name: "English",
            },
            {
              id: 2,
              name: "Hindi",
            },
          ],
        });
      }
    });
    var fashionDesignersList = Array.from(designerMap.values());

    var fashionDesignersWithWeekSchedule = fashionDesignersList.filter((designer) => {
      return designer.week_schedule && designer.week_schedule.length > 0;
    })

    var limit = req.body.limit ? parseInt(req.body.limit) : null;
    var offset = req.body.offset ? parseInt(req.body.offset) : null;

    var filters = {
      where: searchFilters,
      order: [["id", "ASC"]],
      limit: limit,
      offset: offset,
    };

    // Generate access token using the provided secretKey
    var secretKey = "tensorflow";
    var token = generateAccessToken(mobile_number, secretKey);

    if (!token) {
      return res.status(500).send({
        HasError: true,
        StatusCode: 500,
        message: "Failed to generate token",
      });
    } else {
      // Set the token in a custom response header
      res.setHeader("X-Auth-Token", token);
      return res.status(200).send({
        result: {
          fashionDesignerInfo: fashionDesignersWithWeekSchedule,
        },
        HasError: false,
        StatusCode: 200,
        Message: "Fashion Designer List retrieving successfully.",
      });
    }
  } catch (error) {
    console.error("Error in getFashionDesigners:", error);
    res.status(500).send({ error: "An error occurred while fetching fashion designers." });
  }
};




// Details of FD
exports.FashionDesignerDetails = async (req, res) => {
  try {
    var user_id = req.body.user_id;
    var mobile_number = req.body.mobile_number;

    var method_name = await Service.getCallingMethodName();
    var apiEndpointInput = JSON.stringify(req.body);

    // Track API hit
    apiTrack = await Service.trackApi(
      req.query.user_id,
      method_name,
      apiEndpointInput,
      req.query.device_id,
      req.query.device_info,
      req.ip
    );
    const boutiqueInfo = await db.query(`select * from sarter__boutique_basic_info where id in(select boutique_id from sarter__boutique_user_map where user_id =${user_id})`)
    // console.log(boutiqueInfo)
    // var designerDetails = [];
    // if (user_id) {
    const designerDetails = await FDService.getDesignerDetailsByUserId(user_id);
    const btq_id = await db.query(`select * from sarter__boutique_user_map where user_id=${user_id}`);
    const id = btq_id[0][0].boutique_id;
    const main = [];
    const result1 = await db.query(`select * from sarter__boutique_service_dic where boutique_id=${id}`); //category Type
    for (let i in result1[0]) {
      const mainJson = {};
      mainJson.categoryType = result1[0][i].category_type;
      const categoryType = result1[0][i].category_type;
      if (categoryType == 1) {
        mainJson.name = "Men";
      } else if (categoryType == 2) {
        mainJson.name = "Women";
      } else if (categoryType == 3) {
        mainJson.name = "Kids";
      } else {
        mainJson.name = "All";
      }
      const result2 = await db.query(`select * from sarter__category_item_dic where id in(select parent_id from sarter__category_item_dic where id=${result1[0][i].service_id})`);
      var category = [];
      var categoryJson = {};
      categoryJson.category_id = result2[0][0].id;
      categoryJson.category_name = result2[0][0].name;
      const catagoryImage = await db.query(`SELECT * FROM sarter__category_item_images where category_id in(select parent_id from sarter__category_item_dic where id=${result1[0][i].service_id})`);
      if (catagoryImage[0][0]) {
        var category_image = s3.getSignedUrl("getObject", {
          Bucket: process.env.AWS_BUCKET,
          Key: `category_item/${catagoryImage[0][0].image}`,
          Expires: expirationTime,
        });
        categoryJson.category_image = category_image;
      } else {
        categoryJson.category_image = '';
      }
      const result3 = await db.query(`select * from sarter__category_item_dic where id=${result1[0][i].service_id}`);
      const item = [];
      const itemJson = {};
      itemJson.item_id = result3[0][0].id;
      itemJson.item_name = result3[0][0].name;
      const itemImage = await db.query(`select * from sarter__category_item_images where category_id=${result1[0][i].service_id}`);
      var item_image = s3.getSignedUrl("getObject", {
        Bucket: process.env.AWS_BUCKET,
        Key: `category_item/${itemImage[0][0].image}`,
        Expires: expirationTime,
      });
      itemJson.item_image = item_image;

      const amount = await db.query(`select * from sarter__item_price_master where boutique_id=${id} and category_item_dic_id=${result1[0][i].service_id}`);
      itemJson.item_price_id = amount[0][0] ? amount[0][0].id : 0;
      itemJson.min_amount = amount[0][0] ? amount[0][0].min_amount : 0;
      itemJson.max_amount = amount[0][0] ? amount[0][0].max_amount : 0;
      item.push(itemJson);
      categoryJson.item = item;
      category.push(categoryJson);
      mainJson.category = category;
      main.push(mainJson);
    }
    const data = Object.values(main.reduce((acc, { categoryType, name, category }) => {
      acc[categoryType] = acc[categoryType] || { categoryType, name, category: [] };
      acc[categoryType].category.push(...category);
      return acc;
    }, {})
    );
    for (var k in data) {
      var cat = data[k].category;
      var data1 = Object.values(cat.reduce((acc, { category_id, category_name, category_image, item }) => {
        acc[category_id] = acc[category_id] || { category_id, category_name, category_image, item: [] };
        acc[category_id].item.push(...item);
        return acc;
      }, {}));
      data[k].category = data1;
    }
    if (designerDetails.length === 0) {
      return res.status(404).send({
        HasError: true,
        StatusCode: 404,
        Message: "Designer not found.",
      });
    }
    var firstName = designerDetails[0]["first_name"];
    var lastName = designerDetails[0]["last_name"];
    var fullName =
      firstName && lastName
        ? firstName + " " + lastName
        : firstName || lastName;

    var schedule = await FDService.getWeeklyScheduleByUserId(user_id);
    var weekSchedules = schedule.map((designer) => {
      var weekDay = designer.week_day;
      var availabilityText = designer.check_availability === 1 ? true : false;
      var startTime = designer.start_time;
      var endTime = designer.end_time;
      var dayConfig = daysOfWeekConfig.find(
        (config) => config.value === weekDay
      );
      var dayName = dayConfig ? dayConfig.day : "";

      // Define the function to format time
      var formatTime = (time) => moment(time, "HH:mm:ss").format("hh:mm A");
      var resultTime = `${formatTime(startTime)} - ${formatTime(endTime)}`;

      return {
        day: weekDay,
        day_name: dayName,
        time: resultTime,
        availability: availabilityText,
      };
    });
    var availableTime = "";
    if (schedule.length > 0) {
      var sortedSchedule = schedule.sort((a, b) => a.week_day - b.week_day);
      var firstAvailableDay = sortedSchedule.find((item) => item.check_availability === 1);
      var lastAvailableDay = [...sortedSchedule].reverse().find((item) => item.check_availability === 1);
      if (firstAvailableDay && lastAvailableDay) {
        var startTime = moment(firstAvailableDay.start_time, "HH:mm:ss").format("hh:mm A");
        var endTime = moment(lastAvailableDay.end_time, "HH:mm:ss").format("hh:mm A");
        availableTime = `${startTime} - ${endTime}`;
      }
    }

    // Generate access token using the provided secretKey
    var secretKey = "tensorflow";
    var token = generateAccessToken(mobile_number, secretKey);

    if (!token) {
      return res.status(500).send({
        HasError: true,
        StatusCode: 500,
        message: "Failed to generate token",
      });
    } else {
      // Set the token in a custom response header
      res.setHeader("X-Auth-Token", token);

      return res.status(200).send({
        result: {
          designer_name: fullName,
          about_me:
            "I am a Fashion designer, fusing elegance and modernity into timeless designs that inspire . ",
          boutique_id: boutiqueInfo[0][0].boutique_id ? boutiqueInfo[0][0].boutique_id : 0,
          boutique_name: boutiqueInfo[0][0].boutique_name ? boutiqueInfo[0][0].boutique_name : '',
          address: boutiqueInfo[0][0].address ? boutiqueInfo[0][0].address : '',
          area: boutiqueInfo[0][0].area ? boutiqueInfo[0][0].area : '',
          city: boutiqueInfo[0][0].city ? boutiqueInfo[0][0].city : '',
          country_state: boutiqueInfo[0][0].coutry_state,
          register_date: moment(
            designerDetails[0].reg_on,
            "YYYY-MM-DD hh:mm:ss"
          ).format("DD-MM-YYYY hh:mm A"),
          role: designerDetails[0].role,
          role_name:
            designerDetails[0].role === 4
              ? "Designer"
              : designerDetails[0].role,
          available_time: availableTime,
          base_price: boutiqueInfo[0][0].base_price ? boutiqueInfo[0][0].base_price : '',
          offer_price: boutiqueInfo[0][0].offer_price ? boutiqueInfo[0][0].offer_price : '',
          experience: boutiqueInfo[0][0].experience ? boutiqueInfo[0][0].experience : 0,
          communication_type: boutiqueInfo[0][0].communication_mode ? boutiqueInfo[0][0].communication_mode : '',
          communication_name: "Call, Video Call",
          language_type: "1, 2",
          language_speak: boutiqueInfo[0][0].language_speak ? boutiqueInfo[0][0].language_speak : '',
          profile_photo: designerDetails[0].profile_photo,
          service_category: data,
          week_schedule: weekSchedules,
          dayOfWeek: [formattedDaysOfWeek],
          appointmentTime: [formattedAppointmentConfig],
          communication_modes: [
            {
              id: 1,
              name: "Call",
            },
            {
              id: 2,
              name: "Video Call",
            },
          ],
          languages: [
            {
              id: 1,
              name: "English",
            },
            {
              id: 2,
              name: "Hindi",
            },
          ],
        },

        HasError: false,
        StatusCode: 200,
        Message: "Designer details retrieved successfully.",
      });
    }
  } catch (error) {
    console.error("Error in getDesignerDetails:", error);
    res
      .status(500)
      .send({ error: "An error occurred while fetching designer details." });
  }
};

// FD time slot
exports.fashionDesignerTimeSlot = async (req, res) => {
  try {
    var user_id = req.body.fashion_designer_id;
    var customer_id = req.body.user_id;
    const mobile_number = req.body.mobile_number;
    const method_name = await Service.getCallingMethodName();
    const apiEndpointInput = JSON.stringify(req.body);
    const apiTrack = await Service.trackApi(req.query.user_id,method_name,apiEndpointInput,req.query.device_id,req.query.device_info,req.ip);
    if (isNaN(user_id) || user_id === "") {
      return res.status(400).send({
        HasError: true,
        StatusCode: 400,
        Message: "Invalid parameter.",
      });
    }
    var designerDetails = await FDService.getDesignerDetailsByUserId(user_id);
    if (designerDetails.length === 0) {
      return res.status(404).send({
        HasError: true,
        StatusCode: 400,
        Message: "Designer not found.",
      });
    }
    var firstName = designerDetails[0]["first_name"];
    var lastName = designerDetails[0]["last_name"];
    var fullName = firstName && lastName ? firstName + " " + lastName : firstName || lastName;
    var schedule = await FDService.getWeeklyScheduleByUserId(user_id);
    var weekSchedules = schedule.map((designer) => {
      var weekDay = designer.week_day;
      var availabilityText = designer.check_availability === 1 ? true : false;
      var startTime = designer.start_time;
      var endTime = designer.end_time;
      var dayConfig = daysOfWeekConfig.find((config) => config.value === weekDay);
      var dayName = dayConfig ? dayConfig.day : "";
      var formatTime = (time) => moment(time, "HH:mm:ss").format("hh:mm A");
      var resultTime = `${formatTime(startTime)} - ${formatTime(endTime)}`;
      return {
        level: dayName,
        key: weekDay,
        availability: availabilityText,
      };
    });
    var boutiqueInfo = await FDService.getBoutiqueInfo();
    var availabilitySlots = await FDService.getAvailability(user_id);
    var processedSlots = new Set();
    var response = { appointment_slot_time: [] };
    var startDate = moment().add(1, "day");
    var endDate = moment().add(8, "days");
    availabilitySlots.forEach((slot) => {
      if (!processedSlots.has(slot.id)) {
        processedSlots.add(slot.id);
      }
    });
    var firstAvailabilityFound = false;
    var generateSlotResponseForDate = async (date) => {
      var dayOfWeek = date.format("dddd");
      var availabilitySlotsForDay = availabilitySlots.filter(
        (slot) => daysOfWeekConfig[slot.week_day - 1].day === dayOfWeek
      );
      var availabilityCheck = false;
      for (var slot of weekSchedules) {
        if (slot.level === date.format("dddd")) {
          availabilityCheck = slot.availability;
          break;
        }
      }
      var morningSlots = [];
      var afternoonSlots = [];
      var eveningSlots = [];
      if (availabilityCheck) {
        var fashionDesignerDay = availabilitySlotsForDay[0]; // Assume the first slot
        var fashionDesignerStartTime = fashionDesignerDay.start_time;
        var fashionDesignerEndTime = fashionDesignerDay.end_time;
        var startTime = "08:00:00";
        var endTime = "20:00:00";
        while (startTime <= endTime) {
          var slotEndTime = moment(startTime, "HH:mm:ss").add(30, "minutes").format("HH:mm:ss");
          var status = 0;
          if (startTime >= fashionDesignerStartTime && startTime < fashionDesignerEndTime) {
            status = 1; // Set status to 1 when within the designer's available time
          }
          if (startTime >= "08:00:00" && startTime < "12:00:00") {
            morningSlots.push({ start_time: startTime, end_time: slotEndTime });
          } else if (startTime >= "12:00:00" && startTime < "17:00:00") {
            afternoonSlots.push({ start_time: startTime, end_time: slotEndTime });
          } else if (startTime >= "17:00:00" && startTime < "20:00:00") {
            eveningSlots.push({ start_time: startTime, end_time: slotEndTime });
          }
          startTime = slotEndTime;
        }
      }
      var timerange = availabilityCheck
        ? {
            morning: await generateSlotResponse(morningSlots, fashionDesignerStartTime, fashionDesignerEndTime),
            afternoon: await generateSlotResponse(afternoonSlots, fashionDesignerStartTime, fashionDesignerEndTime),
            evening: await generateSlotResponse(eveningSlots, fashionDesignerStartTime, fashionDesignerEndTime),
          }
        : {};
      var selected = false;
      if (availabilityCheck && !firstAvailabilityFound) {
        selected = true;
        firstAvailabilityFound = true;
      }
      var daySlot = {
        weekday: moment(date).isoWeekday(),
        date: date.format("YYYY-MM-DD"),
        dayname: date.format("dddd"),
        availability: availabilityCheck,
        selected: selected,
        timerange: timerange,
      };
      return daySlot;
    };
    var generateSlotResponse = async (slots, fashionDesignerStartTime, fashionDesignerEndTime) => {
      var responses = [];
      for (var slot of slots) {
        var status = 0;
        if (slot.start_time >= fashionDesignerStartTime && slot.start_time < fashionDesignerEndTime) {
          status = 1;
        }
        var check_availability = status === 1;
        var durationConfig = appointmentTimeConfig.find((config) => config.slot === "duration");
        var duration = parseInt(durationConfig.time);
        var bookedSlots = await FDService.bookedSlots(user_id);
        var hasBookedSlot = bookedSlots.some(
          (bookedSlot) =>
            bookedSlot.customer_id === customer_id &&
            bookedSlot.start_time === slot.start_time &&
            bookedSlot.end_time === slot.end_time &&
            bookedSlot.appointment_date === slot.appointment_date);
        var mybook = hasBookedSlot ? 1 : 0;
        var isBooked = bookedSlots.some((bookedSlot) =>
        bookedSlot.customer_id === customer_id &&
          bookedSlot.start_time === slot.start_time &&
          bookedSlot.end_time === slot.end_time &&
          bookedSlot.appointment_date === slot.appointment_date);
        var check_availability = status === 1 && !isBooked;
        var slotJson = {};
        slotJson.status = status;
        slotJson.mybook = mybook;
        slotJson.duration = duration.toString();
        slotJson.check_availability = check_availability;
        slotJson.strtotime_start_time = moment(slot.start_time, "HH:mm:ss").unix();
        slotJson.strtotime_end_time = moment(slot.end_time, "HH:mm:ss").unix();
        slotJson.slot_start_time = slot.start_time;
        slotJson.slot_end_time = slot.end_time;
        slotJson.slot_view_time = moment(slot.start_time, "HH:mm:ss").format("hh:mm A");
        slotJson.slot_view_time_details = `${moment(slot.start_time, "HH:mm:ss").format("hh:mm A")} - ${moment(slot.end_time, "HH:mm:ss").format("hh:mm A")}`;
        slotJson.date = moment().add(slot.week_day - 1, "days").format("YYYY-MM-DD");
        responses.push(slotJson);
      }
      return responses;
    };
    while (startDate.isBefore(endDate)) {
      var daySlot = await generateSlotResponseForDate(startDate);
      response.appointment_slot_time.push(daySlot);
      startDate.add(1, "day");
    }
    response.appointment_slot_time = response.appointment_slot_time.map((daySlot) => {
      if (daySlot.availability) {
        daySlot.timerange.morning = daySlot.timerange.morning.map((morningSlot) => {
          morningSlot.date = daySlot.date;
          return morningSlot;
        });
        daySlot.timerange.afternoon = daySlot.timerange.afternoon.map((afternoonSlot) => {
          afternoonSlot.date = daySlot.date;
          return afternoonSlot;
        });
        daySlot.timerange.evening = daySlot.timerange.evening.map((eveningSlot) => {
          eveningSlot.date = daySlot.date;
          return eveningSlot;
        });
      }
      return daySlot;
    });
    var secretKey = "tensorflow";
    var token = generateAccessToken(mobile_number, secretKey);
    if (!token) {
      return res.status(500).send({
        HasError: true,
        StatusCode: 500,
        message: "Failed to generate token",
      });
    } else {
      res.setHeader("X-Auth-Token", token);
      var result = {
        fashionDesignerdetails: {
          id: user_id,
          name: fullName,
          country_state: boutiqueInfo.coutry_state,
          city: boutiqueInfo.city,
          area: boutiqueInfo.area,
          address: boutiqueInfo.address,
          landmark: boutiqueInfo.landmark,
          lattitute: boutiqueInfo.location_lat,
          longitude: boutiqueInfo.location_lng,
          base_price: boutiqueInfo.base_price,
          offer_price: boutiqueInfo.offer_price,
          experience: boutiqueInfo.experience,
          communication_type: "1, 2",
          communication_name: "Call, Video Call",
          language_type: "1, 2",
          language_speak: "English, Hindi",
          profile_photo: designerDetails[0].profile_photo,
          availability: weekSchedules,
          timeslot: response.appointment_slot_time,
          dayOfWeek: [formattedDaysOfWeek],
          appointmentTime: [formattedAppointmentConfig],
          communication_modes: [{ id: 1, name: "Call" }, { id: 2, name: "Video Call" }],
          languages: [{ id: 1, name: "English" }, { id: 2, name: "Hindi" }],
        },
      };
      return res.status(200).send({
        result,
        HasError: false,
        StatusCode: 200,
        Message: "Designer details retrieved successfully.",
      });
    }
  } catch (error) {
    console.error("Error in fashionDesignerTimeSlot:", error);
    res.status(500).send({ error: "An error occurred while fetching designer details." });
  }
};

// add and update address
exports.addNewAddress = async (req, res) => {
  try {
    var method_name = await Service.getCallingMethodName();
    var apiEndpointInput = JSON.stringify(req.body);
    // Track API hit
    apiTrack = await Service.trackApi(
      req.query.user_id,
      method_name,
      apiEndpointInput,
      req.query.device_id,
      req.query.device_info,
      req.ip
    );
    var {
      first_name,
      last_name,
      user_id,
      street,
      landmark,
      state,
      city,
      mobile_number,
      pincode,
    } = req.body;
    if (
      (!req.body.addressId && // For insert
        (!first_name ||
          !last_name ||
          !user_id ||
          !street ||
          !landmark ||
          !state ||
          !city ||
          !mobile_number ||
          !pincode)) ||
      (req.body.addressId && !Number.isInteger(req.body.addressId))
    ) {
      return res.status(400).json({
        HasError: true,
        StatusCode: 400,
        message: "Invalid parameters.",
      });
    }
    if (!/^\+?[1-9]\d{9}$/.test(mobile_number.replace(/\D/g, ""))) {
      return res.status(400).json({
        HasError: true,
        StatusCode: 400,
        message: "Invalid phone number. ",
      });
    }
    var formatDate = (dateString) =>
      moment(dateString, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD hh:mm A");

    var addressData = {
      first_name,
      last_name,
      user_id,
      street,
      landmark,
      state,
      city,
      mobile_number,
      pincode,
      is_primary: req.body.is_primary || 0,
      is_verify: req.body.is_verify || 0,
      verify_date: new Date().toISOString().slice(0, 19).replace("T", " "),
      created_at: new Date().toISOString().slice(0, 19).replace("T", " "),
      updated_at: new Date().toISOString().slice(0, 19).replace("T", " "),
    };

    addressData.verify_date = addressData.verify_date.slice(0, -5);
    addressData.created_at = addressData.created_at.slice(0, -5);
    addressData.updated_at = addressData.updated_at.slice(0, -5);

    var cityResult = await FDService.cityList(city);
    var stateResult = await FDService.stateList(state);
    var query = {};
    query.user_id = user_id;

    if (req.body.addressId) {
      var updatedAddress = await FDService.addAddress(
        req.body.addressId,
        addressData
      );
      const result = await FDService.getAddressList(query);
      const data = [];

      for (var i in result) {
        var state = await FDService.stateList(result[i].state);
        var cityName = await FDService.cityList(result[i].city);
        var maskedNumber = result[i].mobile_number !== null ? Service.maskMobileNumber(result[i].mobile_number) : null;

        var formattedAddress = {};
        (formattedAddress.id = result[i].id),
          (formattedAddress.first_name = result[i].first_name),
          (formattedAddress.last_name = result[i].last_name),
          (formattedAddress.user_id = result[i].user_id),
          (formattedAddress.street = result[i].street),
          (formattedAddress.landmark = result[i].landmark),
          (formattedAddress.state = result[i].state),
          (formattedAddress.state_name = state.name),
          (formattedAddress.city = result[i].city),
          (formattedAddress.city_name = cityName.name),
          (formattedAddress.mobile_number = result[i].mobile_number),
          (formattedAddress.masked_mobile_number = maskedNumber),
          (formattedAddress.pincode = result[i].pincode),
          (formattedAddress.is_primary = result[i].is_primary),
          (formattedAddress.is_verify = result[i].is_verify),
          // (formattedAddress.created_at = formatDate(result[i].created_at)),
          (formattedAddress.selected =
            result[i].is_primary == 1 ? true : false),
          data.push(formattedAddress);
      }
      var result1 = {};
      (result1.user_id = user_id), (result1.address = data);
      return res.status(200).json({
        result: result1,
        HasError: false,
        StatusCode: 200,
        message: "Address updated successfully",
      });
    } else {
      // If addressId is not provided, it's an insert
      var newAddress = await FDService.addAddress(null, addressData);
      const result = await FDService.getAddressList(query);
      const data = [];
      for (let i in result) {
        var state = await FDService.stateList(result[i].state);
        var cityName = await FDService.cityList(result[i].city);
        var maskedNumber = await Service.maskMobileNumber(result[i].mobile_number)
        var formattedAddress = {};
        (formattedAddress.id = result[i].id),
          (formattedAddress.first_name = result[i].first_name),
          (formattedAddress.last_name = result[i].last_name),
          (formattedAddress.user_id = result[i].user_id),
          (formattedAddress.street = result[i].street),
          (formattedAddress.landmark = result[i].landmark),
          (formattedAddress.state = result[i].state),
          (formattedAddress.state_name = state.name),
          (formattedAddress.city = result[i].city),
          (formattedAddress.city_name = cityName.name),
          (formattedAddress.mobile_number = result[i].mobile_number),
          (formattedAddress.masked_mobile_number = maskedNumber),
          (formattedAddress.pincode = result[i].pincode),
          (formattedAddress.is_primary = result[i].is_primary),
          (formattedAddress.is_verify = result[i].is_verify),
          // (formattedAddress.created_at = formatDate(result[i].created_at)),
          (formattedAddress.selected =
            result[i].is_primary == 1 ? true : false),
          data.push(formattedAddress);
      }
      var result1 = {};
      (result1.user_id = user_id), (result1.address = data);
      return res.status(201).json({
        result: result1,
        HasError: false,
        StatusCode: 201,
        message: "Address added successfully",
      });
    }
  } catch (error) {
    console.error("Error adding/updating address:", error);
    return res.status(500).json({
      HasError: true,
      StatusCode: 500,
      message: "An error occurred while adding/updating the address",
      error: error.message,
    });
  }
};

// state list
exports.getStateList = async (req, res) => {
  try {
    var id = req.query.id;
    var method_name = await Service.getCallingMethodName();
    var apiEndpointInput = JSON.stringify(req.body);

    // Track API hit
    apiTrack = await Service.trackApi(
      req.query.user_id,
      method_name,
      apiEndpointInput,
      req.query.device_id,
      req.query.device_info,
      req.ip
    );

    // Check if 'id' is provided and is a valid integer
    if (id !== undefined && !Number.isInteger(parseInt(id))) {
      return res.status(400).json({
        // result: null,
        HasError: true,
        StatusCode: 400,
        message: "Invalid parameter.",
      });
    }

    var states = await FDService.getStateList(id);

    if (states.length === 0) {
      return res.status(200).json({
        result: states,
        HasError: true,
        StatusCode: 200,
        message: "No data found.",
      });
    } else {
      return res.status(200).json({
        result: states,
        HasError: false,
        StatusCode: 200,
        message: "State retrieved successfully.",
      });
    }
  } catch (error) {
    return res.status(500).json({
      // result: error,
      HasError: true,
      StatusCode: 500,
      message: "Some error occurred. Try once again.",
    });
  }
};

// city list
exports.getCityList = async (req, res) => {
  try {
    var method_name = await Service.getCallingMethodName();
    var apiEndpointInput = JSON.stringify(req.body);

    // Track API hit
    apiTrack = await Service.trackApi(
      req.query.user_id,
      method_name,
      apiEndpointInput,
      req.query.device_id,
      req.query.device_info,
      req.ip
    );

    var state_id = req.body.state_id;
    // Check if 'state_id' is provided and is a valid integer
    if (state_id !== undefined && !Number.isInteger(parseInt(state_id))) {
      return res.status(400).json({
        // result: null,
        HasError: true,
        StatusCode: 400,
        message: "Invalid parameter.",
      });
    }
    var city = await FDService.getCityList(state_id);

    if (city.length === 0) {
      return res.status(200).json({
        result: city,
        HasError: true,
        StatusCode: 200,
        message: "No data found.",
      });
    } else {
      return res.status(200).json({
        result: city,
        HasError: false,
        StatusCode: 200,
        message: "City retrieving successfully. ",
      });
    }
  } catch (error) {
    return res.status(200).json({
      result: states,
      HasError: true,
      StatusCode: 500,
      message: "Some error occured. Try once again. ",
    });
  }
};

exports.getAddressList = async (req, res) => {
  try {
    const { user_id, id, city, user_name, mobile_number } = req.query;
    var method_name = await Service.getCallingMethodName();
    var apiEndpointInput = JSON.stringify(req.body);
    apiTrack = await Service.trackApi(
      req.query.user_id,
      method_name,
      apiEndpointInput,
      req.query.device_id,
      req.query.device_info,
      req.ip
    );
    var query = {};
    if (id) {
      query.id = id;
    }
    if (user_id) {
      query.user_id = user_id;
    }
    if (city) {
      query.city = city;
    }
    if (user_name) {
      query.first_name = { [Op.iLike]: user_name + "%" };
    }
    if (mobile_number) {
      query.mobile_number = mobile_number;
    }
    const result = await FDService.getAddressList(query);
    if (result.length != 0) {
      const data = [];
      for (let i in result) {
        var state = await FDService.stateList(result[i].state);
        var cityName = await FDService.cityList(result[i].city);
        maskedNumber = await Service.maskMobileNumber(result[i].mobile_number)

        var formattedAddress = {};
        (formattedAddress.id = result[i].id),
          (formattedAddress.first_name = result[i].first_name),
          (formattedAddress.last_name = result[i].last_name),
          (formattedAddress.user_id = result[i].user_id),
          (formattedAddress.street = result[i].street),
          (formattedAddress.landmark = result[i].landmark),
          (formattedAddress.state = result[i].state),
          (formattedAddress.state_name = state.name),
          (formattedAddress.city = result[i].city),
          (formattedAddress.city_name = cityName.name),
          (formattedAddress.mobile_number = result[i].mobile_number),
          (formattedAddress.masked_mobile_number = maskedNumber),
          (formattedAddress.pincode = result[i].pincode),
          (formattedAddress.is_primary = result[i].is_primary),
          (formattedAddress.is_verify = result[i].is_verify),
          data.push(formattedAddress);
      }
      return res.status(200).send({
        HasError: false,
        message: "Address list fetched succesfully.",
        result: data,
      });
    } else {
      return res.status(200).send({
        HasError: false,
        message: "No address found",
        result: [],
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      HasError: true,
      message: error.message,
    });
  }
};

// book appointment
exports.bookAppointment = async (req, res) => {
  try {
    var {fashion_designer_id,user_id,appointment_date,start_time,end_time,address_id,total_fees} = req.body
    var designer = await FDService.getDesignerDetailsByUserId(fashion_designer_id);
    var user = await Appointment.findOne({where: {customer_id: user_id}});
    if (designer.length===0 || !user) {
      return res.status(400).send({
      HasError: true,
      StatusCode: 400,
      Message: "Invalid fashion designer or user.",
    });
    }
    if (
      isNaN(fashion_designer_id) ||
      isNaN(user_id) ||
      isNaN(address_id) ||
      parseFloat(total_fees) < 0
    ) {
      return res.status(400).send({
        HasError: true,
        StatusCode: 400,
        Message: "Invalid parameters.",
      });
    }
    if (!moment(appointment_date, "YYYY-MM-DD", true).isValid() ||
      !moment(start_time, "HH:mm:ss", true).isValid() ||
      !moment(end_time, "HH:mm:ss", true).isValid()) {
      return res.status(400).send({
        HasError: true,
        StatusCode: 400,
        Message: "Invalid date or time format.",
      });
    }
    if (
      !moment(appointment_date, "YYYY-MM-DD", true).isValid() ||
      !moment(start_time, "HH:mm:ss", true).isValid() ||
      !moment(end_time, "HH:mm:ss", true).isValid() ||
      !/^\d{2}:\d{2}:\d{2}$/.test(start_time) ||
      !/^\d{2}:\d{2}:\d{2}$/.test(end_time)
    ) {
      return res.status(400).send({
        HasError: true,
        StatusCode: 400,
        Message: "Invalid date or time format. Use HH:mm:ss format.",
      });
    }
    var currentDate = moment().format("YYYY-MM-DD");
    if (moment(appointment_date).isBefore(currentDate)) {
      return res.status(400).send({
        HasError: true,
        StatusCode: 400,
        Message: "Invalid appointment date.",
      });
    }
    var appointmentWeekDay = daysOfWeekConfig.find(
      (day) => day.day === moment(appointment_date).format("dddd")
    )?.value;
    if (!appointmentWeekDay) {
      return res.status(400).send({
        HasError: true,
        StatusCode: 400,
        Message: "Invalid appointment day.",
      });
    }
    var slotAvailability = await FDService.getAvailability(fashion_designer_id);
    var appointmentStartTime = start_time
    var appointmentEndTime = end_time
    var isValidTimeSlot = slotAvailability.some((slot) => {
      var slotStartTime = slot.start_time
      var slotEndTime = slot.end_time
      return (
        slot.week_day == appointmentWeekDay &&
        slot.check_availability == 1 &&
        appointmentStartTime >= slotStartTime &&
        appointmentEndTime <= slotEndTime
      );
    })
    if (!isValidTimeSlot) {
      return res.status(400).send({
        HasError: true,
        StatusCode: 400,
        Message: "Invalid time. Please select a valid time slot.",
      });    
    } else {
    var appointmentData = {
      user_id: fashion_designer_id,
      customer_id: user_id,
      appointment_date: moment(appointment_date).format("YYYY-MM-DD"),
      start_time: start_time,
      end_time: end_time,
      total_fees: parseFloat(total_fees),
      transaction_id: 0,
      status: 1,
      address_id: address_id,
    };
    // Check if the requested slot is available
    var isSlotAvailable = await FDService.slotAvailability(
      fashion_designer_id,
      start_time,
      end_time,
      appointment_date
    );
    if (isSlotAvailable) {
      var appointment = await FDService.bookAppointment(appointmentData);
      return res.status(200).send({
        HasError: false,
        Message: "Thank you for booking the slot.",
      });
    } else {
      return res.status(200).send({
        HasError: true,
        Message: "Slot is already booked. Please select another time slot.",
      });
    }
  } 
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      HasError: true,
      Message: "Failed to book appointment",
    });
  }
};

exports.appointmentList = async (req, res) => {
  try {
    const userId = req.query.user_id;
    const result = await FDService.appointmentList(userId);
    const data = [];
    if (result.length !== 0) {
      for (var i in result) {
        var dataJson = {};
        dataJson.id = result[i].id;
        dataJson.user_id = result[i].user_id;
        const result1 = await Service.getUserByUserId(result[i].user_id)
        dataJson.customer_id = result[i].customer_id;
        dataJson.appointment_code = result[i].appointment_code;
        dataJson.start_time = result[i].start_time;
        dataJson.end_time = result[i].end_time;
        dataJson.appointment_date = result[i].appointment_date;
        dataJson.total_fees = result[i].total_fees;
        dataJson.status = result[i].status;
        if (result[i].status == 0) {
          dataJson.status_name = "Pending";
        }
        if (result[i].status == 1) {
          dataJson.status_name = "Approve";
        }
        if (result[i].status == 2) {
          dataJson.status_name = "Reject/Cancel";
        }
        if (result[i].status == 3) {
          dataJson.status_name = "completed";
        }
        dataJson.transaction_id = result[i].transaction_id;
        dataJson.address_id = result[i].address_id;
        dataJson.appointment_datetime =
          result[i].appointment_date + " " + result[i].start_time;
        dataJson.first_name = result1.first_name;
        dataJson.last_name = result1.last_name;
        dataJson.full_name = (result1.first_name ? result1.first_name : "") + (result1.last_name ? " " + result1.last_name : "")
        data.push(dataJson);
      }
      return res.status(200).send({
        HasError: false,
        message: "Appointment list fetched succesfully.",
        result: data,
      });
    } else {
      return res.status(200).send({
        HasError: false,
        message: "No Appointment list found.",
        result: data,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      HasError: true,
      Message: "Something went wrong",
    });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const user_id = req.query.user_id;
    const address_id = req.query.address_id;
    const result = await FDService.deleteAddress(user_id, address_id);
    if (result != 0) {
      return res.status(200).send({
        HasError: false,
        message: "Address deleted succesfully.",
      });
    } else {
      return res.status(200).send({
        HasError: false,
        message: "No address found.Failed to delete.",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      HasError: true,
      Message: "Something went wrong",
    });
  }
};

exports.fashionDesignerAppointmentDetails = async (req, res) => {
  try {
    const { user_id, appointment_id } = req.query;
    var result1 = await FDService.appointmentDetails(appointment_id);
    const btq_id = await db.query(`select * from sarter__boutique_user_map where user_id=${user_id}`);
    const id = btq_id[0][0].boutique_id;
    const exp=await db.query(`select experience from sarter__boutique_basic_info where id=${id}`)
    console.log(exp)
    const data = {}
    var formatTime = (time) => moment(time, "HH:mm:ss").format("hh:mm A");

    if (result1) {
      result1 = result1.toJSON()
      const result3 = await Service.getUserByUserId(result1.user_id)      
      const fashiondesignerappointmentDetails = {}
      fashiondesignerappointmentDetails.id = result1.id ? result1.id : 0
      fashiondesignerappointmentDetails.fashion_designer_id = result1.user_id ? result1.user_id : 0
      fashiondesignerappointmentDetails.customer_id = result1.customer_id ? result1.customer_id : 0
      fashiondesignerappointmentDetails.appointment_code = result1.appointment_code ? result1.appointment_code : ''
      fashiondesignerappointmentDetails.start_time = result1.start_time ? result1.start_time : ''
      fashiondesignerappointmentDetails.end_time = result1.end_time ? result1.end_time : ''
      fashiondesignerappointmentDetails.appointment_date = result1.appointment_date ? result1.appointment_date : ''
      fashiondesignerappointmentDetails.total_fees = result1.total_fees ? result1.total_fees : ''
      fashiondesignerappointmentDetails.transaction_id = result1.transaction_id ? result1.transaction_id : ''
      fashiondesignerappointmentDetails.status = result1.status ? result1.status : ''
      fashiondesignerappointmentDetails.add_date = result1.created_at ? result1.created_at : ''
      fashiondesignerappointmentDetails.update_date = result1.update_at ? result1.update_at : ''
      fashiondesignerappointmentDetails.address_id = result1.address_id ? result1.address_id : 0
      fashiondesignerappointmentDetails.fashiondesigner_firstname = result3.first_name ? result3.first_name : ''
      fashiondesignerappointmentDetails.fashiondesigner_lastname = result3.last_name ? result3.last_name : ''
      fashiondesignerappointmentDetails.profile_img = result3.profile_photo ? result3.profile_photo : ''
      fashiondesignerappointmentDetails.experience = exp[0][0]?exp[0][0].experience:0
      fashiondesignerappointmentDetails.viewstarttime = formatTime(result1.start_time)
      fashiondesignerappointmentDetails.viewendtime = formatTime(result1.end_time)
      fashiondesignerappointmentDetails.cancelflag = true
      fashiondesignerappointmentDetails.reschedule = true
      fashiondesignerappointmentDetails.rating_flag = false
      if (result1.status == 0) {
        fashiondesignerappointmentDetails.statusmessage = "Pending";
      }
      if (result1.status == 1) {
        fashiondesignerappointmentDetails.statusmessage = "Approve";
      }
      if (result1.status == 2) {
        fashiondesignerappointmentDetails.statusmessage = "Reject/Cancel";
      }
      if (result1.status == 3) {
        fashiondesignerappointmentDetails.statusmessage = "completed";
      }
      data.fashiondesignerappointmentDetails = fashiondesignerappointmentDetails;
      var result2 = await FDService.getAddressByUserId(user_id);
      var address = {}
      var maskedNumber = await Service.maskMobileNumber(result2.mobile_number)

      if (result2) {
        result2 = result2.toJSON()
        address.id = result2.id ? result2.id : 0
        address.user_id = result2.user_id ? result2.user_id : 0
        address.name = result2.first_name ? result2.first_name : ''
        address.clname = result2.last_name ? result2.last_name : ''
        address.street = result2.street ? result2.street : ''
        address.landmark = result2.landmark ? result2.landmark : ''
        address.city = result2.city ? result2.city : ''
        address.state = result2.state ? result2.state : ''
        address.pincode = result2.pincode ? result2.pincode : ''
        address.cmobile = maskedNumber ? maskedNumber : ''
        address.is_primary = result2.is_primary ? result2.is_primary : ''
        address.is_verify = result2.is_verify ? result2.is_verify : ''
        address.verify_date = result2.verify_date ? result2.verify_date : ''
        address.add_date = result2.created_at ? result2.created_at : ''
        address.clname = result2.last_name ? result2.last_name : ''

        if (result2.state) {
          var stateName = await FDService.stateList(result2.state);
          address.statename = stateName.name ? stateName.name : ''
        } else {
          address.statename = ''
        }
        if (result2.city) {
          var cityName = await FDService.cityList(result2.city);
          address.cityname = cityName.name ? cityName.name : ''
        } else {
          address.cityname = ''
        }
      }
      fashiondesignerappointmentDetails.address = address
      var appointmentRatings = await ratingService.getRatingForAppointment(appointment_id);
      var rating = {}
      if (appointmentRatings) {
        appointmentRatings = appointmentRatings.toJSON()
        rating.rate_id = appointmentRatings.id ? appointmentRatings.id : ''
        rating.rate = parseFloat(appointmentRatings.rate) ? parseFloat(appointmentRatings.rate) : ''
        rating.comment = appointmentRatings.comment ? appointmentRatings.comment : ''
      }
      else {
        rating.rate_id = 0;
        rating.rate = 0;
        rating.comment = '';
      }
      if (appointmentRatings) {
        fashiondesignerappointmentDetails.rating_flag = true
      } else {
        fashiondesignerappointmentDetails.rating_flag = false
      }
      data.appointmentRatings = rating;
    } else {
      return res.status(200).send({
        HasError: false,
        message: "No data found",
        result: {},
      });
    }
    return res.status(200).send({
      HasError: false,
      message: "Appointment details fetched succesfully.",
      result: data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      HasError: true,
      Message: "Something went wrong",
    });
  }
};

exports.cancelAppointment = async (req, res) => {
  try {
    const status = 2;
    const result = await FDService.cancelAppointment(
      req.params.appointment_id,
      status
    );
    if (result != 0) {
      return res.status(200).send({
        HasError: false,
        message: "Appointment cancelled succesfully.",
      });
    } else {
      return res.status(200).send({
        HasError: false,
        message: "No appointment found.Failed to cancel.",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      HasError: true,
      Message: "Something went wrong",
    });
  }
};
