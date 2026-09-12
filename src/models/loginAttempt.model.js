import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const LoginAttempt = sequelize.define(
  "LoginAttempt",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("SUCCESS", "FAILED"),
      allowNull: false,
    },

    reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "login_attempts",
    timestamps: false,
  },
);

export default LoginAttempt;
