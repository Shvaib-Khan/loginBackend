exports.up = async function (knex) {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();

    table.string("name", 100).notNullable();

    table.string("email", 255).notNullable().unique();

    table.string("password", 255).notNullable();

    table.text("refresh_token").nullable();

    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("users");
};
