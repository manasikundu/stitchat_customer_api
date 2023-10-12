const sequelize = require('../dbConnection')
// const sequelize=Sequelize.sequelize
const { DataTypes } = require("sequelize");

const contactUs = sequelize.define("sarter__contactus", {
    name: {
        type: DataTypes.STRING,
    },
    email: {
        type: DataTypes.STRING,
        isEmail: true, //checks for email format
    },
    user_id: {
        type: DataTypes.INTEGER,
    },
    mobile_number: {
        type: DataTypes.STRING,
    },
    message: {
        type: DataTypes.STRING,
    },
    add_date: {
        type: DataTypes.DATE,
    },
},{
    timestamps:false
}
)
contactUs.sync().then(() => {
    console.log("contactUs Model synced");
});

module.exports = contactUs