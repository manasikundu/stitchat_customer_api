var FDService = require("../service/FDService");
var Users = require("../model/userModel");
var Designer = require("../model/FDModel");
var { Op } = require("sequelize");
var db = require("../dbConnection");
var moment = require("moment");
var Service = require("../service/userService");
var { generateAccessToken, auth } = require("../jwt");
var s3 = require("../config/s3Config");
var dotenv = require("dotenv");
dotenv.config();

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
    var filters = {
      name: req.body.name,
      boutique_id: req.body.boutique_id,
    };

    var mobile_number = req.body.mobile_number;

    var method_name = await Service.getCallingMethodName();
    console.log(method_name);
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

    var fashionDesigners = await FDService.fashionDesignerList();
    console.log("fashion designer :", fashionDesigners);
    var boutiqueInfo = await FDService.getBoutiqueInfo();

    var searchFilters = {};

    // Filter by name (first_name or last_name)
    if (filters.name) {
      searchFilters[Op.or] = [
        { first_name: { [Op.iLike]: `%${filters.name}%` } },
        { last_name: { [Op.iLike]: `%${filters.name}%` } },
      ];
    }

    if (filters.boutique_id) {
      searchFilters.boutique_id = filters.boutique_id;
    }

    // Create variables for time formatting
    var formatStartTime = (time) => moment(time, "HH:mm:ss").format("hh:mm A");
    var formatEndTime = (time) => moment(time, "HH:mm:ss").format("hh:mm A");

    var weekDayList = fashionDesigners.map(
      (user) => user["weekly_schedule.week_day"]
    );

    // Create a map to group designers by user_id
    var designerMap = new Map();
    fashionDesigners.forEach((user, index) => {
      var userId = user.user_id;
      var dayValue = weekDayList[index];
      if (designerMap.has(userId)) {
        if (dayValue !== null && dayValue >= 1 && dayValue <= 7) {
          var dayConfig = daysOfWeekConfig.find(
            (config) => config.value === dayValue
          );
          var dayName = dayConfig ? dayConfig.day : "Unknown Day";

          var availabilityText =
            user["weekly_schedule.check_availability"] === 1 ? true : false;
          var time =
            formatStartTime(user["weekly_schedule.start_time"]) +
            " - " +
            formatEndTime(user["weekly_schedule.end_time"]);

          designerMap.get(userId).week_schedule.push({
            day: dayValue,
            day_name: dayName,
            time: time,
            availability: availabilityText,
          });
        } else {
          var availabilityText =
            user["weekly_schedule.check_availability"] === 1 ? true : false;
          var time =
            formatStartTime(user["weekly_schedule.start_time"]) +
            " - " +
            formatEndTime(user["weekly_schedule.end_time"]);

          designerMap.get(userId).week_schedule.push({
            day: "Unknown Day",
            time: time,
            availability: availabilityText,
          });
        }
      } else {
        var availabilityText =
          user["weekly_schedule.check_availability"] === 1 ? true : false;
        var time =
          formatStartTime(user["weekly_schedule.start_time"]) +
          " - " +
          formatEndTime(user["weekly_schedule.end_time"]);

        var full_name = user.prefix + " " + user.first_name;
        if (user.last_name !== null) {
          full_name += " " + user.last_name;
        }

        designerMap.set(userId, {
          id: user.id,
          user_id: user.user_id,
          boutique_id: user["designers.boutique_id"],
          boutique_name: boutiqueInfo.boutique_name,
          address: boutiqueInfo.address,
          area: boutiqueInfo.area,
          city: boutiqueInfo.city,
          country_state: boutiqueInfo.coutry_state,
          prefix: user.prefix,
          first_name: user.first_name,
          last_name: user.last_name,
          full_name: full_name,
          register_date: moment(user.reg_on, "YYYY-MM-DD hh:mm:ss").format(
            "DD-MM-YYYY hh:mm A"
          ),
          mobile_number: user.mobile_number,
          email: user.email_id,
          role: user.role,
          role_name: user.role === 4 ? "Designer" : user.role,
          available_time: time,
          base_price: 0,
          offer_price: 0,
          experience: 1,
          communication_type: "1, 2",
          communication_name: "Call, Video Call",
          language_type: "1, 2",
          language_speak: "English, Hindi",
          profile_photo: user.profile_photo,
          week_schedule: [
            {
              day: dayValue,
              day_name:
                dayValue !== null && dayValue >= 1 && dayValue <= 7
                  ? daysOfWeekConfig.find((config) => config.value === dayValue)
                    .day
                  : "Unknown Day",
              time: time,
              availability: availabilityText,
            },
          ],
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

    // Convert map values to an array of designers
    var formattedFashionDesigners = {
      fashionDesignerInfo: Array.from(designerMap.values()),
    };

    var limit = req.body.limit ? parseInt(req.body.limit) : null;
    var offset = req.body.offset ? parseInt(req.body.offset) : null;

    var filters = {
      where: searchFilters,
      order: [["id", "ASC"]],
      limit: limit,
      offset: offset,
    };

    if (
      (filters.name &&
        (filters.name !== "string" || filters.name.trim() === "")) ||
      (filters.boutique_id &&
        (isNaN(filters.boutique_id) ||
          !Number.isInteger(Number(filters.boutique_id))))
    ) {
      return res.status(400).send({
        result: [],
        HasError: true,
        StatusCode: 400,
        Message: "Invalid parameters.",
      });
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
        result: formattedFashionDesigners,
        HasError: false,
        StatusCode: 200,
        Message: "Fashion Designer List retrieving successfully.",
      });
    }
  } catch (error) {
    console.error("Error in getFashionDesigners:", error);
    res
      .status(500)
      .send({ error: "An error occurred while fetching fashion designers." });
  }
};

// Details of FD
exports.FashionDesignerDetails = async (req, res) => {
  try {
    var designerName = req.body.designer_name;
    var user_id = req.body.user_id;
    var boutique_id = req.body.boutique_id;
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

    let designerDetails = [];
    if (user_id) {
      designerDetails = await FDService.getDesignerDetailsByUserIdAndBoutiqueId(
        user_id
      );
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

    var weekSchedules = designerDetails.map((designer) => {
      var weekDay = designer["weekly_schedule.week_day"];
      var availabilityText =
        designer["weekly_schedule.check_availability"] === 1 ? true : false;
      var startTime = designer["weekly_schedule.start_time"];
      var endTime = designer["weekly_schedule.end_time"];
      var dayName = daysOfWeekConfig.find(
        (config) => config.value === weekDay
      ).day;

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

      var boutiqueInfo = await FDService.getBoutiqueInfo();
      // console.log("boutique info: ", boutiqueInfo)

      return res.status(200).send({
        result: {
          designer_name: fullName,
          about_me:
            "I am a Fashion designer, fusing elegance and modernity into timeless designs that inspire . ",
          boutique_id: designerDetails[0]["designers.boutique_id"],
          boutique_name: boutiqueInfo.boutique_name,
          address: boutiqueInfo.address,
          area: boutiqueInfo.area,
          city: boutiqueInfo.city,
          country_state: boutiqueInfo.coutry_state,
          register_date: moment(
            designerDetails[0].reg_on,
            "YYYY-MM-DD hh:mm:ss"
          ).format("DD-MM-YYYY hh:mm A"),
          role: designerDetails[0].role,
          role_name:
            designerDetails[0].role === 4
              ? "Designer"
              : designerDetails[0].role,
          available_time: time,
          base_price: 0,
          offer_price: 0,
          experience: 1,
          communication_type: "1, 2",
          communication_name: "Call, Video Call",
          language_type: "1, 2",
          language_speak: "English, Hindi",
          profile_photo: designerDetails[0].profile_photo,
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

    var designerDetails = [];

    // Check if user_id is not a number or is an empty string
    if (isNaN(user_id) || user_id === "") {
      return res.status(400).send({
        HasError: true,
        StatusCode: 400,
        Message: "Invalid parameter.",
      });
    }

    if (user_id) {
      designerDetails = await FDService.getDesignerDetailsByUserIdAndBoutiqueId(
        user_id
      );
    }

    if (designerDetails.length === 0) {
      return res.status(404).send({
        HasError: true,
        StatusCode: 400,
        Message: "Designer not found.",
      });
    }

    var firstName = designerDetails[0]["first_name"];
    var lastName = designerDetails[0]["last_name"];
    var fullName =
      firstName && lastName
        ? firstName + " " + lastName
        : firstName || lastName;

    var weekSchedules = designerDetails.map((designer) => {
      var weekDay = designer["weekly_schedule.week_day"];
      var availabilityText =
        designer["weekly_schedule.check_availability"] === 1 ? true : false;
      var startTime = designer["weekly_schedule.start_time"];
      var endTime = designer["weekly_schedule.end_time"];
      var dayName = daysOfWeekConfig.find(
        (config) => config.value === weekDay
      ).day;

      // Define the function to format time
      var formatTime = (time) => moment(time, "HH:mm:ss").format("hh:mm A");
      var resultTime = `${formatTime(startTime)} - ${formatTime(endTime)}`;

      return {
        level: dayName,
        key: weekDay,
        availability: availabilityText,
      };
    });

    var boutiqueInfo = await FDService.getBoutiqueInfo();

    // Fetch availability slots for the designer
    var availabilitySlots = await FDService.getAvailability(user_id);

    // Create a Set to store processed slots
    var processedSlots = new Set();

    // Initialize the response structure
    var response = {
      appointment_slot_time: [],
    };

    // Define the start and end dates for the range you want to generate responses for
    var startDate = moment().add(1, "day");
    var endDate = moment().add(7, "days");

    availabilitySlots.forEach((slot) => {
      // Check if the slot has already been processed
      if (!processedSlots.has(slot.id)) {
        processedSlots.add(slot.id);
      }
    });

    // Generate responses for morning, afternoon, and evening slots
    var generateSlotResponse = async (slots) => {
      var responses = [];
      var customer_id;

      for (var slot of slots) {
        var isAvailable = await FDService.isSlotAvailable(
          user_id,
          slot.start_time,
          slot.end_time
        );

        var status, check_availability;

        if (isAvailable && isAvailable.status === 1) {
          // If status is 'approve', set status to 0 and check_availability to false
          status = 0;
          check_availability = false;
        } else {
          // For other statuses (pending, reject/cancel, completed), set status to 1 and check_availability to true
          status = 1;
          check_availability = true;
        }

        var slotStartTime = moment(slot.start_time, "HH:mm:ss");
        var slotEndTime = moment(slot.end_time, "HH:mm:ss");

        var foundConfig = daysOfWeekConfig.find(
          (config) => config.value === slot.week_day
        );

        var dayValue = foundConfig?.value || "";

        // Fetch duration from the config
        var durationConfig = appointmentTimeConfig.find(
          (config) => config.slot === "duration"
        );
        var duration = parseInt(durationConfig.time);

        // Determine mybook based on user_id and customer_id matching
        var mybook = user_id === customer_id ? 1 : 0;

        responses.push({
          status: status,
          mybook: mybook,
          duration: duration.toString(),
          check_availability: check_availability,
          strtotime_start_time: slotStartTime.unix(),
          strtotime_end_time: slotEndTime.unix(),
          slot_start_time: slotStartTime.format("HH:mm:ss"),
          slot_end_time: slotEndTime.format("HH:mm:ss"),
          slot_view_time: slotStartTime.format("hh:mm A"),
          slot_view_time_details: `${slotStartTime.format(
            "hh:mm A"
          )} - ${slotEndTime.format("hh:mm A")}`,
          date: moment().add(dayValue, "days").format("YYYY-MM-DD"),
        });
      }

      return responses;
    };

    // Define a global variable to track the first day with availability
    var firstAvailabilityFound = false;

    // Function to generate slot response for a specific date
    var generateSlotResponseForDate = async (date) => {
      // Determine the day of the week (e.g., Monday, Tuesday)
      var dayOfWeek = date.format("dddd");

      // Filter availability slots for the specified day of the week
      var availabilitySlotsForDay = availabilitySlots.filter(
        (slot) => daysOfWeekConfig[slot.week_day - 1].day === dayOfWeek
      );

      // Initialize availabilityCheck as false by default
      var availabilityCheck = false;

      // Iterate through the array and find the availability for the given day
      for (var slot of weekSchedules) {
        if (slot.level === date.format("dddd")) {
          availabilityCheck = slot.availability;
          break;
        }
      }

      // Initialize morning, afternoon, and evening slots arrays
      var morningSlots = [];
      var afternoonSlots = [];
      var eveningSlots = [];

      if (availabilityCheck) {
        // Get the fashion designer's start_time and end_time for the day
        var fashionDesignerDay = availabilitySlotsForDay[0]; // Assume the first slot
        var fashionDesignerStartTime = moment(
          fashionDesignerDay.start_time,
          "HH:mm:ss"
        );
        var fashionDesignerEndTime = moment(
          fashionDesignerDay.end_time,
          "HH:mm:ss"
        );

        // Calculate the dynamic startTime and endTime based on the fashion designer's time
        var startTime = fashionDesignerStartTime.clone();
        var endTime = fashionDesignerEndTime.clone();

        while (startTime < endTime) {
          var slotEndTime = moment(startTime, "HH:mm:ss")
            .add(30, "minutes")
            .format("HH:mm:ss");

          if (
            moment(startTime, "HH:mm:ss").isBetween(
              fashionDesignerStartTime,
              fashionDesignerEndTime
            )
          ) {
            if (
              moment(startTime, "HH:mm:ss").isBetween(
                moment("08:00:00", "HH:mm:ss"),
                moment("12:00:00", "HH:mm:ss")
              )
            ) {
              morningSlots.push({
                start_time: startTime.format("HH:mm:ss"),
                end_time: slotEndTime,
              });
            } else if (
              moment(startTime, "HH:mm:ss").isBetween(
                moment("12:00:00", "HH:mm:ss"),
                moment("17:00:00", "HH:mm:ss")
              )
            ) {
              afternoonSlots.push({
                start_time: startTime.format("HH:mm:ss"),
                end_time: slotEndTime,
              });
            } else if (
              moment(startTime, "HH:mm:ss").isBetween(
                moment("17:00:00", "HH:mm:ss"),
                moment("20:00:00", "HH:mm:ss")
              )
            ) {
              eveningSlots.push({
                start_time: startTime.format("HH:mm:ss"),
                end_time: slotEndTime,
              });
            }
          }

          startTime = moment(slotEndTime, "HH:mm:ss");
        }
      }

      // Initialize timerange object based on availabilityCheck
      var timerange = availabilityCheck
        ? {
          morning: await generateSlotResponse(morningSlots),
          afternoon: await generateSlotResponse(afternoonSlots),
          evening: await generateSlotResponse(eveningSlots),
        }
        : {};

      // Determine if this is the first day with availability
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
        selected: selected, // Set selected based on firstAvailabilityFound
        timerange: timerange,
      };

      return daySlot;
    };

    // Loop through the date range and generate responses for each date
    while (startDate.isBefore(endDate)) {
      var daySlot = await generateSlotResponseForDate(startDate);
      response.appointment_slot_time.push(daySlot);
      startDate.add(1, "day");
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
      console.log("boutique : ", boutiqueInfo);

      // Construct the response JSON
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
      };

      return res.status(200).send({
        result,
        HasError: false,
        StatusCode: 200,
        Message: "Designer details retrieved successfully.",
      });
    }
  } catch (error) {
    console.error("Error in fashionDesignerTimeSlotNew:", error);
    res
      .status(500)
      .send({ error: "An error occurred while fetching designer details." });
  }
};

// add and update address
exports.addNewAddress = async (req, res) => {
  try {
    var method_name = await Service.getCallingMethodName();
    var apiEndpointInput = JSON.stringify(req.body);
    // Track API hit
    apiTrack = await Service.trackApi(req.query.user_id, method_name, apiEndpointInput, req.query.device_id, req.query.device_info, req.ip);
    var { first_name, last_name, user_id, street, landmark, state, city, mobile_number, pincode, } = req.body;
    if (
      (!req.body.addressId && // For insert
        (!first_name || !last_name || !user_id || !street || !landmark || !state || !city || !mobile_number || !pincode)) ||
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
      first_name, last_name, user_id, street, landmark, state, city, mobile_number, pincode, is_primary: req.body.is_primary || 0, is_verify: req.body.is_verify || 0,
      verify_date: new Date().toISOString().slice(0, 19).replace("T", " "),
      created_at: new Date().toISOString().slice(0, 19).replace("T", " "),
      updated_at: new Date().toISOString().slice(0, 19).replace("T", " "),
    };

    addressData.verify_date = addressData.verify_date.slice(0, -5);
    addressData.created_at = addressData.created_at.slice(0, -5);
    addressData.updated_at = addressData.updated_at.slice(0, -5);

    var cityResult = await FDService.cityList(city);
    var stateResult = await FDService.stateList(state);
    var query = {}
    query.user_id = user_id;
    console.log(user_id)
    const result = await FDService.getAddressList(query);
    const data = [];
    for (let i in result) {
      var state = await FDService.stateList(result[i].state);
      var cityName = await FDService.cityList(result[i].city);

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
        (formattedAddress.pincode = result[i].pincode),
        (formattedAddress.is_primary = result[i].is_primary),
        (formattedAddress.is_verify = result[i].is_verify),
        (formattedAddress.selected = result[i].is_primary == 1 ? true : false),
        data.push(formattedAddress);
    }
    var result1 = {}
    result1.user_id = user_id,
      result1.address = data
    if (req.body.addressId) {
      var updatedAddress = await FDService.addAddress(req.body.addressId,addressData);
      return res.status(200).json({
        result: result1,
        HasError: false,
        StatusCode: 200,
        message: "Address updated successfully",
      });
    } else {
      // If addressId is not provided, it's an insert
      var newAddress = await FDService.addAddress(null, addressData);
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
    // var method_name = await Service.getCallingMethodName();
    // var apiEndpointInput = JSON.stringify(req.body);
    // apiTrack = await Service.trackApi(
    //   req.query.user_id,
    //   method_name,
    //   apiEndpointInput,
    //   req.query.device_id,
    //   req.query.device_info,
    //   req.ip
    // );
    const { user_id, id, city, user_name, mobile_number } = req.query;
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
      return res.status(500).send({
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
    var { fashion_designer_id, user_id, appointment_date, start_time, end_time, address_id, total_fees, } = req.body;
    if (
      !Number.isInteger(fashion_designer_id) ||
      !Number.isInteger(user_id) ||
      !Number.isInteger(address_id) ||
      !moment(appointment_date, "YYYY-MM-DD", true).isValid() ||
      !moment(start_time, "HH:mm:ss", true).isValid() ||
      !moment(end_time, "HH:mm:ss", true).isValid() ||
      isNaN(parseFloat(total_fees)) ||
      !isFinite(total_fees) ||
      total_fees < 0 ||
      moment(start_time, "HH:mm:ss").isSameOrAfter(moment(end_time, "HH:mm:ss"))
    ) {
      return res.status(400).send({
        HasError: true,
        StatusCode: 400,
        Message: "Invalid parameters.",
      });
    }
    // Create the appointmentData object
    var appointmentData = {
      user_id: fashion_designer_id,
      customer_id: user_id,
      appointment_date: moment(appointment_date).format("YYYY-MM-DD"),
      start_time: start_time,
      end_time: end_time,
      total_fees: parseFloat(total_fees),
      transaction_id: 0,
      status: 0,
      address_id: address_id,
    };
    // Check if the requested slot is available
    var isSlotAvailable = await FDService.slotAvailability(fashion_designer_id, start_time, end_time, appointment_date);
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
    const userId = req.query.user_id
    const result = await FDService.appointmentList(userId)
    if (result.length !== 0) {
      return res.status(200).send({
        HasError: false,
        message: "Appointment list fetched succesfully.",
        result: result
      })
    } else {
      return res.status(200).send({
        HasError: false,
        message: "No Appointment list found.",
        result: result
      })
    }
  } catch (error) {
    console.log(error)
    return res.status(500).send({
      HasError: true,
      Message: 'Something went wrong',
    });
  }
}

exports.deleteAddress = async (req, res) => {
  try {
    const user_id = req.query.user_id;
    const address_id = req.query.address_id;
    const result = await FDService.deleteAddress(user_id, address_id)
    if (result != 0) {
      return res.status(200).send({
        HasError: false,
        message: "Address deleted succesfully.",
      })
    } else {
      return res.status(200).send({
        HasError: false,
        message: "No address found.Failed to delete.",
      })
    }
  } catch (error) {
    console.log(error)
    return res.status(500).send({
      HasError: true,
      Message: 'Something went wrong',
    });
  }

}



