const { DataTypes } = require('sequelize');
const sequelize = require('../dbConnection');

var SarterVideoInquire = sequelize.define(
  'sarter__video_inquire',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
    },
    guest_email: {
      type: DataTypes.TEXT,
    },
    item_id: {
      type: DataTypes.STRING,
    },
    service_type: {
      type: DataTypes.SMALLINT,
    },
    note: {
      type: DataTypes.TEXT,
    },
    date_time: {
      type: DataTypes.DATE,
    },
    enquiry_id: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    modelName: 'sarter__video_inquire',
    tableName: 'sarter__video_inquire',
    timestamps: false,
  }
);

module.exports = SarterVideoInquire;
