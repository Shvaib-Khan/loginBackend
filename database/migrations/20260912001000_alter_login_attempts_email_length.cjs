"use strict";

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.up = async (knex) => {
  await knex.raw(
    `ALTER TABLE login_attempts MODIFY email VARCHAR(60) NOT NULL`
  );
};

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.down = async (knex) => {
  await knex.raw(
    `ALTER TABLE login_attempts MODIFY email VARCHAR(255) NOT NULL`
  );
};
