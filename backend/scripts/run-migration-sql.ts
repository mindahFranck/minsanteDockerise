import { readFileSync } from 'fs';
import { join } from 'path';
import sequelize from '../src/config/database';

async function runMigrationSQL() {
  try {
    console.log('Running SQL migration...');

    const sqlPath = join(__dirname, '../database/migrations/add_maintenance_contacts.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Split SQL by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 100)}...`);
      await sequelize.query(statement);
    }

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrationSQL();
