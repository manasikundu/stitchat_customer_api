const DataTypes = require("sequelize");
const sequelize = require("../dbConnection");

var BoutiqueWeeklySchedule = sequelize.define(
  "sarter__boutique_weekly_schedule",
  {
    boutique_id: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Boutique ID',
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
      defaultValue: 0,
    },
    address_id: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    added_by: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "sarter__boutique_weekly_schedule",
    timestamps: false,
  }
);

module.exports = BoutiqueWeeklySchedule;
