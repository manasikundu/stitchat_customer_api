var DataTypes = require("sequelize");
var sequelize = require("../dbConnection");
var BoutiqueBasicInfo = require("../model/userBoutiqueInfoModel");

var BoutiqueOrder = sequelize.define(
  "sarter__boutique_orders",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    booking_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    boutique_id: {
      type: DataTypes.INTEGER,
      references: {
        model: BoutiqueBasicInfo,
        key: "id",
      },
    },
    customer_id: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    total_quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    subtotal_amount: {
      type: DataTypes.DECIMAL(10, 2),
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
    },
    coupon_applied_amount: {
      type: DataTypes.DECIMAL(10, 2),
    },
    tax_applied_amount: {
      type: DataTypes.DECIMAL(10, 2),
    },
    total_payable_amount: {
      type: DataTypes.DECIMAL(10, 2),
    },
    order_status: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.STRING,
    },
    updated_at: {
      type: DataTypes.STRING,
    },
    bill_image: {
      type: DataTypes.TEXT,
    },
    first_name: {
      type: DataTypes.STRING,
    },
    last_name: {
      type: DataTypes.STRING,
    },
    mobile_number: {
      type: DataTypes.STRING,
    },
    email_id: {
      type: DataTypes.STRING,
    },
    order_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    user_gift_id: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    reward_point: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: "sarter__boutique_orders",
    timestamps: false,
  }
);


module.exports = BoutiqueOrder;

