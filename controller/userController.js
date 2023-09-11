let crypto = require("crypto");
let FCM = require("fcm-node");
let Service = require("../service/userService");
let Boutique = require("../model/userBoutiqueInfoModel");
let Users = require("../model/userModel");
let axios = require("axios");
let NodeGeocoder = require("node-geocoder");
var geolib = require("geolib");
let { Op } = require("sequelize");
let moment = require("moment");
let jwt = require("jsonwebtoken");
let { generateAccessToken, auth } = require("../jwt");

var OTP_EXPIRY_TIME = 3 * 60 * 1000; // 3 minutes in milliseconds
let otpCache = {}; // In-memory cache to store OTP and its timestamp
let otpStats = {}; // In-memory cache to store OTP generation stats


exports.insertMobileNumber = async (req, res) => {
  try {
    var newUserData = req.body;
    console.log(newUserData);
    var insertError = [];

    if (
      !newUserData.mobile_number ||
      !/^\+?[1-9]\d{9}$/.test(newUserData.mobile_number.replace(/\D/g, ""))
    ) {
      insertError.push({
        field: "phone_no",
        message:
          "Invalid phone number. Phone number must be a 10-digit number (with or without leading zeroes) optionally preceded by a + sign.",
      });
    }

    // Check if there are any validation errors
    if (insertError.length > 0) {
      return res
        .status(400)
        .send({ HasError: true, StatusCode: 400, errors: insertError });
    }

    // Check if device_id and fcm_token are provided, if not set them to empty strings
    newUserData.device_id = newUserData.device_id || "";
    newUserData.fcm_token = newUserData.fcm_token || "";

    var existingUser = await Users.findOne({
      where: { mobile_number: newUserData.mobile_number },
    });

    // var method_name = 'insertMobileNumber'
    var method_name = await Service.getCallingMethodName();
    console.log(method_name);
    var apiEndpointInput = JSON.stringify(newUserData);

    // Track API hit
    apiTrack = await Service.trackApi(
      existingUser ? existingUser.id : null,
      method_name,
      apiEndpointInput,
      newUserData.device_id,
      newUserData.device_info,
      req.ip
    );

    var otp; 

    if (existingUser) {
      // Mobile number exists, check if an OTP is already generated and valid
      if (
        otpCache[existingUser.mobile_number] &&
        Date.now() - otpCache[existingUser.mobile_number].timestamp <
          OTP_EXPIRY_TIME
      ) {
        // If the OTP is still valid, return the existing OTP
        otp = otpCache[existingUser.mobile_number].value;

        // Update the OTP in the database for the existing user
        var updateExistingUserOTP = await Users.update(
          { otp, otp_timestamp: Date.now() },
          { where: { mobile_number: existingUser.mobile_number } }
        );
      } else {
        // If the OTP has expired or not yet generated, generate a new one
        otp = Service.generateOTP();
        otpCache[existingUser.mobile_number] = {
          value: otp,
          timestamp: Date.now(),
        };

        // Store the new OTP in the database for the existing user
        var storeNewOTPForExistingUser = await Users.update(
          { otp, otp_timestamp: Date.now() },
          { where: { mobile_number: existingUser.mobile_number } }
        );
      }

      return res.status(200).send({
        result: {
          otp,
          isPresent: true,
        },
        HasError: false,
        StatusCode: 200,
        Message: "Mobile number already exists. OTP sent successfully.",
      });
    } else {
      // Generate OTP for the newly inserted mobile number and send it to the user's device using FCM
      otp = Service.generateOTP();

      // Store the OTP in the otpCache
      otpCache[newUserData.mobile_number] = {
        value: otp,
        timestamp: Date.now(),
      };
      
      var newUser = await Service.insertNewUserWithOTP(newUserData,
        otp,)
      if (newUser) {
        return res.status(201).send({
          result: {
            otp,
            isPresent: false,
          },
          HasError: false,
          StatusCode: 200,
          Message:
            "Mobile number inserted successfully! OTP sent successfully.",
        });
      } else {
        // If there was an issue sending the OTP, handle it accordingly
        return res.status(500).send({
          HasError: false,
          StatusCode: 500,
          error: "Error sending OTP.",
        });
      }
    }
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).send({
      HasError: false,
      StatusCode: 500,
      error: "An error occurred while inserting the mobile number.",
    });
  }
};

