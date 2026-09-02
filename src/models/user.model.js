import { dbConnection } from "../config/db.js";

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

  static async saveRefreshToken(id, refreshToken) {
    const query = `
            UPDATE users
            SET refresh_token = ?
            WHERE id = ?
        `;

    await dbConnection.execute(query, [refreshToken, id]);
  }

  static async findByRefreshToken(refreshToken) {
    const query = `
            SELECT *
            FROM users
            WHERE refresh_token = ?
        `;

    const [rows] = await dbConnection.execute(query, [refreshToken]);

    return rows[0];
  }

  static async removeRefreshToken(id) {
    const query = `
            UPDATE users
            SET refresh_token = NULL
            WHERE id = ?
        `;

    await dbConnection.execute(query, [id]);
  }
}

export default User;
