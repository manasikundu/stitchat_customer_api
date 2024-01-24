const DataTypes = require("sequelize");
const sequelize = require("../dbConnection");

var ShowroomServiceOrder = sequelize.define(
    "sarter__showroom_service_order",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        s_user_id: {
            type: DataTypes.INTEGER
        },
        c_name: {
            type: DataTypes.STRING
        },
        c_mobile_number: {
            type: DataTypes.STRING
        },
        c_email: {
            type: DataTypes.STRING
        },
        c_area: {
            type: DataTypes.STRING
        },
        c_address: {
            type: DataTypes.STRING
        },
        c_landmark: {
            type: DataTypes.STRING
        },
        c_pincode: {
            type: DataTypes.STRING
        },
        c_city: {
            type: DataTypes.INTEGER  //id from master table
        },
        c_state: {
            type: DataTypes.INTEGER //id from master table
        },
        category_item_dic_id: {
            type: DataTypes.INTEGER
        },
        alternation_type: {
            type: DataTypes.STRING
        },
        quantity: {
            type: DataTypes.INTEGER
        },
        total_amount: {
            type: DataTypes.NUMBER
        },
        exp_delivery_date: {
            type: DataTypes.DATE
        },
        parent_id: {
            type: DataTypes.INTEGER
        },
        fe_id: {
            type: DataTypes.INTEGER
        },
        boutique_id: {
            type: DataTypes.INTEGER
        },
        status: {
            type: DataTypes.INTEGER
        },
        log_report: {
            type: DataTypes.TEXT
        },
        invoice_number: {
            type: DataTypes.STRING
        },
        created_at: {
            type: DataTypes.DATE,
        },
        updated_at: {
            type: DataTypes.DATE,
        },
        note: {
            type: DataTypes.TEXT,
        },
        booking_code:{
            type: DataTypes.STRING,   
        },
        d_name:{
            type: DataTypes.STRING,   
        },
        d_mobile_number:{
            type: DataTypes.STRING,   
        },
        delivery_label:{
            type: DataTypes.STRING,   
        },
        alternation_json:{
            type: DataTypes.TEXT,   
        }
    },
    {
        sequelize,
        modelName: "sarter__showroom_service_order",
        tableName: "sarter__showroom_service_order",
        timestamps: false,
    }
);

module.exports = ShowroomServiceOrder;