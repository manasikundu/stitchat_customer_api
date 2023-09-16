const DataTypes = require('sequelize');
const sequelize = require("../dbConnection")
const CategoryItemImage = require("../model/categoryItemImageModel")

var CategoryItem = sequelize.define('sarter__category_item_dic', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    parent_id: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    name: {
        type: DataTypes.STRING,
        collate: 'default', 
    },
    status: {
        type: DataTypes.SMALLINT,
    },
    type: {
        type: DataTypes.SMALLINT,
        comment: '1-Adult, 2-Kid, 3-All', 
    },
}, {
    tableName: 'sarter__category_item_dic',
    timestamps: false, 
});

CategoryItem.belongsTo(CategoryItem, {
    as: 'ParentCategory',
    foreignKey: 'parent_id',
})

CategoryItem.hasMany(CategoryItemImage, {
    foreignKey: 'category_id',
    sourceKey: 'id',
});

  
module.exports = CategoryItem;
