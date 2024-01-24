const DataTypes = require("sequelize");
const sequelize = require("../dbConnection");

var TailorAssign = sequelize.define(
    "sarter__tailor_assign",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.INTEGER
        },
        tailor_id: {
            type: DataTypes.INTEGER
        },
        order_id: {
            type: DataTypes.INTEGER
        },
        add_date: {
            type: DataTypes.DATE
        }
    },
    {
        sequelize,
        modelName: "sarter__tailor_assign",
        tableName: "sarter__tailor_assign",
        timestamps: false,
    }
);

module.exports = TailorAssign;