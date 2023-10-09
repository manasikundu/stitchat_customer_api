const crypto = require("crypto");
const FCM = require("fcm-node");
const Service = require("../service/userService");
const Boutique = require("../model/userBoutiqueInfoModel");
const Users = require("../model/userModel");
const axios = require("axios");
const NodeGeocoder = require("node-geocoder");
const geolib = require("geolib");
const { Op } = require("sequelize");
const moment = require("moment");
const jwt = require("jsonwebtoken");
const { generateAccessToken, auth } = require("../jwt");
const fs = require('fs')
const s3 = require("../config/s3Config");
const path = require('path');
var expirationTime = 600;

var OTP_EXPIRY_TIME = 3 * 60 * 1000; // 3 minutes in milliseconds
var otpCache = {}; // In-memory cache to store OTP and its timestamp
var otpStats = {}; // In-memory cache to store OTP generation stats


exports.insertMobileNumber = async (req, res) => {
  try {
    var newUserData = req.body;
    var insertError = [];

    if (!newUserData.mobile_number || !/^\+?[1-9]\d{9}$/.test(newUserData.mobile_number.replace(/\D/g, "")) || newUserData.mobile_number.includes(" ")) {
      insertError.push({
        field: "phone_no",
        message: "Invalid phone number."
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
        Message: "OTP sent successfully.",
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
            "OTP sent successfully.",
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
    // var { mobile_number, otp } = req.body;
    var mobile_number = req.body.mobile_number
    otp = req.body.otp
    var insertError = [];
    if (!mobile_number || !/^\+?[1-9]\d{9}$/.test(mobile_number.replace(/\D/g, "")) || mobile_number.includes(" ")) {
      insertError.push({
        field: "phone_no",
        message: "Invalid phone number."
      });
    }
    
    // Check if there are any validation errors
    if (insertError.length > 0) {
      return res
        .status(400)
        .send({ HasError: true, StatusCode: 400, errors: insertError });
    }
    if (!mobile_number || !otp) {
      return res.status(400).send({
        HasError: true,
        StatusCode: 400,
        Message: "Invalid parameter.",
      });
    } else {
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
        const data1 = req.body
        delete data1['mobile_number'];
        // delete data1['otp'];

        const result = await Service.updateProfile(user.id, data1)
        var data = result[1][0].toJSON()
        var formattedUser = {
          user_id: data.id,
          first_name: data.first_name ? data.first_name : "",
          middle_name: data.middle_name ? data.middle_name : "",
          last_name: data.last_name ? data.last_name : "",
          mobile_number: data.mobile_number ? data.mobile_number : "",
          email_id: data.email_id ? data.email_id : "",
          mob_verify_status: data.mob_verify_status ? data.mob_verify_status : 0,
          email_verify_status: data.email_verify_status ? data.email_verify_status : 0,
          reg_on: data.reg_on ? moment(data.reg_on).format("DD-MM-YYYY hh:mm A") : "",
          last_login_on: data.last_login_on ? moment(data.last_login_on).format("DD-MM-YYYY hh:mm A") : "",
          user_type_id: data.user_type_id ? data.user_type_id : 0,
          user_type_name: data.user_type_name || "",
          created_by_user_id: data.created_by_user_id ? data.created_by_user_id : 0,
          device_id: data.device_id ? data.device_id : "",
          device_info: data.device_info ? data.device_info : "",
          status_id: data.status_id ? data.status_id : 0,
          status_name: data.status_name ? data.status_name : "",
          mobile_verify_on: data.mobile_verify_on ? data.mobile_verify_on : "",
          email_verify_on: data.email_verify_on ? data.email_verify_on : "",
          prefix: data.prefix ? data.prefix : "",
          otp: data.otp,
          add_date: data.created_at ? moment(data.created_at).format("DD-MM-YYYY hh:mm A") : "",
          parent_id: data.parent_id,
          role: data.role ? data.role : "",
          profile_photo: data.profile_photo ? data.profile_photo : "",
          id_proof: data.id_proof ? data.id_proof : "",
          gift_coin: data.gift_coin ? data.gift_coin : "0.00",
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

exports.userProfile = async (req, res) => {
  try {
    const mobile = req.body.mobile_number

    const result1 = await Service.getUserDetails(mobile)
    if (result1) {
      const customerInfo = {}
      customerInfo.id = result1.id
      customerInfo.first_name = result1.first_name ? result1.first_name : ''
      customerInfo.last_name = result1.last_name ? result1.last_name : ''
      customerInfo.mobile_number = result1.mobile_number ? result1.mobile_number : ''
      customerInfo.email_id = result1.email_id ? result1.email_id : ''
      customerInfo.user_type_id = result1.user_type_id ? result1.user_type_id : 0
      customerInfo.user_type_name = result1.user_type_name ? result1.user_type_name : ''
      customerInfo.created_by_user_id = result1.created_by_user_id ? result1.created_by_user_id : 0
      customerInfo.device_id = result1.device_id ? result1.device_id : ''
      customerInfo.device_info = result1.device_info ? result1.device_info : ''
      customerInfo.fcm_token = result1.fcm_token ? result1.fcm_token : ''
      customerInfo.fire_auth_token = result1.fire_auth_token ? result1.fire_auth_token : ''
      customerInfo.status_id = result1.status_id ? result1.status_id : 0
      customerInfo.status_name = result1.status_name ? result1.status_name : ''
      customerInfo.prefix = result1.prefix ? result1.prefix : ''
      customerInfo.parent_id = result1.parent_id ? result1.parent_id : 0
      customerInfo.role = result1.role ? result1.role : 0
      if (result1.profile_photo) {
        console.log(result1.profile_photo)
        var photo = s3.getSignedUrl("getObject", {
          Bucket: process.env.AWS_BUCKET,
          Key: result1.profile_photo,
          Expires: expirationTime,
        });
        console.log(photo)
        customerInfo.profile_photo = photo

      }else{
        customerInfo.profile_photo = ''
      }
      customerInfo.id_proof = result1.id_proof ? result1.id_proof : ''
      customerInfo.gift_coin = result1.gift_coin ? result1.gift_coin : 0

      const result2 = await Service.boutiqueMap(result1.id)
      if (result2) {
        const result3 = await Boutique.findOne({ where: { id: result2.boutique_id } })

        const boutiqueInfo = {}
        boutiqueInfo.id = result3.id
        boutiqueInfo.boutique_name = result3.boutique_name ? result3.boutique_name : ''
        boutiqueInfo.boutique_code = result3.boutique_code ? result3.boutique_code : ''
        boutiqueInfo.boutique_logo = result3.boutique_logo ? result3.boutique_logo : ''
        boutiqueInfo.contact_number = result3.contact_number ? result3.contact_number : ''
        boutiqueInfo.coutry_state = result3.coutry_state ? result3.coutry_state : ''

        res.status(200).send({ HasError: false, customerInfo: customerInfo, boutiqueInfo: boutiqueInfo })
      } else {
        res.status(200).send({ HasError: false, customerInfo: customerInfo, boutiqueInfo: {} })
      }
    } else {
      res.status(200).send({ HasError: true, message: "Invalid User" })
    }
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: "Something went wrong.", HasError: true })
  }
}

exports.updateProfile = async (req, res) => {
  try {
    const id = req.body.id
    const data = req.body
    delete data['id'];
    const result = await Service.updateProfile(id, data)
    if (result[0] != 0) {
      return res.status(200).send({
        message: "Successfully Updated.",
        HasError: false
      })
    } else {
      return res.status(500).send({
        message: "failed to update",
        HasError: true
      })
    }

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: "Something went wrong.", HasError: true })
  }
}

exports.aboutUs = async (req, res) => {
  try {
    const data = fs.readFileSync('aboutUs.txt', 'utf-8')
    return res.status(200).send({
      message: "Successfully Proceed data.",
      HasError: false,
      result: data
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: "Something went wrong.", HasError: true })
  }
}

exports.contactInfo = async (req, res) => {
  try {
    const data = fs.readFileSync('contactInfo.json', 'utf-8')
    return res.status(200).send({
      message: "Successfully Proceed data.",
      HasError: false,
      result: JSON.parse(data)
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: "Something went wrong.", HasError: true })
  }
}

exports.contactUs = async (req, res) => {
  try {
    const result = await Service.contactUs(req.body)
    return res.status(200).send({
      message: "Successfully Proceed data.",
      HasError: false,
      result: result
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: "Something went wrong.", HasError: true })
  }
}

exports.privacyPolicy = async (req, res) => {
  try {
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
    const data = fs.readFileSync('privacyPolicy.txt', 'utf-8')
    const sections = data.split(/\n(?=\w)/).map(section => section.trim());
    const policySections = []
    for (var i = 0; i < sections.length; i += 2) {
      const heading = sections[i];
      const text = sections[i + 1] || ''
      policySections.push({ heading, text });
    }
    return res.status(200).send({
      message: "Successfully Proceed data.",
      HasError: false,
      result: policySections
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: "Something went wrong.", HasError: true })
  }
}

exports.profilePicUpload = async (req, res) => {
  try {
    var user_id = req.body.user_id
    var buf = Buffer.from(req.body.profile_image.replace(/^data:image\/\w+;base64,/, ""), 'base64')
    if (req.body.profile_image) {
      console.log(path.extname(req.body.profile_image))
      var logo = user_id + path.extname(req.body.profile_image)
      console.log(logo)
      var logoPath = "employee/" + logo;
      var data = { 'profile_photo': logoPath }
      const params = {
        Bucket: process.env.AWS_BUCKET,
        Key: logoPath,
        Body: buf,
        ContentEncoding: 'base64',
      };
      s3.upload(params, (err, data) => {
        if (err) {
          console.log(err)
        } else {
          console.log('File Uploaded sucessfully')
        }
      });
      const result = await Service.updateProfile(user_id, data)
      if (result[0] != 0) {
        return res.status(200).send({
          message: "Successfully Updated.",
          HasError: false
        })
      } else {
        return res.status(500).send({
          message: "failed to update",
          HasError: true
        })
      }
    }

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: "Something went wrong.", HasError: true })
  }
}