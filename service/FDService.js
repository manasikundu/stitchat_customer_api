let db = require("../dbConnection");
let Designer = require("../model/FDModel");
var { Op } = require("sequelize");
let crypto = require("crypto");
let Users = require("../model/userModel");
var sequelize = require("../dbConnection");
let DesignerDetails = require("../model/FDModel");
let FashionDesignerWeeklySchedule = require("../model/weeklySchleduleModel");
let UsersAddress = require("../model/userAddressModel");
let Boutique = require("../model/userBoutiqueInfoModel");
const { query } = require("express");
let moment = require("moment");
var State = require("../model/stateModel");
var City = require("../model/cityModel");
var Country = require("../model/countryModel");
const { add } = require("date-fns");
var Appointment = require("../model/appointmentModel");

exports.fashionDesignerList = async () => {
  try {
    var usersWithDesigners = await Users.findAll({
      attributes: [
        "id",
        ["id", "user_id"],
        "prefix",
        "first_name",
        "last_name",
        "reg_on",
        "user_type_id",
        "mobile_number",
        "email_id",
        "role",
        "profile_photo",
      ],
      where: {
        user_type_id: {
          [Op.in]: [6, 8],
        },
      },
      order: [["user_id", "DESC"]],
      include: [
        {
          model: FashionDesignerWeeklySchedule,
          as: "weekly_schedule",
          attributes: [
            "week_day",
            "start_time",
            "end_time",
            "check_availability",
          ],
        },
      ],

      raw: true, // Return raw data instead of Sequelize instances
    });

    return usersWithDesigners;
  } catch (error) {
    console.error("Error listing Fashion Designers:", error);
    return {
      result: [],
      HasError: true,
      StatusCode: 500,
      Message: "An error occurred while listing Fashion Designers.",
    };
  }
};

exports.getBoutiqueInfo = async () => {
  try {
    var boutiqueInfo = `SELECT
                i.boutique_name,
                i.address,
	              i.area,
                i.city,
                i.coutry_state,
                i.about_me,
                i.communication_mode,
                i.language_speak,
                i.education,
                i.experience,
                i.base_price,
                i.offer_price
                FROM
                "sarter__users" AS u
                JOIN  
                "sarter__boutique_user_map" AS b ON u.id = b.user_id
                JOIN 
              "sarter__boutique_basic_info" AS i ON b.boutique_id = i.id
              WHERE
              u.user_type_id IN (6, 8)
               `;
    //  b.role = 4;

    var result = await db.query(boutiqueInfo);

    return result[0];
  } catch (error) {
    console.error("Error listing Fashion Designers:", error);
    return {
      result: [],
      HasError: true,
      StatusCode: 500,
      Message: "An error occurred while listing Fashion Designers.",
    };
  }
};

// Details of FD
exports.getDesignerDetailsById = async (user_id) => {
  try {
    var designerDetails = await Users.findAll({
      attributes: [
        "id",
        "first_name",
        "last_name",
        "reg_on",
        "role",
        "profile_photo",
      ],
      include: [
        {
          model: FashionDesignerWeeklySchedule,
          as: "weekly_schedule",
          attributes: [
            "week_day",
            "start_time",
            "end_time",
            "check_availability",
          ],
        },
        {
          model: Designer,
          as: "designers",
          attributes: ["user_id", "boutique_id", "role"],
          where: {
            role: 4,
            // first_name: designerName,
            user_id: user_id,
          },
        },
      ],
      raw: true,
    });

    return designerDetails;
  } catch (error) {
    console.error("Error getting designer details:", error);
    return null;
  }
};

exports.getFDDesignerDetails = async (FD_user_id) => {
  try {
    var designerDetails = await Users.findAll({
      attributes: [
        "id",
        "user_type_id",
        "first_name",
        "last_name",
        "reg_on",
        "role",
        "profile_photo",
      ],
      where: {
        // id: FD_user_id,
        user_type_id: {
          [Op.or]: [6, 8],
        },
      },
      include: [
        {
          model: FashionDesignerWeeklySchedule,
          as: "weekly_schedule",
          attributes: [
            "week_day",
            "start_time",
            "end_time",
            "check_availability",
          ],
          where: {
            user_id: FD_user_id,
          },
        },
      ],
      raw: true,
    });

    return designerDetails;
  } catch (error) {
    console.error("Error getting designer details:", error);
    return null;
  }
};

