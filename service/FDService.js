const db = require("../dbConnection");
const Designer = require("../model/FDModel");
const { Op } = require("sequelize");
const crypto = require("crypto");
const Users = require("../model/userModel");
const DesignerDetails = require("../model/FDModel");
const FashionDesignerWeeklySchedule = require("../model/weeklySchleduleModel");
const UsersAddress = require("../model/userAddressModel");
const Boutique = require("../model/userBoutiqueInfoModel");
const { query } = require("express");
const moment = require("moment");
const State = require("../model/stateModel");
const City = require("../model/cityModel");
const Country = require("../model/countryModel");
const Appointment = require("../model/appointmentModel");

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

exports.getFashionDesigners = async (filters) => {
  try {
    const fashionDesigners = await Users.findAll({
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
        ...filters
      },
      order: [["user_id", "DESC"]],
      raw: true,
    });
    return fashionDesigners;
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

exports.getFashionDesignerSchedules = async () => {
  try {
    const fashionDesignerSchedules = await FashionDesignerWeeklySchedule.findAll({
      attributes: [
        "user_id",
        "week_day",
        "start_time",
        "end_time",
        "check_availability",
      ],
      raw: true,
    });

    return fashionDesignerSchedules;
  } catch (error) {
    console.error("Error listing Fashion Designer Schedules:", error);
    return {
      result: [],
      HasError: true,
      StatusCode: 500,
      Message: "An error occurred while listing Fashion Designer Schedules.",
    };
  }
};


exports.getBoutiqueInfo = async (filters) => {
  try {
    var boutiqueInfo = `SELECT
                u.id,
                i.id as boutique_id,
                i.boutique_name,
                i.address,
	              i.area,
                i.city,
                i.coutry_state,
                i.location_lat,
                i.location_lng,
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
              u.user_type_id IN (6, 8)`
    if (filters) {
      boutiqueInfo += filters;
    }
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
    return error;
  }
};

// Service function to get designer details from the "sarter__users" table
exports.getDesignerDetailsByUserId = async (user_id) => {
  try {
    const designerDetails = await Users.findAll({
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
        user_type_id: [6, 8], 
      },
      raw: true,
    });

    return designerDetails;
  } catch (error) {
    console.error("Error getting designer details:", error);
    return error;
  }
};

// Service function to get the weekly schedule for a user
exports.getWeeklyScheduleByUserId = async (user_id) => {
  try {
    const weeklySchedule = await FashionDesignerWeeklySchedule.findAll({
      attributes: [
        "week_day",
        "start_time",
        "end_time",
        "check_availability",
      ],
      where: {
        user_id,
      },
      raw: true,
    });

    return weeklySchedule;
  } catch (error) {
    console.error("Error getting weekly schedule:", error);
    return error;
  }
};

// add and update address
exports.addAddress = async (address_id, addressData) => {
  try {
    if (address_id) {
      var updatedAddress = await UsersAddress.update(addressData, {
        where: { id: address_id },
      });
      return updatedAddress;
    } else {
      var newAddress = await UsersAddress.create(addressData);
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
  const result = await UsersAddress.findAll({ where: query, order: [["id", "desc"]] });
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
    var query = `
      SELECT
        user_id,
        week_day,
        start_time,
        end_time,
        check_availability
      FROM
      sarter__fashion_designer_weekly_schedule`
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
      SELECT *
      FROM public.sarter__fashion_designer_appointment
      WHERE user_id = ${user_id}
      AND start_time <= '${endTime}'
      AND end_time > '${startTime}'`
    var result = await db.query(query);
    return result[0];
  } catch (error) {
    console.error(error);
    return error;
  }
};

// book appointment 
exports.slotAvailability = async (user_id, start_time, end_time, appointment_date) => {
  try {
    var query = `
    SELECT status
      FROM public.sarter__fashion_designer_appointment
      WHERE user_id = ${user_id}
      AND appointment_date = '${appointment_date}'
      AND start_time <= '${end_time}'
      AND end_time > '${start_time}'
    `;
    var result = await db.query(query);
    if (result[0]) {
      return result[0].length === 0;
    } else {
      console.error('Unexpected query result:', result);
    }
  } catch (error) {
    return error;
  }
};


exports.bookedSlots = async (user_id) => {
  try {
    var query = `SELECT *
      FROM public.sarter__fashion_designer_appointment
      WHERE user_id = ${user_id}`
    var result = await db.query(query);
    return result[0]
  } catch (error) {
    return error;
  }
};


exports.bookAppointment = async (appointmentData) => {
  try {
    var isSlotAvailable = await exports.slotAvailability(
      appointmentData.user_id,
      appointmentData.appointment_date,
      appointmentData.start_time,
      appointmentData.end_time
    )
    if (isSlotAvailable) {
      var currentDate = new Date();
      var formattedDate = currentDate.toISOString().slice(0, 19).replace("T", " ");
      appointmentData.created_at = formattedDate;
      var bookAppointment = await Appointment.create(appointmentData);
      var appointment_code =
        "STAFA" + appointmentData.customer_id + appointmentData.user_id + bookAppointment.id;
      await bookAppointment.update({ appointment_code });
      return bookAppointment;
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
    return result[0];
  } catch (error) {
    console.log("error : ", error);
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
exports.appointmentList = async (userId) => {
  const result = await Appointment.findAll({ where: { customer_id: userId } })
  return result
}

exports.cancelAppointment = async (appointmentId,status) => {
  const result = await Appointment.update({status:status},{ where: { id: appointmentId } })
  return result             
}
exports.appointmentDetails = async (appointmentId) => {
  const result = await Appointment.findOne({ where: { id: appointmentId } })
  return result
}
exports.getAddressByUserId = async (user_id) => {
  const result = await UsersAddress.findOne({ where: { user_id: user_id } })
  return result
}

exports.deleteAddress = async (user_id, address_id) => {
  const result = await UsersAddress.destroy({ where: { [Op.and]: [{ user_id: user_id }, { id: address_id }] } })
  return result
}