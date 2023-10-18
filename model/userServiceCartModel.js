const DataTypes = require("sequelize");
const sequelize = require("../dbConnection");

// Define the model for sarter__users table
var UserServiceCart = sequelize.define(
  "sarter__users_service_cart",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    item_id: {
      type: DataTypes.INTEGER,
    },
    service_id: {
      type: DataTypes.INTEGER,
    },
    order_id: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    type: {
      type: DataTypes.SMALLINT,
    },
    amount: {
      type: DataTypes.NUMERIC,
      defaultValue: 0,
    },
    service_date_time: {
      type: DataTypes.DATE,
    },
    status: {
      type: DataTypes.SMALLINT,
      defaultValue: 0,
    },
    fit_type: {
      type: DataTypes.SMALLINT,
      defaultValue: 0,
    },
    fit_description: {
      type: DataTypes.TEXT,
    },
    tailor_note: {
      type: DataTypes.TEXT
    },
    item_description: {
      type: DataTypes.TEXT,
    },
    repair_location: {
      type: DataTypes.TEXT,
    },
    repair_description: {
      type: DataTypes.TEXT,
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
    modelName: "sarter__users_service_cart",
    tableName: "sarter__users_service_cart",
    timestamps: false,
  }
);

module.exports = UserServiceCart;

