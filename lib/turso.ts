// Turso Database Client for GRID
import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.warn('Turso credentials not configured, cloud sync will be disabled');
}

export const turso = url && authToken
  ? createClient({ url, authToken })
  : null;
