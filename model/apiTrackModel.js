const { DataTypes } = require("sequelize");
const sequelize = require("../dbConnection");

var ApiTrack = sequelize.define(
  "sarter__api_track",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "sarter__users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    method_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    api_endpoint_input: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    device_id: {
      type: DataTypes.STRING,
    },
    device_info: {
      type: DataTypes.STRING,
    },
    add_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "sarter__api_track",
    timestamps: false, 
  }
);
// ApiTrack.sync().then(() => {
//   console.log("ApiTrack Model synced");
// });

module.exports = ApiTrack;
