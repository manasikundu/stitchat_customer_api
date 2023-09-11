var DataTypes = require("sequelize");
var sequelize = require("../dbConnection");

var Appointment = sequelize.define(
  "sarter__fashion_designer_appointment",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Fashion designer id from user table',
    },
    customer_id: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    appointment_code: {
      type: DataTypes.STRING(100),
      collate: 'pg_catalog."default"',
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    appointment_date: {
      type: DataTypes.DATEONLY,
    },
    total_fees: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    status: {
      type: DataTypes.SMALLINT,
      defaultValue: 0,
      comment: '0 - Pending, 1 - Approve, 2 - Reject/Cancel, 3 - Completed',
    },
    created_at: {
      type: DataTypes.STRING(255),
      collate: 'pg_catalog."default"',
    },
    updated_at: {
      type: DataTypes.STRING(255),
      collate: 'pg_catalog."default"',
    },
    transaction_id: {
      type: DataTypes.STRING(255), 
      collate: 'pg_catalog."default"',
    },
    address_id: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: "sarter__fashion_designer_appointment",
    tableName: "sarter__fashion_designer_appointment",
    timestamps: false,
  }
);

module.exports = Appointment;
