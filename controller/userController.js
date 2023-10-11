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
var verifiedOTPs = new Set();


exports.insertMobileNumber = async (req, res) => {
  try {
    var newUserData = req.body;
    var insertError = [];
    if (!newUserData.mobile_number || !/^\+?[1-9]\d{9}$/.test(newUserData.mobile_number.replace(/\D/g, "")) || newUserData.mobile_number.includes(" ")) {
      insertError.push({field: "phone_no",message: "Invalid phone number."});
    }
    if (insertError.length > 0) {
      return res.status(400).send({ HasError: true, StatusCode: 400, errors: insertError })}
    newUserData.device_id = newUserData.device_id || "";
    newUserData.fcm_token = newUserData.fcm_token || "";
    var existingUser = await Users.findOne({where: { mobile_number: newUserData.mobile_number }});
    var method_name = await Service.getCallingMethodName();
    var apiEndpointInput = JSON.stringify(newUserData);
    apiTrack = await Service.trackApi(existingUser ? existingUser.id : null,method_name,apiEndpointInput,newUserData.device_id,newUserData.device_info,req.ip);
    var otp;
    var currentTimestamp = Date.now();
      var currentDate = new Date(currentTimestamp);
      var formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')} ${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}:${String(currentDate.getSeconds()).padStart(2, '0')}`;
    if (existingUser) {
      if (otpCache[existingUser.mobile_number] && Date.now() - otpCache[existingUser.mobile_number].timestamp < OTP_EXPIRY_TIME) {
        otp = otpCache[existingUser.mobile_number].value;
        var updateExistingUserOTP = await Users.update({ otp, otp_timestamp: Date.now(), updated_at: formattedDate},{ where: { mobile_number: existingUser.mobile_number }});
      } else {
        otp = Service.generateOTP();
        otpCache[existingUser.mobile_number] = {value: otp,timestamp: Date.now()};
        var storeNewOTPForExistingUser = await Users.update({ otp, otp_timestamp: Date.now(), updated_at: formattedDate },{ where: { mobile_number: existingUser.mobile_number } });
      }
      return res.status(200).send({result: {otp,isPresent: true},HasError: false,Message: "OTP sent successfully."});
    } else {
      otp = Service.generateOTP();
      newUserData.reg_on = formattedDate;
      newUserData.created_at = formattedDate;
      newUserData.updated_at = formattedDate;
      otpCache[newUserData.mobile_number] = {value: otp,timestamp: Date.now()};
      var newUser = await Service.insertNewUserWithOTP(newUserData,otp, formattedDate)
      if (newUser) {
        return res.status(200).send({result: {otp,isPresent: false},HasError: false,Message:"OTP sent successfully."});
      } else {
        return res.status(500).send({HasError: false,Message: "Error sending OTP."});
      }
    }
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).send({HasError: false,error: "An error occurred while inserting the mobile number."});
  }
}

