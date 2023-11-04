const DataTypes = require("sequelize")
const sequelize = require("../dbConnection")
var BoutiqueOrderTrack = sequelize.define(
  "sarter__boutique_order_track",
  {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    order_id: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    boutique_id: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    status_activity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    activity_date: {
        type: DataTypes.STRING(255), 
    },
  },
  {
    sequelize,
    modelName: "sarter__boutique_order_track",
    tableName: "sarter__boutique_order_track",
    timestamps: false,
  }
);

module.exports = BoutiqueOrderTrack

