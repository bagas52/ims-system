const { Pool } = require('pg');
const { execSync } = require('child_process');
require('dotenv').config();

function resolveIpv4Sync(hostname) {
  if (process.platform === 'win32') {
    return hostname;
  }
  try {
    const output = execSync(`getent ahosts ${hostname}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const lines = output.split('\n');
    for (const line of lines) {
      const match = line.match(/^(\d+\.\d+\.\d+\.\d+)\s+STREAM/);
      if (match) {
        return match[1];
      }
    }
  } catch (err) {
    // fallback
  }
  return hostname;
}

const dbUrl = process.env.DATABASE_URL;
let poolConfig = {
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  }
};

if (dbUrl) {
  try {
    const url = new URL(dbUrl);
    const originalHost = url.hostname;
    const resolvedIp = resolveIpv4Sync(originalHost);
    
    if (resolvedIp !== originalHost) {
      console.log(`[Database] Resolved ${originalHost} to ${resolvedIp} to bypass IPv6/DNS issues.`);
      poolConfig = {
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        host: resolvedIp,
        port: url.port || 5432,
        database: url.pathname.slice(1),
        ssl: {
          rejectUnauthorized: false,
          servername: originalHost
        }
      };
    }
  } catch (err) {
    console.error('[Database] Error parsing DATABASE_URL:', err.message);
  }
}

const pool = new Pool(poolConfig);

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