// verify otp
exports.verifyOTP = async (req, res) => {
  try {
    var mobile_number = req.body.mobile_number
    otp = req.body.otp
    if (verifiedOTPs.has(otp)) {
      return res.status(400).send({HasError: true,StatusCode: 400,Message: "OTP has already been verified for this account."});
    }
    var insertError = [];
    if (!mobile_number || !/^\+?[1-9]\d{9}$/.test(mobile_number.replace(/\D/g, "")) || mobile_number.includes(" ")) {
      insertError.push({field: "phone_no",message: "Invalid phone number."});
    }
    if (insertError.length > 0) {
      return res.status(400).send({ HasError: true, errors: insertError });
    }
    if (!mobile_number || !otp) {
      return res.status(400).send({HasError: true,Message: "Invalid parameter."});
    } else {
      var user = await Users.findOne({ where: { mobile_number } });
      if (user) {
        if (user.otp.toString() == otp.toString()) {
          var timestamp = new Date(user.updated_at).getTime();
          if (Date.now() - timestamp > OTP_EXPIRY_TIME) {
            return res.status(400).send({HasError: true,Message: "OTP has expired. Please request a new OTP."});
          } else {
            const data1 = req.body
            delete data1['mobile_number'];
            // delete data1['otp'];
            verifiedOTPs.add(otp);
            otp = Service.generateOTP();
            otpCache[mobile_number] = { value: otp, timestamp: Date.now() };
            var token = generateAccessToken(mobile_number, otp)
            const result = await Service.updateProfile(user.id, data1)
            var data = result[1][0].toJSON()
            var formattedUser = {
              token: token,
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
            return res.status(200).send({userInfo: formattedUser,HasError: false,StatusCode: 200,Message: "OTP verified successfully!"});
          }
        } else {
          return res.status(400).send({HasError: true,Message: "Invalid OTP. Please enter the correct OTP."})
        }
      } else {
        return res.status(400).send({HasError: true,Message: "User with the provided mobile number not found."});
      }
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).send({HasError: true,Message: "An error occurred while verifying the OTP."});
  }
}


// Seach api track api track
exports.apiTrackList = async (req, res) => {
  try {
    var whereConditions = {};
    if (req.query.method) {
      whereConditions.method_name = {[Op.like]: `%${req.query.method}%`};
    }
    if (req.query.start_date && req.query.end_date) {
      var startDate = new Date(req.query.start_date);
      var endDate = new Date(req.query.end_date);
      if (startDate > endDate) {
        return res.status(400).send({result: null,HasError: true,Message: "End date cannot be smaller than the start date."});
      }
      whereConditions.add_date = {[Op.between]: [req.query.start_date, req.query.end_date]}
      var currentDateTime = new Date();
      if (endDate > currentDateTime) {
        return res.status(400).send({result: null,HasError: true,Message: "End date cannot exceed the current date."});
      }
    } else if (req.query.start_date) {
      var formattedStartDate = `${req.query.start_date} 00:00:00`;
      whereConditions.add_date = {[Op.between]: [formattedStartDate, `${req.query.start_date} 23:59:59`]}
    }
    var searchTerm = req.query.searchTerm;
    var limit = req.query.limit ? parseInt(req.query.limit) : null;
    var offset = req.query.offset ? parseInt(req.query.offset) : null;
    var filters = {where: whereConditions,order: [["id", "ASC"]],limit: limit,offset: offset}
    var method_name = await Service.getCallingMethodName();
    var apiEndpointInput = JSON.stringify(req.query);
    apiTrack = await Service.trackApi(req.query.user_id,method_name,apiEndpointInput,req.query.device_id,req.query.device_info,req.ip);
    var users = await Service.searchCustomer(filters,Service.getCustomerDetails,searchTerm);
    if (!users) {
      users = []; 
    }
    return res.status(200).send({result: users,HasError: false,Message: "Customer search successful."});
  } catch (error) {
    return res.status(500).send({result: null,HasError: true,Message: "An error occurred while retrieving customers.",error: error.message});
  }
};

exports.userProfile = async (req, res) => {
  try {
    const mobile = req.body.mobile_number

    var result1 = await Service.getUserDetails(mobile)
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

      } else {
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
      var logo = user_id + path.extname(req.body.profile_image)
      var logoPath = "employee/" + logo;
      var data = { 'profile_photo': logoPath }
      const params = {
        Bucket: process.env.AWS_BUCKET,
        Key: logoPath,
        Body: buf,
        ContentEncoding: 'base64',
      };
      var finalresult

      s3.upload(params, (err, data) => {
        if (err) {
          console.log(err)
        } else {
          console.log('File Uploaded sucessfully')
        }
      });
      const result = await Service.updateProfile(user_id, data)
      if (result[0] != 0) {
        var photo = s3.getSignedUrl("getObject", {
          Bucket: process.env.AWS_BUCKET,
          Key: logoPath,
          Expires: expirationTime,
        });
        finalresult = photo
        return res.status(200).send({
          message: "Successfully Updated.",
          HasError: false,
          result: finalresult
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