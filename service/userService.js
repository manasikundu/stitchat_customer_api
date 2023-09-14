let db = require("../dbConnection");
let bcrypt = require("bcrypt");
let Users = require("../model/userModel");
let Boutique = require("../model/userBoutiqueInfoModel");
var { Op } = require("sequelize");
let FCM = require("fcm-node");
let crypto = require("crypto");
let ApiTrack = require("../model/apiTrackModel");
const { Mobile } = require("aws-sdk");
const contactUs=require('../model/contactUsModel')

exports.generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Service function to insert a new employee
exports.insertNewUserWithOTP = async (userData, otp) => {
  try {
    // Add the OTP to the userData object
    userData.otp = otp;

    // Create a new user with the provided data
    var newUser = await Users.create(userData);

    return newUser;
  } catch (error) {
    console.error('Error inserting new user with OTP:', error);
    return error
  }
};

// Service function to insert a new employee with OTP storage
exports.insertMobileNumber = async (userData, otp) => {
  try {
    // Create a new user with the provided data
    var result = await Users.create(userData);

    // Store the OTP for the newly inserted mobile number or update it for an existing user
    await Users.upsert(
      {
        mobile_number: userData.mobile_number,
        otp: otp,
        otp_timestamp: Date.now(),
      },
      { where: { mobile_number: userData.mobile_number } }
    );

    return result;
  } catch (error) {
    console.error("Error inserting mobile number:", error);
    return "An error occurred while inserting the employee.";
  }
};


// Track api
exports.trackApi = async (
  user_id,
  method_name,
  api_endpoint_input,
  device_id,
  device_info
) => {
  try {
    var apiTrack = ApiTrack.create({
      user_id,
      method_name,
      api_endpoint_input,
      device_id,
      device_info,
      add_date: new Date().toISOString().slice(0, 19).replace("T", " "),
    });
    return apiTrack;
  } catch (error) {
    console.error("Error tracking API:", error);
    return "Error tracking API hit";
  }
};

// method name for api track
exports.getCallingMethodName = async () => {
  try {
    throw new Error();
  } catch (e) {
    var stackLines = e.stack.split("\n");
    // Stack line format is "at functionName (file:line:column)"
    var callerLine = stackLines[2];
    var methodName = callerLine.match(/at (\S+) \(/)[1];
    var parts = methodName.split(".");
    console.log(parts);
    return parts[parts.length - 1];
  }
};

// Seach Customer api track
exports.searchCustomer = async (filters, getCustomerDetails) => {
  try {
    var customerData = await ApiTrack.findAll(filters);
    var userIds = customerData.map((customer) => customer.user_id);
    var userDetails = await getCustomerDetails(userIds);

    var result = customerData.map((customer) => ({
      ...customer.toJSON(),
      ...userDetails[customer.user_id],
    }));

    return result;
  } catch (error) {
    console.log(error);
    throw new Error("An error occurred while retrieving customer details.");
  }
};

// seach name and mobile number
exports.getCustomerDetails = async (userIds, searchTerm) => {
  var userDetails = {};

  for (var userId of userIds) {
    var userData = await Users.findOne({
      where: {
        id: userId,
        [Op.or]: [
          {
            [Op.and]: [
              { first_name: { [Op.like]: `%${searchTerm}%` } },
              { first_name: { [Op.ne]: null } },
            ],
          },
          {
            [Op.and]: [
              { middle_name: { [Op.like]: `%${searchTerm}%` } },
              { middle_name: { [Op.ne]: null } },
            ],
          },
          {
            [Op.and]: [
              { last_name: { [Op.like]: `%${searchTerm}%` } },
              { last_name: { [Op.ne]: null } },
            ],
          },
          {
            mobile_number: { [Op.like]: `%${searchTerm}%` },
          },
        ],
      },
      attributes: ["first_name", "middle_name", "last_name", "mobile_number"],
    });

    if (userData) {
      userDetails[userId] = {
        name: [userData.first_name, userData.middle_name, userData.last_name]
          .filter(Boolean)
          .join(" "),
        mobile_number: userData.mobile_number,
      };
    }
  }

  return userDetails;
};

// login
exports.checkMobile = async (
  mobile_number,
  fcm_token,
  device_id,
  device_info
) => {
  try {
    var users = await Users.findOne({ where: { mobile_number } });
    return users;
  } catch (error) {
    return error;
  }
};


exports.getUserDetails = async (mobile_number) => {
  const result = await Users.findOne({ where: { mobile_number: mobile_number } })
  return result
}
exports.boutiqueMap = async (user_id) => {
  const result = await db.query(`select * from sarter__boutique_customer_map where user_id=${user_id}`)
  return result[0][0]
  
}
exports.updateProfile = async (id, data) => {
  const result = await Users.update(data, { where: { id: id } })
  return result
}
exports.contactUs = async (data) => {
  const result = await contactUs.create(data,{returning:true})
  return result.toJSON()
}