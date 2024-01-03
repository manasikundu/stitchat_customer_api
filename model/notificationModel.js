const DataTypes = require("sequelize");
const sequelize = require("../dbConnection");

const Notification = sequelize.define(
  "sarter__notification",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    sender_id: {
      type: DataTypes.INTEGER,
    },
    receiver_id: {
      type: DataTypes.INTEGER,
    },
    type: {
      type: DataTypes.INTEGER,
    },
    title: {
      type: DataTypes.STRING,
    },
    body: {
        type: DataTypes.TEXT,
    },
    send_time: {
        type: DataTypes.DATE,
    },
    read_time: {
        type: DataTypes.DATE,
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
    modelName: "sarter__notification",
    tableName: "sarter__notification",
    timestamps: false,
})
// Notification.sync().then(() => {
//     console.log("Notification Model synced")
// })

module.exports = Notification