// Service to get designer user details by user_id
exports.getDesignerUserDetailsByUserId = async (user_id) => {
  try {
    var designerUserDetails = await Users.findAll({
      attributes: [
        "id",
        "user_type_id",
        "first_name",
        "last_name",
        "reg_on",
        "role",
        "profile_photo",
      ],
      where: {
        id: user_id,
        user_type_id: { [Op.in]: [6, 8] }, // Filter by user_type_id 6 or 8
      },
      raw: true,
    });

    return designerUserDetails;
  } catch (error) {
    console.error("Error getting designer user details:", error);
    return null;
  }
};

// Service to get designer weekly schedules by user_id
exports.getDesignerWeeklySchedulesByUserId = async (FD_user_id) => {
  try {
    var designerWeeklySchedules = await FashionDesignerWeeklySchedule.findAll({
      attributes: ["week_day", "start_time", "end_time", "check_availability"],
      where: {
        user_id: FD_user_id,
      },
      raw: true,
    });

    return designerWeeklySchedules;
  } catch (error) {
    console.error("Error getting designer weekly schedules:", error);
    return null;
  }
};

exports.getDesignerDetailsByUserIdAndBoutiqueId = async (user_id) => {
  try {
    var designerDetails = await Users.findAll({
      attributes: [
        "id",
        "user_type_id",
        "first_name",
        "last_name",
        "reg_on",
        "role",
        "profile_photo",
      ],
      include: [
        {
          model: FashionDesignerWeeklySchedule,
          as: "weekly_schedule",
          attributes: [
            "week_day",
            "start_time",
            "end_time",
            "check_availability",
          ],
          where: {
            user_id,
          },
        },
      ],
      raw: true,
    });

    // Filter designerDetails to include only those with user_type_id 6 or 8
    designerDetails = designerDetails.filter((detail) =>
      [6, 8].includes(detail.user_type_id)
    );

    return designerDetails;
  } catch (error) {
    console.error("Error getting designer details:", error);
    return null;
  }
};

// add and update address
exports.addAddress = async (address_id, addressData) => {
  try {
    if (address_id) {
      // Update an existing address record in the database
      // var updatedAddress = await UsersAddress.update({ where: { id: address_id }, ...addressData });
      var updatedAddress = await UsersAddress.update(addressData, {
        where: { id: address_id },
      });
      return updatedAddress;
    } else {
      // Create a new address record in the database
      var newAddress = await UsersAddress.create(addressData);
      // console.log(newAddress)
      return newAddress;
    }
  } catch (error) {
    return error;
  }
};

// Define a function to retrieve states
exports.getStateList = async (id) => {
  try {
    var country_id = 1;
    var status = 1;
    var whereClause = {
      country_id: country_id,
      status: status,
    };
    if (id !== undefined) {
      whereClause.id = id;
    }
    var states = await State.findAll({
      attributes: ["id", "name"],
      where: whereClause,
    });
    // Map the result to return an array of JSON objects
    var stateList = states.map((states) => ({
      id: states.id,
      name: states.name,
    }));
    return stateList;
  } catch (error) {
    return error;
  }
};
exports.stateList = async (stateId) => {
  const result = await State.findOne({ where: { id: stateId } });
  return result;
};
exports.cityList = async (cityId) => {
  const result = await City.findOne({ where: { id: cityId } });
  return result;
};
exports.getAddressList = async (query) => {
  const result = await UsersAddress.findAll({ where: query });
  return result;
};

// city list
exports.getCityList = async (state_id) => {
  try {
    var cities = await City.findAll({
      // attributes: ['id', 'name'],
      where: { id_state: state_id },
    });

    // Map the result to return an array of JSON objects
    var cityList = cities.map((city) => ({
      id: city.id,
      name: city.name,
    }));

    return cityList;
  } catch (error) {
    return error;
  }
};

//  search fashion designer by boutique id for location search
exports.getFashionDesignersByBoutiqueId = async (boutiqueId) => {
  try {
    var designers = await Designer.findAll({
      attributes: ["first_name", "last_name", "boutique_id", "role"],
      where: { boutique_id: boutiqueId, role: 4 },
      include: [
        {
          model: FashionDesignerWeeklySchedule,
          as: "designers",
          attributes: [
            "week_day",
            "start_time",
            "end_time",
            "check_availability",
          ],
        },
      ],
    });

    return designers;
  } catch (error) {
    console.error("Error fetching fashion designers:", error);
    return error;
  }
};

