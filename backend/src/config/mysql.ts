import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host:  'srv915.hstgr.io',
  port: Number.parseInt('3306'),
  user:  'root',
  password:  'itgrafik@Dev12',
  database:'health_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export default pool;
