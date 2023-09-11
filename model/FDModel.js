var { DataTypes } = require("sequelize");
var sequelize = require("../dbConnection");
var Users = require("../model/userModel");
let FashionDesignerWeeklySchedule = require("../model/weeklySchleduleModel");


var BoutiqueEmployeeMap = sequelize.define(
  "sarter__boutique_employee_map",
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: Users,
        key: "id",
      },
    },
    boutique_id: {
      type: DataTypes.INTEGER,
    },
    first_name: {
      type: DataTypes.STRING,
    },
    last_name: {
      type: DataTypes.STRING,
    },
    role: {
      type: DataTypes.INTEGER,
      comment: "1-Manager, 2-Accountant, 4-Designer, 8-Master, 16-Worker",
    },
    created_at: {
      type: DataTypes.DATE,
    },
    created_by_user_id: {
      type: DataTypes.INTEGER,
    },
    parent_id: {
      type: DataTypes.INTEGER,
    },
  },
  {
    sequelize,
    modelName: "BoutiqueEmployeeMap",
    tableName: "sarter__boutique_employee_map",
    timestamps: false,
  }
);

// Associate BoutiqueEmployeeMap with FashionDesignerWeeklySchedule
BoutiqueEmployeeMap.hasMany(FashionDesignerWeeklySchedule, {
  foreignKey: "user_id", 
  as: "designers",
});

module.exports = BoutiqueEmployeeMap;

