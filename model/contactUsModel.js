const sequelize = require('../dbConnection')
// const sequelize=Sequelize.sequelize
const { DataTypes } = require("sequelize");

const contactUs = sequelize.define("sarter__contactus", {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        isEmail: true, //checks for email format
        allowNull: false
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    mobile_number: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.STRING,
        allowNull: false
    },
    add_date: {
        type: DataTypes.DATE,
        allowNull: false
    }
},)
contactUs.sync().then(() => {
    console.log("contactUs Model synced");
});

module.exports = contactUs