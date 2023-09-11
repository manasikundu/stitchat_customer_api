var { DataTypes } = require("sequelize");
var sequelize = require("../dbConnection");
var Users = require("../model/userModel");
var Designer = require('../model/FDModel')


var FashionDesignerWeeklySchedule = sequelize.define(
  "sarter__fashion_designer_weekly_schedule",
  {
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Users,
        key: "id",
      },
    },
    week_day: {
      type: DataTypes.SMALLINT,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    check_availability: {
      type: DataTypes.SMALLINT,
      allowNull: false,
    },
  },
  {
    tableName: "sarter__fashion_designer_weekly_schedule",
    timestamps: false,
  }
);

module.exports = FashionDesignerWeeklySchedule;
