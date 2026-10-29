import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL?.trim();
const explicitPassword = process.env.DB_PASSWORD ?? process.env.PGPASSWORD;

if (!databaseUrl && !process.env.DB_HOST) {
  throw new Error(
    'Database configuration missing. Set DATABASE_URL in backend/.env, or set DB_HOST, DB_PORT, DB_NAME, DB_USER, and DB_PASSWORD.'
  );
}

const config = databaseUrl
  ? { connectionString: databaseUrl }
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME || 'chirp',
      user: process.env.DB_USER || 'postgres',
      password: explicitPassword,
    };

// If DATABASE_URL omits its password, allow DB_PASSWORD/PGPASSWORD to supply it.
if (databaseUrl && typeof explicitPassword === 'string' && explicitPassword.length > 0) {
  config.password = explicitPassword;
}

// Fail with a useful setup message instead of the less clear pg SCRAM error.
if (databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    if (parsed.username && !parsed.password && !(typeof explicitPassword === 'string' && explicitPassword.length > 0)) {
      throw new Error(
        'DATABASE_URL has no password. Add the real PostgreSQL password to the URL, or set DB_PASSWORD in backend/.env. Do not share the password.'
      );
    }
  } catch (error) {
    if (error.message.includes('DATABASE_URL has no password')) throw error;
    throw new Error('DATABASE_URL is not a valid PostgreSQL URL. Expected postgresql://USER:PASSWORD@HOST:5432/DATABASE.');
  }
}

export const pool = new pg.Pool(config);

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});

export const query = (text, params) => pool.query(text, params);
