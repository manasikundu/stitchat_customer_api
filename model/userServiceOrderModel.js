const { DataTypes } = require("sequelize");
const sequelize = require("../dbConnection");

const UserServiceOrder = sequelize.define(
  "sarter__users_service_order",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    name: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
    },
    mobile_number: {
      type: DataTypes.STRING,
    },
    address_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.SMALLINT,
    },
    created_at: {
      type: DataTypes.DATE,
    },
    updated_at: {
      type: DataTypes.DATE,
    },
    order_id: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    modelName: "sarter__users_service_order",
    tableName: "sarter__users_service_order",
    timestamps: false,
  }
);

module.exports = UserServiceOrder;
