const { DataTypes } = require("sequelize");
const sequelize = require("../dbConnection");
const Appointment = require("../model/appointmentModel")
const Order = require("../model/boutiqueOrderModel")

var Rating = sequelize.define(
  "sarter__rating",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      type: DataTypes.INTEGER,
        references: {
          model: [Appointment, Order],
          key: "customer_id",
        },
      defaultValue: 0,
      comment: 'customer id',
    },
    rating_id: {
        type: DataTypes.INTEGER,
        references: {
          model: [Appointment, Order],
          key: "id",
        },
    defaultValue: 0,
    comment: 'Primary id of appointment and order table',
    },
    rating_flag: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '1-Appointment, 2-order',
    },
    rate: {
      type: DataTypes.STRING(255),
      collate: 'pg_catalog."default"',
    },
    comment: {
      type: DataTypes.TEXT,
      collate: 'pg_catalog."default"',
    },
    ip: {
      type: DataTypes.STRING(255),
      collate: 'pg_catalog."default"',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    device_id: {
      type: DataTypes.STRING(255),
      collate: 'pg_catalog."default"',
    },
    device_info: {
      type: DataTypes.STRING(255),
      collate: 'pg_catalog."default"',
    },
  },
  {
    sequelize,
    modelName: "sarter__rating",
    tableName: "sarter__rating",
    timestamps: false,
  }
);
Rating.belongsTo(Appointment, { foreignKey: 'rating_id', targetKey: 'id', as: 'appointment' });
Rating.belongsTo(Order, { foreignKey: 'rating_id', targetKey: 'id', as: 'order' });


module.exports = Rating;
