import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

const defaultDbPath = path.join(rootDir, 'db', 'queuebot.sqlite');
const dbPath = process.env.DB_PATH ?? defaultDbPath;
const seedPath = path.join(rootDir, 'db', 'queuebot-seed.sql');

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

const seedDatabase = () => {
  const seedSql = fs.readFileSync(seedPath, 'utf8');
  db.exec(seedSql);
};

const ensureDemoBusiness = () => {
  const existing = db
    .prepare('SELECT id FROM businesses WHERE id = ?')
    .get('business-2');
  if (existing) return;

  const insertFlow = db.prepare(
    `INSERT OR IGNORE INTO flow_templates (
      id, business_type, name, version, definition
    ) VALUES (?, ?, ?, ?, ?)`
  );
  const insertBusiness = db.prepare(
    `INSERT INTO businesses (
      id,
      name,
      address,
      city,
      phone,
      email,
      opens_at,
      closes_at,
      working_days,
      manager_name,
      manager_phone,
      manager_email,
      business_type,
      flow_template_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertService = db.prepare(
    `INSERT OR IGNORE INTO services (
      id,
      business_id,
      key,
      name,
      cta_label,
      default_duration_minutes
    ) VALUES (?, ?, ?, ?, ?, ?)`
  );
  const insertProvider = db.prepare(
    `INSERT OR IGNORE INTO providers (
      id,
      business_id,
      name,
      phone,
      email,
      start_time,
      end_time,
      lunch_start,
      lunch_duration_minutes,
      average_service_minutes,
      is_available
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertProviderService = db.prepare(
    'INSERT OR IGNORE INTO provider_services (provider_id, service_id) VALUES (?, ?)'
  );
  const insertQueueEntry = db.prepare(
    `INSERT OR IGNORE INTO queue_entries (
      id,
      business_id,
      provider_id,
      service_id,
      name,
      phone,
      email,
      joined_at,
      estimated_at,
      status,
      visible_id,
      notification_sent,
      is_walk_in
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const transaction = db.transaction(() => {
    insertFlow.run(
      'flow-gp-v1',
      'general_practitioner',
      'General Practitioner Default',
      1,
      '{"id":"gp-default","version":1,"notes":"Seeded GP flow copy. Similar queue flow with healthcare-friendly tone.","placeholders":["business.name","business.address","business.city","provider.name"]}'
    );

    insertBusiness.run(
      'business-2',
      'Lakeside Family Practice',
      '14 Meadow Avenue',
      'Riverton',
      '555-0321',
      'hello@lakesidefamilypractice.com',
      '08:00',
      '17:00',
      'Mon-Fri',
      'Naledi Khumalo',
      '555-0324',
      'naledi@lakesidefamilypractice.com',
      'general_practitioner',
      'flow-gp-v1'
    );

    insertService.run(
      'service-consultation',
      'business-2',
      'consultation',
      'Consultation',
      'Book a GP consultation',
      20
    );

    insertProvider.run(
      'provider-gp-1',
      'business-2',
      'Dr. Samuela Kofi',
      '555-0402',
      'dr.kofi@lakesidefamilypractice.com',
      '08:00',
      '17:00',
      '12:30',
      30,
      20,
      1
    );

    insertProviderService.run('provider-gp-1', 'service-consultation');

    insertQueueEntry.run(
      'client-gp-1',
      'business-2',
      'provider-gp-1',
      'service-consultation',
      'Amara K',
      '555-0408',
      null,
      '2026-01-11T08:10:00Z',
      '2026-01-11T08:35:00Z',
      'waiting',
      1,
      0,
      0
    );
    insertQueueEntry.run(
      'client-gp-2',
      'business-2',
      'provider-gp-1',
      'service-consultation',
      'Simon L',
      null,
      'simon.l@example.com',
      '2026-01-11T08:25:00Z',
      '2026-01-11T08:55:00Z',
      'waiting',
      2,
      0,
      0
    );
  });

  transaction();
};

export const initDb = () => {
  const hasBusinessesTable = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='businesses'")
    .get();
  if (!hasBusinessesTable) {
    seedDatabase();
  }
  ensureDemoBusiness();
};

export default db;