// Define the service method
exports.getWeekScheduleByDesigner = async (designerUserId) => {
  try {
    // Custom SQL query to fetch week schedule data for the given designer user ID
    var query = `
      SELECT
        user_id,
        week_day,
        start_time,
        end_time,
        check_availability
      FROM
      sarter__fashion_designer_weekly_schedule
      
    `;

    var rows = await db.query(query, [designerUserId]);

    return rows[0];
  } catch (error) {
    console.error("Error fetching week schedule:", error);
    return error;
  }
};

exports.getDesignersByRole = async () => {
  try {
    var query = `SELECT
     em.user_id,
      em.first_name,
      em.last_name,
      em.boutique_id,
      bi.boutique_name,
      em.role,
      ws.week_day,
      ws.start_time,
      ws.end_time,
      ws.check_availability
      FROM
      sarter__boutique_employee_map em
      INNER JOIN
      sarter__fashion_designer_weekly_schedule ws ON em.user_id = ws.user_id
      INNER JOIn
	    sarter__boutique_basic_info bi ON em.user_id = ws.user_id
      WHERE
      em.role = 4 `;

    var result = await db.query(query);
    return result[0];
  } catch (error) {
    console.error("Error fetching designers:", error);
    return error;
  }
};

// Function to check if a slot is available
exports.isSlotAvailable = async (user_id, startTime, endTime) => {
  try {
    var query = `
      SELECT status
      FROM public.sarter__fashion_designer_appointment
      WHERE user_id = ${user_id}
      AND start_time <= '${endTime}'
      AND end_time > '${startTime}'
    `;

    var result = await db.query(query);

    return result[0];
  } catch (error) {
    console.error(error);
    return error;
  }
};

// book appointment in ORM
exports.slotAvailability = async (user_id, start_time, end_time) => {
  try {
    var query = `
    SELECT status
      FROM public.sarter__fashion_designer_appointment
      WHERE user_id = ${user_id}
      AND start_time <= '${end_time}'
      AND end_time > '${start_time}'
    `;
    var result = await db.query(query);

    if (result[0]) {
      console.log('Query result:', result[0]);
      return result[0].length === 0;
    } else {
      console.error('Unexpected query result:', result);
      return false; 
    }
    } catch (error) {
    return error;
  }
};

exports.bookAppointment = async (appointmentData) => {
  try {
    // Check if the requested slot is available
    var isSlotAvailable = await exports.slotAvailability(
      appointmentData.user_id,
      appointmentData.start_time,
      appointmentData.end_time
    );
    console.log(isSlotAvailable);

    if (isSlotAvailable) {
      // Create a new appointment record using Sequelize
      var bookAppointment = await Appointment.create(appointmentData);

      return bookAppointment;
    }
  } catch (error) {
    console.error(error);
    return error;
  }
};

// book appointment with out ORM
exports.bookAppointmentNew = async (user_id, start_time) => {
  try {
    // Calculate the end time by adding 30 minutes to the start time
    var end_time = moment(start_time, "HH:mm:ss")
      .add(30, "minutes")
      .format("HH:mm:ss");

    // Check if the requested slot is available
    var isSlotAvailable = await exports.isSlotAvailable(
      user_id,
      start_time,
      end_time
    );

    if (isSlotAvailable) {
      var query = `
        INSERT INTO public.sarter__fashion_designer_appointment (
          user_id,
          customer_id,
          start_time,
          end_time,
          appointment_date, // book date
          total_fees,
          transaction_id,
          status,
          created_at, // current data
          updated_at
        ) VALUES (
          ${user_id}, // fd id
          0, // user id for login user
          '${start_time}',
          '${end_time}',
          current_date, -- Assuming you want to use the current date as the appointment date
          0, 
          0, 
          0, 
          current_timestamp, 
          current_timestamp  
        )
        RETURNING *; 
      `;

      var result = await db.query(query);

      return result;
    }
  } catch (error) {
    console.error(error);
    return error;
  }
};

// Get availability slots for a fashion designer
exports.getAvailability = async (user_id) => {
  try {
    var query = `
      SELECT week_day, start_time, end_time, check_availability
      FROM public.sarter__fashion_designer_weekly_schedule
      WHERE user_id = ${user_id} 
    `;

    var result = await db.query(query);
    // console.log("get avalilabliloty : ", result[0]);
    return result[0];
  } catch (error) {
    console.error(error);
    return error;
  }
};

