const DataTypes = require("sequelize");
const sequelize = require("../dbConnection");

var ShowroomRequest = sequelize.define(
    "sarter__showroom_request",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING
        },
        type: {
            type: DataTypes.STRING
        },
        registration_date: {
            type: DataTypes.DATE
        },
        phone_no: {
            type: DataTypes.STRING
        },
        email: {
            type: DataTypes.STRING
        },
        website: {
            type: DataTypes.STRING
        },
        logo: {
            type: DataTypes.STRING
        },
        address: {
            type: DataTypes.STRING
        },
        city: {
            type: DataTypes.STRING
        },
        state: {
            type: DataTypes.STRING
        },
        country: {
            type: DataTypes.STRING
        },
        pincode: {
            type: DataTypes.STRING
        },
        contact_person_name: {
            type: DataTypes.STRING
        },
        contact_person_phone: {
            type: DataTypes.STRING
        },
        contact_person_email: {
            type: DataTypes.STRING
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
        modelName: "sarter__showroom_request",
        tableName: "sarter__showroom_request",
        timestamps: false,
    }
);

module.exports = ShowroomRequest;