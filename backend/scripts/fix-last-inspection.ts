import sequelize from '../src/config/database';

async function fixLastInspection() {
  try {
    console.log('Adding last_inspection column...');

    await sequelize.query('ALTER TABLE tmpfosa ADD COLUMN last_inspection DATE NULL');

    console.log('✅ Column last_inspection added successfully!');
    process.exit(0);
  } catch (error: any) {
    if (error.message.includes('Duplicate column name')) {
      console.log('✅ Column last_inspection already exists!');
      process.exit(0);
    } else {
      console.error('❌ Failed to add column:', error);
      process.exit(1);
    }
  }
}

fixLastInspection();
