import Database from 'better-sqlite3';

const db = new Database('./dev.db');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    sess TEXT NOT NULL,
    expire INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    profile_image_url TEXT,
    created_at INTEGER,
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS quotes (
    id TEXT PRIMARY KEY,
    package_id TEXT NOT NULL,
    addon_ids TEXT DEFAULT '[]',
    contract_term TEXT DEFAULT '1month',
    contact TEXT NOT NULL,
    totals TEXT NOT NULL,
    eximia_contact_id TEXT,
    ghl_invoice_id TEXT,
    ghl_customer_id TEXT,
    payment_url TEXT,
    status TEXT DEFAULT 'pending',
    created_at INTEGER
  );
`);

console.log('✅ Database tables created successfully!');
db.close();