// Add services in FD Details
exports.categoryService = async (user_id) => {
  try {
    var query = `SELECT parent_csd.type AS parent_category_id,
    parent_csd.name AS parent_category_name,
    cat_img.image AS category_image,
    csd.id AS item_id,
    csd.name AS item_name
    FROM public.sarter__boutique_service_dic bsd
    JOIN public.sarter__category_item_dic csd ON bsd.service_id = csd.id
    JOIN public.sarter__category_item_dic parent_csd ON csd.parent_id = parent_csd.id
    JOIN public.sarter__boutique_employee_map bem ON bsd.boutique_id = bem.boutique_id AND bem.role = 4
    JOIN public.sarter__boutique_basic_info bi ON bsd.boutique_id = bi.id
    LEFT JOIN public.sarter__category_item_images cat_img ON parent_csd.id = cat_img.category_id AND parent_csd.type = cat_img.category_type
    WHERE user_id = ${user_id}
    ORDER BY parent_csd.id, csd.id;`;

    var result = await db.query(query);
    // console.log("services : ",result[0]);
    return result[0];
  } catch (error) {
    console.log("error : ", error);
    return error;
  }
};

exports.categoryServiceMenWomenKid = async (user_id) => {
  try {
    var query = `SELECT DISTINCT ON (parent_csd.id, csd.id)
    csd.id,
    bem.user_id,
    csd.parent_id,
    bi."categoryType",
    bsd.boutique_id,
    bsd.boutique_name,
    bsd.boutique_code,
    bsd.service_id,
    bsd.service_name,
    csd.name AS child_category_name,
    csd.type AS child_category_type,
    parent_csd.name AS parent_category_name,
    parent_csd.type AS parent_category_type,
    cat_img.category_id AS cat_category_id,
    cat_img.image AS category_image,
    item_img.category_id AS item_category_id,
    item_img.image AS item_image,
    COALESCE(ipm_correct.id, ipm.id) AS item_price_id,
    COALESCE(ipm_correct.min_amount, ipm.min_amount) AS min_amount,
    COALESCE(ipm_correct.max_amount, ipm.max_amount) AS max_amount
    FROM
      public.sarter__boutique_service_dic bsd
    JOIN
      public.sarter__category_item_dic csd ON bsd.service_id = csd.id
    JOIN
      public.sarter__category_item_dic parent_csd ON csd.parent_id = parent_csd.id
    JOIN
      public.sarter__boutique_employee_map bem ON bsd.boutique_id = bem.boutique_id AND bem.role = 4
    JOIN
      public.sarter__boutique_basic_info bi ON bsd.boutique_id = bi.id
    LEFT JOIN
      public.sarter__category_item_images cat_img ON parent_csd.id = cat_img.category_id AND parent_csd.type = cat_img.category_type
    LEFT JOIN
      public.sarter__category_item_images item_img ON csd.id = item_img.category_id AND csd.type = item_img.category_type
    LEFT JOIN
      public.sarter__item_price_master ipm ON csd.id = ipm.category_item_dic_id AND csd.type = ipm.category_type
    LEFT JOIN
      public.sarter__item_price_master ipm_correct ON csd.id = ipm_correct.category_item_dic_id
      AND csd.type = ipm_correct.category_type
      AND ipm_correct.id = 1
      WHERE user_id = ${user_id}
    ORDER BY parent_csd.id, csd.id, ipm.min_amount;`;

    result = await db.query(query);
    console.log("services : ", result[0]);
    return result[0];
  } catch (error) {
    return error;
  }
};

// service.js

exports.getCategoryAndItem = async (categoryType, boutiqueId) => {
  try {
    const categoryQuery = `
      SELECT
        category.id AS category_id,
        category.name AS category_name,
        images.image AS category_image
      FROM
        sarter__category_item_dic AS category
      LEFT JOIN
        sarter__category_item_images AS images
      ON
        category.id = images.category_id
      WHERE
        category.parent_id = 0
        AND category.status = 1
        AND category.type = ${categoryType}
    `;

    const itemQuery = `
      SELECT
        item.id AS item_id,
        item.name AS item_name,
        price.id AS item_price_id,
        price.min_amount,
        price.max_amount,
        item_images.image AS item_image
      FROM
        sarter__category_item_dic AS item
      LEFT JOIN
        item_price_master AS price
      ON
        item.id = price.category_item_dic_id
      LEFT JOIN
        sarter__category_item_images AS item_images
      ON
        item.id = item_images.category_id
      WHERE
        item.parent_id = 0
        AND item.status = 1
        AND item.type = ${categoryType}
        AND price.boutique_id = ${boutiqueId}
        AND price.category_type = ${categoryType}
    `;

    const categoryResult = await db.query(categoryQuery);
    const itemResult = await db.query(itemQuery);

    return { categoryResult, itemResult };
  } catch (error) {
    console.error("Error in getCategoryAndItemData:", error);
    return error;
  }
};
