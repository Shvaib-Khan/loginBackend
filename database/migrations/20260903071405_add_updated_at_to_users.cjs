exports.up = async function (knex) {
  await knex.schema.alterTable("users", (table) => {
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("updated_at");
  });
};
