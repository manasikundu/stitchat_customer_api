const DataTypes = require("sequelize")
const sequelize = require("../dbConnection")

var Coupon = sequelize.define("sarter__master_coupon",{
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    coupon_code: {
        type: DataTypes.STRING(100), 
        allowNull: false,
    },
    coupon_name: {
        type: DataTypes.STRING(255), 
    },
    description: {
        type: DataTypes.TEXT, 
    },
    coupon_type: {
        type: DataTypes.SMALLINT,
        defaultValue: 0, 
    },
    minimum_order_amount: {
        type: DataTypes.DECIMAL(10, 2), 
        defaultValue: 0,
    },
    discount_amount: {
        type: DataTypes.DECIMAL(10, 2), 
        defaultValue: 0,
    },
    start_date: {
        type: DataTypes.DATE, 
    },
    end_date: {
        type: DataTypes.DATE, 
    },
    location: {
        type: DataTypes.TEXT, 
    },
    valid_users: {
        type: DataTypes.INTEGER, 
        defaultValue: 0,
    },
    status: {
        type: DataTypes.SMALLINT, 
        defaultValue: 1,
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
    modelName: "sarter__master_coupon",
    tableName: "sarter__master_coupon", 
    timestamps: false,
  }
)

module.exports = Coupon