// verify otp
exports.verifyOTP = async (req, res) => {
  try {
    var { mobile_number, otp } = req.body;

    if (!mobile_number || !otp) {
      return res.status(400).send({
        HasError: true,
        StatusCode: 400,
        Message: "Invalid parameter.",
      });
    } else {
      // Retrieve the user by mobile number from the database
      var user = await Users.findOne({ where: { mobile_number } });
      
      if (!user) {
        return res.status(400).send({
          HasError: true,
          StatusCode: 400,
          Message: "User with the provided mobile number not found.",
        });
        } else if (user.otp.toString() !== otp.toString()) {
        return res.status(400).send({
          HasError: true,
          StatusCode: 400,
          Message: "Invalid OTP. Please enter the correct OTP.",
        });
      } else if (Date.now() - user.otp_timestamp > OTP_EXPIRY_TIME) {
        return res.status(400).send({
          HasError: true,
          StatusCode: 400,
          Message: "OTP has expired. Please request a new OTP.",
        });
      } else {
        // OTP is valid, mobile number is verified
        var formattedUser = {
          user_id: user.id,
          first_name: user.first_name || "",
          middle_name: user.middle_name || "",
          last_name: user.last_name || "",
          mobile_number: user.mobile_number || "",
          email_id: user.email_id || "",
          mob_verify_status: user.mob_verify_status,
          email_verify_status: user.email_verify_status,
          reg_on: user.reg_on ? moment(user.reg_on).format("DD-MM-YYYY hh:mm A") : "",
          last_login_on: user.last_login_on ? moment(user.last_login_on).format("DD-MM-YYYY hh:mm A") : "",
          user_type_id: user.user_type_id,
          user_type_name: user.user_type_name || "",
          created_by_user_id: user.created_by_user_id,
          device_id: user.device_id || "",
          device_info: user.device_info || "",
          status_id: user.status_id,
          status_name: user.status_name || "",
          mobile_verify_on: user.mobile_verify_on || "",
          email_verify_on: user.email_verify_on || "",
          prefix: user.prefix || "",
          otp: user.otp,
          add_date: user.created_at ? moment(user.created_at).format("DD-MM-YYYY hh:mm A") : "",
          parent_id: user.parent_id,
          role: user.role || "",
          profile_photo: user.profile_photo || "",
          id_proof: user.id_proof || "",
          gift_coin: user.gift_coin || "0.00",
        };
        // OTP is valid, mobile number is verified
        return res.status(200).send({
          userInfo: formattedUser,
          HasError: false,
          StatusCode: 200,
          Message: "OTP verified successfully!",
        });
      }
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).send({
      HasError: true,
      StatusCode: 500,
      Message: "An error occurred while verifying the OTP.",
    });
  }
};

// Seach api track api track
exports.apiTrackList = async (req, res) => {
  try {
    let whereConditions = {};

    if (req.query.method) {
      whereConditions.method_name = {
        [Op.like]: `%${req.query.method}%`,
      };
    }

    if (req.query.start_date && req.query.end_date) {
      var startDate = new Date(req.query.start_date);
      var endDate = new Date(req.query.end_date);

      if (startDate > endDate) {
        return res.status(400).send({
          result: null,
          HasError: true,
          StatusCode: 400,
          Message: "End date cannot be smaller than the start date.",
        });
      }

      whereConditions.add_date = {
        [Op.between]: [req.query.start_date, req.query.end_date],
      };

      var currentDateTime = new Date();
      if (endDate > currentDateTime) {
        return res.status(400).send({
          result: null,
          HasError: true,
          StatusCode: 400,
          Message: "End date cannot exceed the current date.",
        });
      }
    } else if (req.query.start_date) {
      // Modify the input format to match your timestamp format (YYYY-MM-DD HH:mm:ss)
      var formattedStartDate = `${req.query.start_date} 00:00:00`;
      whereConditions.add_date = {
        [Op.between]: [formattedStartDate, `${req.query.start_date} 23:59:59`],
      };
    }

    var searchTerm = req.query.searchTerm;
    var limit = req.query.limit ? parseInt(req.query.limit) : null;
    var offset = req.query.offset ? parseInt(req.query.offset) : null;

    var filters = {
      where: whereConditions,
      order: [["id", "ASC"]],
      limit: limit,
      offset: offset,
    };

    var method_name = await Service.getCallingMethodName();
    console.log(method_name);
    var apiEndpointInput = JSON.stringify(req.query);

    // Track API hit
    apiTrack = await Service.trackApi(
      req.query.user_id,
      method_name,
      apiEndpointInput,
      req.query.device_id,
      req.query.device_info,
      req.ip
    );

    var users = await Service.searchCustomer(
      filters,
      Service.getCustomerDetails,
      searchTerm
    );

    if (!users) {
      users = []; // Return an empty array if no data is found
    }

    return res.status(200).send({
      result: users,
      HasError: false,
      StatusCode: 200,
      Message: "Customer search successful.",
    });
  } catch (error) {
    return res.status(500).send({
      result: null,
      HasError: true,
      StatusCode: 500,
      Message: "An error occurred while retrieving customer(s).",
      error: error.message,
    });
  }
};

