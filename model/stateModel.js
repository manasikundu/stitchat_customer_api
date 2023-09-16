const DataTypes = require("sequelize");
const sequelize = require("../dbConnection");

var UserState = sequelize.define(
  "sarter__state",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    country_id: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    name: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.SMALLINT,
      defaultValue: 0,
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
    modelName: "sarter__state",
    tableName: "sarter__state",
    timestamps: false, 
  }
);

module.exports = UserState;
