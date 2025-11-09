import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Ajouter capitale à la table regions
  await knex.schema.alterTable("regions", (table) => {
    table.string("capitale", 191).nullable().after("nom");
  });

  // Ajouter nom à la table batiments
  await knex.schema.alterTable("batiments", (table) => {
    table.string("nom", 200).nullable().after("id");
  });

  // Ajouter nom à la table equipements
  await knex.schema.alterTable("equipements", (table) => {
    table.string("nom", 200).nullable().after("id");
  });
}

export async function down(knex: Knex): Promise<void> {
  // Supprimer capitale de la table regions
  await knex.schema.alterTable("regions", (table) => {
    table.dropColumn("capitale");
  });

  // Supprimer nom de la table batiments
  await knex.schema.alterTable("batiments", (table) => {
    table.dropColumn("nom");
  });

  // Supprimer nom de la table equipements
  await knex.schema.alterTable("equipements", (table) => {
    table.dropColumn("nom");
  });
}
