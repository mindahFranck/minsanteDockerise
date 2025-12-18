import sequelize from '../src/config/database';

async function verifyColumns() {
  try {
    console.log('Checking columns in tmpfosa table...\n');

    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'u877916646_minstante'
      AND TABLE_NAME = 'tmpfosa'
      AND COLUMN_NAME IN (
        'last_inspection',
        'next_inspection',
        'maintenance_priority',
        'maintenance_issues',
        'telephone',
        'email',
        'responsable_nom',
        'responsable_telephone'
      )
      ORDER BY COLUMN_NAME
    `);

    const requiredColumns = [
      'last_inspection',
      'next_inspection',
      'maintenance_priority',
      'maintenance_issues',
      'telephone',
      'email',
      'responsable_nom',
      'responsable_telephone'
    ];

    const existingColumns = (results as any[]).map(r => r.COLUMN_NAME);

    console.log('✅ Existing columns:');
    existingColumns.forEach(col => console.log(`  - ${col}`));

    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      console.log('\n❌ Missing columns:');
      missingColumns.forEach(col => console.log(`  - ${col}`));
    } else {
      console.log('\n✅ All required columns are present!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying columns:', error);
    process.exit(1);
  }
}

verifyColumns();
