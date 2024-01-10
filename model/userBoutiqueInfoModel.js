const DataTypes = require("sequelize");
const sequelize = require("../dbConnection");
const Designer = require('../model/FDModel')
const BoutiqueOrder = require('../model/boutiqueOrderModel')
const Users = require('../model/userModel')

var Boutique = sequelize.define(
  "sarter__boutique_basic_info",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    boutique_name: {
      type: DataTypes.STRING,
    },
    boutique_code: {
      type: DataTypes.STRING,
    },
    boutique_logo: {
      type: DataTypes.STRING,
    },
    boutique_banner: {
      type: DataTypes.STRING,
    },
    location_lat: {
      type: DataTypes.STRING,
    },
    coutry_state: {
      type: DataTypes.STRING,
    },
    city: {
      type: DataTypes.STRING,
    },
    area: {
      type: DataTypes.STRING,
    },
    address: {
      type: DataTypes.STRING,
    },
    landmark: {
      type: DataTypes.STRING,
    },
    last_update_on: {
      type: DataTypes.STRING,
    },
    updateed_by_user_id: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    location_lng: {
      type: DataTypes.STRING,
    },
    contact_number: {
      type: DataTypes.STRING,
    },
    create_on: {
      type: DataTypes.STRING,
    },
    categoryType: {
      type: DataTypes.STRING,
    },
    user_type_id: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    about_me: {
      type: DataTypes.TEXT,
    },
    communication_mode: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    language_speak: {
      type: DataTypes.STRING,
    },
    education: {
      type: DataTypes.TEXT,
    },
    experience: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    base_price: {
      type: DataTypes.NUMERIC(10, 2),
      defaultValue: 0,
    },
    offer_price: {
      type: DataTypes.NUMERIC(10, 2),
      defaultValue: 0,
    },
    pincode: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    modelName: "sarter__boutique_basic_info",
    tableName: "sarter__boutique_basic_info",
    timestamps: false,
  }
);

// Define the association between Boutique and BoutiqueOrder
Boutique.hasOne(BoutiqueOrder, { foreignKey: 'boutique_id' });


module.exports = Boutique;


