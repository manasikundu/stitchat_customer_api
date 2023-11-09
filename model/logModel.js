const DataTypes = require("sequelize");
const sequelize = require("../dbConnection");

const SarterLog = sequelize.define(
  "sarter__log",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.STRING(255),
      defaultValue: '0',
    },
    status: {
      type: DataTypes.STRING,
    },
    message: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    device_id: {
      type: DataTypes.STRING(255),
      defaultValue: '0',
    },
    created_at: {
      type: DataTypes.DATE,
    },
    updated_at: {
      type: DataTypes.DATE,
    },
    device_info: {
      type: DataTypes.STRING,
    },
    action: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    modelName: "sarter__log",
    tableName: "sarter__log",
    timestamps: false,
  }
);

module.exports = SarterLog
