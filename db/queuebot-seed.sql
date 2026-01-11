PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS queue_clients;
DROP TABLE IF EXISTS barbers;
DROP TABLE IF EXISTS salons;

CREATE TABLE salons (
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
  manager_email TEXT NOT NULL
);

CREATE TABLE barbers (
  id TEXT PRIMARY KEY,
  salon_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  lunch_start TEXT NOT NULL,
  lunch_duration_minutes INTEGER NOT NULL,
  average_cut_minutes INTEGER NOT NULL,
  is_available INTEGER NOT NULL,
  FOREIGN KEY (salon_id) REFERENCES salons(id)
);

CREATE TABLE queue_clients (
  id TEXT PRIMARY KEY,
  salon_id TEXT NOT NULL,
  barber_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  joined_at TEXT NOT NULL,
  estimated_at TEXT NOT NULL,
  status TEXT NOT NULL,
  visible_id INTEGER NOT NULL,
  notification_sent INTEGER NOT NULL,
  service TEXT NOT NULL,
  is_walk_in INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (salon_id) REFERENCES salons(id),
  FOREIGN KEY (barber_id) REFERENCES barbers(id)
);

INSERT INTO salons (
  id, name, address, city, phone, email, opens_at, closes_at, working_days,
  manager_name, manager_phone, manager_email
) VALUES (
  'salon-1',
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
  'tara@northbankcuts.com'
);

INSERT INTO barbers (
  id, salon_id, name, phone, email, start_time, end_time, lunch_start,
  lunch_duration_minutes, average_cut_minutes, is_available
) VALUES
  ('barber-1', 'salon-1', 'Maya Lewis', '555-0110', 'maya@northbankcuts.com', '09:00', '17:30', '13:00', 45, 35, 1),
  ('barber-2', 'salon-1', 'Darnell Reed', '555-0112', 'darnell@northbankcuts.com', '10:00', '19:00', '14:00', 45, 30, 1),
  ('barber-3', 'salon-1', 'Ifeoma Okoro', '555-0114', 'ifeoma@northbankcuts.com', '08:30', '16:30', '12:30', 60, 40, 1),
  ('barber-4', 'salon-1', 'Rafael Torres', '555-0116', 'rafael@northbankcuts.com', '11:00', '20:00', '15:00', 30, 25, 0),
  ('barber-5', 'salon-1', 'Chloe Park', '555-0118', 'chloe@northbankcuts.com', '09:30', '18:00', '13:30', 45, 50, 1);

INSERT INTO queue_clients (
  id, salon_id, barber_id, name, phone, email, joined_at, estimated_at, status,
  visible_id, notification_sent, service, is_walk_in
) VALUES
  ('client-1001', 'salon-1', 'barber-2', 'Jordan P', '555-0201', NULL, '2026-01-11T08:48:00Z', '2026-01-11T09:30:00Z', 'waiting', 1, 0, 'haircut', 0),
  ('client-1002', 'salon-1', 'barber-2', 'Mina S', '555-0203', NULL, '2026-01-11T09:00:00Z', '2026-01-11T09:48:00Z', 'waiting', 2, 0, 'plait', 0),
  ('client-1003', 'salon-1', 'barber-2', 'Leo J', NULL, 'leo.j@example.com', '2026-01-11T09:12:00Z', '2026-01-11T10:18:00Z', 'waiting', 3, 0, 'haircut', 0),
  ('client-2001', 'salon-1', 'barber-3', 'Ava K', NULL, 'ava.k@example.com', '2026-01-11T08:40:00Z', '2026-01-11T09:20:00Z', 'waiting', 1, 0, 'haircut', 0),
  ('client-2002', 'salon-1', 'barber-3', 'Sam R', '555-0209', NULL, '2026-01-11T09:10:00Z', '2026-01-11T10:00:00Z', 'waiting', 2, 0, 'plait', 0);
