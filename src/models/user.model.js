<<<<<<< HEAD
import {dbConnection} from "../config/db.js";

class User {
  static async create({ name, email, password }) {
    const query = `
      INSERT INTO users (name, email, password)
      VALUES (?, ?, ?)
    `;

    const [result] = await dbConnection.execute(query, [name, email, password]);

    return result;
  }

  static async findByEmail(email) {
    const query = `
      SELECT * FROM users WHERE email = ?
    `;

    const [rows] = await dbConnection.execute(query, [email]);

    return rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT id, name, email, created_at, updated_at
      FROM users WHERE id = ?
    `;

    const [rows] = await dbConnection.execute(query, [id]);

    return rows[0];
  }

  static async saveRefreshToken(id, refreshToken){

        const query = `
            UPDATE users
            SET refresh_token = ?
            WHERE id = ?
        `;

        await dbConnection.execute(
            query,
            [refreshToken,id]
        );
    }

    static async findByRefreshToken(refreshToken){

        const query = `
            SELECT *
            FROM users
            WHERE refresh_token = ?
        `;

        const [rows] = await dbConnection.execute(
            query,
            [refreshToken]
        );

        return rows[0];
    }

    static async removeRefreshToken(id){

        const query = `
            UPDATE users
            SET refresh_token = NULL
            WHERE id = ?
        `;

        await dbConnection.execute(
            query,
            [id]
        );
    }
}

export default User;
=======
import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },

    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "users",

    timestamps: true,

    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

export default User;
>>>>>>> main
