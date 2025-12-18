import sequelize from '../src/config/database';

async function fixTelephone() {
  try {
    console.log('Adding telephone column...');

    await sequelize.query('ALTER TABLE tmpfosa ADD COLUMN telephone VARCHAR(20) NULL');

    console.log('✅ Column telephone added successfully!');
    process.exit(0);
  } catch (error: any) {
    if (error.message.includes('Duplicate column name')) {
      console.log('✅ Column telephone already exists!');
      process.exit(0);
    } else {
      console.error('❌ Failed to add column:', error);
      process.exit(1);
    }
  }
}

fixTelephone();
