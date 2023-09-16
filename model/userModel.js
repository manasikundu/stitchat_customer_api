const  DataTypes = require("sequelize");
const sequelize = require("../dbConnection");
const Designer = require("../model/FDModel");
const FashionDesignerWeeklySchedule = require("../model/weeklySchleduleModel");
const Boutique = require("./userBoutiqueInfoModel");

// Define the model for sarter__users table
var Users = sequelize.define(
  "sarter__users",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    first_name: {
      type: DataTypes.STRING,
    },
    middle_name: {
      type: DataTypes.STRING,
    },
    last_name: {
      type: DataTypes.STRING,
    },
    mobile_number: {
      type: DataTypes.STRING,
    },
    email_id: {
      type: DataTypes.STRING,
    },
    mob_verify_status: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    email_verify_status: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    reg_on: {
      type: DataTypes.STRING,
    },
    last_login_on: {
      type: DataTypes.STRING,
    },
    user_type_id: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    user_type_name: {
      type: DataTypes.STRING,
    },
    created_by_user_id: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    device_id: {
      type: DataTypes.STRING,
    },
    device_info: {
      type: DataTypes.STRING,
    },
    fcm_token: {
      type: DataTypes.TEXT,
    },
    fire_auth_token: {
      type: DataTypes.TEXT,
    },
    status_id: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    status_name: {
      type: DataTypes.STRING,
    },
    mobile_verify_on: {
      type: DataTypes.STRING,
    },
    email_verify_on: {
      type: DataTypes.STRING,
    },
    prefix: {
      type: DataTypes.STRING,
    },
    otp: {
      type: DataTypes.INTEGER,
    },
    created_at: {
      type: DataTypes.STRING,
    },
    updated_at: {
      type: DataTypes.STRING,
    },
    password: {
      type: DataTypes.STRING,
    },
    parent_id: {
      type: DataTypes.INTEGER,
    },
    role: {
      type: DataTypes.INTEGER,
    },
    profile_photo: {
      type: DataTypes.TEXT,
    },
    id_proof: {
      type: DataTypes.TEXT,
    },
    gift_coin: {
      type: DataTypes.NUMERIC(10, 2),
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: "sarter__users",
    tableName: "sarter__users",
    timestamps: false, 
  }
);


Users.hasMany(Designer, {
  foreignKey: "user_id",
  as: "designers",
});

Users.hasMany(FashionDesignerWeeklySchedule, {
  foreignKey: "user_id",
  as: "weekly_schedule",
});


module.exports = Users;

