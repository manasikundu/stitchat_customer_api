const  DataTypes = require("sequelize");
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
    category_id: {
      type: DataTypes.INTEGER,
    },
    sub_category_id: {
      type: DataTypes.INTEGER,
    },
    order_id: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    alternataion_type: {
        type: DataTypes.STRING,
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

