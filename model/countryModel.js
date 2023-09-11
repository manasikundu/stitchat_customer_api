var DataTypes = require("sequelize");
var sequelize = require("../dbConnection");

var Country = sequelize.define(
  "sarter__country",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false, 
    },
    created_at: {
      type: DataTypes.DATE, 
    },
    updated_at: {
      type: DataTypes.TIME, 
    },
  },
  {
    sequelize,
    modelName: "sarter__country",
    tableName: "sarter__country",
    timestamps: false, 
  }
);

module.exports = Country;
