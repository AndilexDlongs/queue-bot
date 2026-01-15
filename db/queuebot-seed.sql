PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS queue_entries;
DROP TABLE IF EXISTS provider_services;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS providers;
DROP TABLE IF EXISTS businesses;
DROP TABLE IF EXISTS flow_templates;

CREATE TABLE flow_templates (
  id TEXT PRIMARY KEY,
  business_type TEXT NOT NULL,
  name TEXT NOT NULL,
  version INTEGER NOT NULL,
  definition TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE businesses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  opens_at TEXT NOT NULL,
  closes_at TEXT NOT NULL,
  working_days TEXT NOT NULL,
  manager_name TEXT NOT NULL,
  manager_phone TEXT NOT NULL,
  manager_email TEXT NOT NULL,
  business_type TEXT NOT NULL,
  flow_template_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (flow_template_id) REFERENCES flow_templates(id)
);

CREATE TABLE services (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  cta_label TEXT NOT NULL,
  default_duration_minutes INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  UNIQUE (business_id, key)
);

CREATE TABLE providers (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  lunch_start TEXT NOT NULL,
  lunch_duration_minutes INTEGER NOT NULL,
  average_service_minutes INTEGER NOT NULL,
  is_available INTEGER NOT NULL,
  role TEXT,
  FOREIGN KEY (business_id) REFERENCES businesses(id)
);

CREATE TABLE provider_services (
  provider_id TEXT NOT NULL,
  service_id TEXT NOT NULL,
  PRIMARY KEY (provider_id, service_id),
  FOREIGN KEY (provider_id) REFERENCES providers(id),
  FOREIGN KEY (service_id) REFERENCES services(id)
);

CREATE TABLE queue_entries (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  service_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  joined_at TEXT NOT NULL,
  estimated_at TEXT NOT NULL,
  status TEXT NOT NULL,
  visible_id INTEGER NOT NULL,
  notification_sent INTEGER NOT NULL,
  is_walk_in INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (provider_id) REFERENCES providers(id),
  FOREIGN KEY (service_id) REFERENCES services(id)
);

CREATE INDEX idx_services_business_id ON services(business_id);
CREATE INDEX idx_providers_business_id ON providers(business_id);
CREATE INDEX idx_provider_services_service_id ON provider_services(service_id);
CREATE INDEX idx_queue_entries_business_id ON queue_entries(business_id);
CREATE INDEX idx_queue_entries_provider_status ON queue_entries(provider_id, status);

INSERT INTO flow_templates (
  id, business_type, name, version, definition
) VALUES (
  'flow-barbershop-v1',
  'barbershop',
  'Barbershop Default',
  1,
  '{"id":"barbershop-default","version":1,"notes":"Seeded flow copy. Replace placeholders with business and provider data.","placeholders":["business.name","business.address","business.city","provider.name"]}'
);

INSERT INTO flow_templates (
  id, business_type, name, version, definition
) VALUES (
  'flow-gp-v1',
  'general_practitioner',
  'General Practitioner Default',
  1,
  '{"id":"gp-default","version":1,"notes":"Seeded GP flow copy. Similar queue flow with healthcare-friendly tone.","placeholders":["business.name","business.address","business.city","provider.name"]}'
);

INSERT INTO businesses (
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
) VALUES (
  'business-1',
  'Northbank Cuts & Plaits',
  '45 Market Street',
  'Brookline',
  '555-0102',
  'hello@northbankcuts.com',
  '08:30',
  '19:30',
  'Mon-Sat',
  'Tara Ndlovu',
  '555-0163',
  'tara@northbankcuts.com',
  'barbershop',
  'flow-barbershop-v1'
);

INSERT INTO services (
  id,
  business_id,
  key,
  name,
  cta_label,
  default_duration_minutes
) VALUES
  ('service-haircut', 'business-1', 'haircut', 'Haircut', 'Get a haircut', 30),
  ('service-plait', 'business-1', 'plait', 'Plaiting', 'Plait or braid hair', 45);

INSERT INTO providers (
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
) VALUES
  ('provider-1', 'business-1', 'Maya Lewis', '555-0110', 'maya@northbankcuts.com', '09:00', '17:30', '13:00', 45, 35, 1),
  ('provider-2', 'business-1', 'Darnell Reed', '555-0112', 'darnell@northbankcuts.com', '10:00', '19:00', '14:00', 45, 30, 1),
  ('provider-3', 'business-1', 'Ifeoma Okoro', '555-0114', 'ifeoma@northbankcuts.com', '08:30', '16:30', '12:30', 60, 40, 1),
  ('provider-4', 'business-1', 'Rafael Torres', '555-0116', 'rafael@northbankcuts.com', '11:00', '20:00', '15:00', 30, 25, 0),
  ('provider-5', 'business-1', 'Chloe Park', '555-0118', 'chloe@northbankcuts.com', '09:30', '18:00', '13:30', 45, 50, 1);

INSERT INTO provider_services (provider_id, service_id) VALUES
  ('provider-1', 'service-haircut'),
  ('provider-2', 'service-haircut'),
  ('provider-2', 'service-plait'),
  ('provider-3', 'service-haircut'),
  ('provider-3', 'service-plait'),
  ('provider-4', 'service-haircut'),
  ('provider-5', 'service-haircut');

INSERT INTO queue_entries (
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
) VALUES
  ('client-1001', 'business-1', 'provider-2', 'service-haircut', 'Jordan P', '555-0201', NULL, '2026-01-11T08:48:00Z', '2026-01-11T09:30:00Z', 'waiting', 1, 0, 0),
  ('client-1002', 'business-1', 'provider-2', 'service-plait', 'Mina S', '555-0203', NULL, '2026-01-11T09:00:00Z', '2026-01-11T09:48:00Z', 'waiting', 2, 0, 0),
  ('client-1003', 'business-1', 'provider-2', 'service-haircut', 'Leo J', NULL, 'leo.j@example.com', '2026-01-11T09:12:00Z', '2026-01-11T10:18:00Z', 'waiting', 3, 0, 0),
  ('client-2001', 'business-1', 'provider-3', 'service-haircut', 'Ava K', NULL, 'ava.k@example.com', '2026-01-11T08:40:00Z', '2026-01-11T09:20:00Z', 'waiting', 1, 0, 0),
  ('client-2002', 'business-1', 'provider-3', 'service-plait', 'Sam R', '555-0209', NULL, '2026-01-11T09:10:00Z', '2026-01-11T10:00:00Z', 'waiting', 2, 0, 0);

INSERT INTO businesses (
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
) VALUES (
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

INSERT INTO services (
  id,
  business_id,
  key,
  name,
  cta_label,
  default_duration_minutes
) VALUES (
  'service-consultation',
  'business-2',
  'consultation',
  'Consultation',
  'Book a GP consultation',
  20
);

INSERT INTO providers (
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
) VALUES (
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

INSERT INTO provider_services (provider_id, service_id) VALUES (
  'provider-gp-1',
  'service-consultation'
);

INSERT INTO queue_entries (
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
) VALUES
  ('client-gp-1', 'business-2', 'provider-gp-1', 'service-consultation', 'Amara K', '555-0408', NULL, '2026-01-11T08:10:00Z', '2026-01-11T08:35:00Z', 'waiting', 1, 0, 0),
  ('client-gp-2', 'business-2', 'provider-gp-1', 'service-consultation', 'Simon L', NULL, 'simon.l@example.com', '2026-01-11T08:25:00Z', '2026-01-11T08:55:00Z', 'waiting', 2, 0, 0);
