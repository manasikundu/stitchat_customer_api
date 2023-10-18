const DataTypes = require("sequelize");
const sequelize = require("../dbConnection");

var UserServiceOrder = sequelize.define(
  "sarter__users_service_order",
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
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    address_details: {
      type: DataTypes.TEXT,
    },
    address_id: {
      type: DataTypes.INTEGER,
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
    modelName: "sarter__users_service_order",
    tableName: "sarter__users_service_order",
    timestamps: false,
  }
)

module.exports = UserServiceOrder;
