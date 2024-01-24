const { DataTypes } = require("sequelize");
const sequelize = require("../dbConnection");
const User=require('./userModel')
var UsersAddress = sequelize.define(
  "sarter__users_address",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    first_name: {
      type: DataTypes.STRING,
    },
    last_name: {
      type: DataTypes.STRING,
    },
    user_id: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    street: {
      type: DataTypes.TEXT,
    },
    landmark: {
      type: DataTypes.TEXT,
    },
    state: {
      type: DataTypes.INTEGER,
    },
    city: {
      type: DataTypes.INTEGER,
    },
    mobile_number: {
      type: DataTypes.STRING,
    },
    pincode: {
      type: DataTypes.STRING, 
    },
    is_primary: {
      type: DataTypes.SMALLINT,
      defaultValue: 0,
    },
    is_verify: {
      type: DataTypes.SMALLINT,
      defaultValue: 0,
    },
    verify_date: {
      type: DataTypes.DATE, 
    },
    created_at: {
      type: DataTypes.DATE, 
    },
    updated_at: {
      type: DataTypes.DATE, 
    },
  },
  {
    sequelize,
    modelName: "sarter__users_address",
    tableName: "sarter__users_address",
    timestamps: false, 
  }
);
UsersAddress.belongsTo(User,{ foreignKey: "user_id", targetKey: "id" });

module.exports = UsersAddress;
