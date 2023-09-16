const  DataTypes  = require('sequelize');
const sequelize = require('../dbConnection'); 
const CategoryItem = require('../model/categoryItemModel')

var CategoryItemImage = sequelize.define('sarter__category_item_images', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    category_id: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    image: {
        type: DataTypes.TEXT,
        collate: 'default', 
    },
    category_type: {
        type: DataTypes.SMALLINT,
        comment: '1- men , 2-women, 3-kid',
    },
}, {
    tableName: 'sarter__category_item_images',
    timestamps: false, 
});


module.exports = CategoryItemImage;