// login
exports.logIn = async (req, res) => {
  try {
    var mobileNumber = req.body.mobile_number;
    var fcmToken = req.body.fcm_token;
    var secretKey = req.body.secret_key;
    var device_id = req.body.device_id;
    var device_info = req.body.device_info;
    var otp = req.body.otp;

    // Check if mobile_number is valid
    if (!mobileNumber || !/^[1-9]\d{9}$/.test(mobileNumber)) {
      return res.status(400).send({
        HasError: true,
        StatusCode: 400,
        Message: "Invalid mobile number",
      });
    }

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
    var users = await Service.checkMobile(mobileNumber);
    if (users) {
      // Generate access token using the provided secretKey
      var token = generateAccessToken(mobileNumber, secretKey);

      if (token) {
        var basicInfo = {
          id: users.id,
          prefix: users.prefix,
          first_name: users.first_name,
          last_name: users.last_name,
          registered_on: moment(users.reg_on).format("DD-MM-YYYY hh:mm A"),
          mobille_number: users.mobile_number,
          email: users.email_id,
          device_id: users.device_id,
          device_info: users.device_info,
          fcm_token: users.fcm_token,
          status_id: users.status_id,
          status: users.status_name,
          profile_photo: users.profile_photo,
          role: users.role,
        };
        // Prepare the response data with optional fields
        var responseData = {
          HasError: false,
          StatusCode: 200,
          success: true,
          message: "Login successful",
          token: token,
          userInfo: basicInfo,
        };

        // Add optional fields if provided
        if (device_id) {
          responseData.device_id = device_id;
        }

        if (device_info) {
          responseData.device_info = device_info;
        }

        if (fcmToken) {
          responseData.fcm_token = fcmToken;
        }

        if (otp) {
          responseData.otp = otp;
        }

        return res.status(200).send(responseData);
      } else {
        return res.status(500).send({
          HasError: true,
          StatusCode: 500,
          message: "Failed to generate token",
        });
      }
    }
    
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      HasError: true,
      StatusCode: 500,
      message: "An error occurred while logging in",
    });
  }
};

// verifyToken
exports.verifyToken = (req, res, next) => {
  try {
    var b_token = req.headers.authorization;
    if (!b_token) {
      return res.status(401).send({
        HasError: true,
        StatusCode: 401,
        message: "Token not provided",
      });
    } else {
      var token = b_token.replace(/^Bearer\s+/, "");
      // Verify token
      var decoded = jwt.verify(token, secretKey);
      
      // Check if the decoded mobile_number matches the request mobile_number
      if (decoded.mobile_number !== req.body.mobile_number) {
        return res.status(401).send({
          HasError: true,
          StatusCode: 401,
          message: "Invalid token for this user",
        });
      } else {
        // Token is valid
        req.user = decoded; // Store the user info in the request
        return res.status(200).send({
          HasError: false,
          StatusCode: 200,
          message: "Token verified!",
          user: req.user,
        });
      }
    }
    
  } catch (error) {
    console.log(error);
    return res.status(401).send({
      HasError: true,
      StatusCode: 401,
      message: "Failed to authenticate token!",
    });
  }
};

