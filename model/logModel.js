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
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '1 - success case, 2 - error case',
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
  },
  {
    sequelize,
    modelName: "sarter__log",
    tableName: "sarter__log",
    timestamps: false,
  }
);

module.exports = SarterLog
