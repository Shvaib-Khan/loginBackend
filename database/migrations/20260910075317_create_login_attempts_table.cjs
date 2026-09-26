exports.up = async function (knex) {
  await knex.schema.createTable("login_attempts", (table) => {
    table.increments("id").primary();

    table.string("email", 255).notNullable();

    table.string("ip_address", 45).notNullable();

    table.enum("status", ["SUCCESS", "FAILED"]).notNullable();

    table.string("reason", 255).nullable();

    table.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index("created_at");
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("login_attempts");
};
