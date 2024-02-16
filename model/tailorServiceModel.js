const DataTypes = require("sequelize");
const sequelize = require("../dbConnection");
var TailorService = sequelize.define(
  "sarter__tailor_sub_category",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name:{
        type:DataTypes.STRING
    },
    service_type: {
      type: DataTypes.INTEGER,
    },
    amount: {
      type: DataTypes.NUMERIC,
    },
    measurement_flag: {
      type: DataTypes.SMALLINT,
    },
  },
  {
    sequelize,
    modelName: "sarter__tailor_sub_category",
    tableName: "sarter__tailor_sub_category",
    timestamps: false,
  }
);

module.exports = TailorService;

