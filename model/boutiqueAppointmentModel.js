const DataTypes = require("sequelize");
const sequelize = require("../dbConnection");

var BoutiqueAppointment = sequelize.define(
  "sarter__boutique_appointment",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    boutique_id: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    address_id: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    appointment_code: {
      type: DataTypes.STRING(255),
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    appointment_date: {
      type: DataTypes.DATE,
    },
    total_fees: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
    },
    status: {
      type: DataTypes.SMALLINT,
      comment: '0 - Pending, 1 - Approve, 2 - Reject/Cancel, 3 - Completed',
    },
    transaction_id: {
      type: DataTypes.STRING(255),
    },
    created_at: {
      type: DataTypes.STRING(255),
    },
    updated_at: {
      type: DataTypes.STRING(255),
    },
  },
  {
    sequelize,
    modelName: "sarter__boutique_appointment",
    tableName: "sarter__boutique_appointment",
    timestamps: false,
  }
);

module.exports = BoutiqueAppointment;
