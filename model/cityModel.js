const DataTypes = require("sequelize");
const sequelize = require("../dbConnection");
const UserState = require("../model/stateModel"); 

var City = sequelize.define(
  "sarter__city",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING, 
    },
    id_state: {
      type: DataTypes.SMALLINT,
    },
    id_country: {
      type: DataTypes.SMALLINT,
    },
    delivery_flag: {
      type: DataTypes.SMALLINT,
    },
    delivery_price: {
      type: DataTypes.NUMERIC(4, 2), 
      defaultValue: null,
    },
    pickup_flag: {
      type: DataTypes.SMALLINT,
    },
    pickup_price: {
      type: DataTypes.NUMERIC(4, 2), 
      defaultValue: null,
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
    modelName: "sarter__city",
    tableName: "sarter__city",
    timestamps: false, 
  }
);

City.belongsTo(UserState, { foreignKey: "id_state", targetKey: "id" });

module.exports = City;
