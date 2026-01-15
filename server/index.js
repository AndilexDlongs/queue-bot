import crypto from 'node:crypto';
import express from 'express';
import db, { initDb } from './db/index.js';

const app = express();
app.use(express.json());

initDb();

const ACTIVE_STATUSES = ['waiting', 'accepted', 'in-service'];
const VALID_STATUSES = [
  'waiting',
  'accepted',
  'in-service',
  'done',
  'declined',
  'left'
];

const getBusiness = (businessId) =>
  db
    .prepare(
      `SELECT
        id,
        name,
        address,
        city,
        phone,
        email,
        opens_at AS opensAt,
        closes_at AS closesAt,
        working_days AS workingDays,
        manager_name AS managerName,
        manager_phone AS managerPhone,
        manager_email AS managerEmail,
        business_type AS businessType,
        flow_template_id AS flowTemplateId
      FROM businesses
      WHERE id = ?`
    )
    .get(businessId);

const getServices = (businessId) =>
  db
    .prepare(
      `SELECT
        id,
        key,
        name,
        cta_label AS ctaLabel,
        default_duration_minutes AS defaultDurationMinutes
      FROM services
      WHERE business_id = ?
        AND is_active = 1
      ORDER BY name`
    )
    .all(businessId);

const getProviders = (businessId) => {
  const providers = db
    .prepare(
      `SELECT
        p.id,
        p.business_id AS businessId,
        p.name,
        p.phone,
        p.email,
        p.start_time AS startTime,
        p.end_time AS endTime,
        p.lunch_start AS lunchStart,
        p.lunch_duration_minutes AS lunchDurationMinutes,
        p.average_service_minutes AS averageServiceMinutes,
        p.is_available AS isAvailable,
        p.last_seen_at AS lastSeenAt,
        group_concat(s.key, ',') AS serviceKeys
      FROM providers p
      LEFT JOIN provider_services ps ON ps.provider_id = p.id
      LEFT JOIN services s ON s.id = ps.service_id
      WHERE p.business_id = ?
      GROUP BY p.id
      ORDER BY p.name`
    )
    .all(businessId);

  return providers.map(provider => {
    const { serviceKeys, ...rest } = provider;
    return {
      ...rest,
      isAvailable: Boolean(rest.isAvailable),
      services: serviceKeys ? serviceKeys.split(',') : []
    };
  });
};

const getQueueEntries = (businessId) =>
  db
    .prepare(
      `SELECT
        q.id,
        q.provider_id AS barberId,
        q.name,
        q.phone,
        q.email,
        q.joined_at AS joinedAt,
        q.estimated_at AS estimatedTime,
        q.status,
        q.visible_id AS visibleId,
        q.notification_sent AS notificationSent,
        q.is_walk_in AS isWalkIn,
        s.key AS service
      FROM queue_entries q
      LEFT JOIN services s ON s.id = q.service_id
      WHERE q.business_id = ?
      ORDER BY q.joined_at ASC`
    )
    .all(businessId)
    .map(entry => ({
      ...entry,
      notificationSent: Boolean(entry.notificationSent),
      isWalkIn: Boolean(entry.isWalkIn)
    }));

const resolveServiceIds = (businessId, serviceKeys) => {
  if (!serviceKeys || serviceKeys.length === 0) {
    return db
      .prepare('SELECT id, key FROM services WHERE business_id = ?')
      .all(businessId);
  }
  const placeholders = serviceKeys.map(() => '?').join(',');
  return db
    .prepare(
      `SELECT id, key FROM services WHERE business_id = ? AND key IN (${placeholders})`
    )
    .all(businessId, ...serviceKeys);
};

const calculateEstimatedMinutes = (businessId, barberId) => {
  const provider = db
    .prepare(
      'SELECT average_service_minutes AS averageServiceMinutes FROM providers WHERE id = ? AND business_id = ?'
    )
    .get(barberId, businessId);
  if (!provider) return 10;

  const row = db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM queue_entries
       WHERE business_id = ?
         AND provider_id = ?
         AND status IN (${ACTIVE_STATUSES.map(() => '?').join(',')})`
    )
    .get(businessId, barberId, ...ACTIVE_STATUSES);
  const count = row?.count ?? 0;
  return Math.max(10, count * provider.averageServiceMinutes);
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/businesses', (_req, res) => {
  const businesses = db
    .prepare(
      `SELECT
        id,
        name,
        city,
        business_type AS businessType,
        flow_template_id AS flowTemplateId
      FROM businesses
      ORDER BY name`
    )
    .all();
  res.json(businesses);
});

app.get('/api/businesses/:businessId/summary', (req, res) => {
  const { businessId } = req.params;
  const business = getBusiness(businessId);
  if (!business) {
    res.status(404).json({ error: 'Business not found' });
    return;
  }

  res.json({
    business,
    services: getServices(businessId),
    providers: getProviders(businessId),
    queue: getQueueEntries(businessId)
  });
});

app.get('/api/businesses/:businessId/flow', (req, res) => {
  const { businessId } = req.params;
  const flow = db
    .prepare(
      `SELECT
        f.id,
        f.business_type AS businessType,
        f.name,
        f.version,
        f.definition
      FROM flow_templates f
      INNER JOIN businesses b ON b.flow_template_id = f.id
      WHERE b.id = ?`
    )
    .get(businessId);

  if (!flow) {
    res.status(404).json({ error: 'Flow not found' });
    return;
  }

  res.json(flow);
});

app.post('/api/businesses/:businessId/providers', (req, res) => {
  const { businessId } = req.params;
  const {
    name,
    phone,
    email,
    startTime,
    endTime,
    lunchStart,
    lunchDurationMinutes,
    averageServiceMinutes,
    isAvailable = false,
    serviceKeys
  } = req.body ?? {};

  if (!name || !phone || !email || !startTime || !endTime || !lunchStart) {
    res.status(400).json({ error: 'Missing required provider fields.' });
    return;
  }

  const id = `provider-${crypto.randomUUID()}`;
  const insertProvider = db.prepare(
    `INSERT INTO providers (
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

  const insertProviderServices = db.prepare(
    'INSERT INTO provider_services (provider_id, service_id) VALUES (?, ?)'
  );

  const transaction = db.transaction(() => {
    insertProvider.run(
      id,
      businessId,
      name,
      phone,
      email,
      startTime,
      endTime,
      lunchStart,
      Number(lunchDurationMinutes) || 0,
      Number(averageServiceMinutes) || 0,
      isAvailable ? 1 : 0
    );

    const services = resolveServiceIds(businessId, serviceKeys);
    services.forEach(service => {
      insertProviderServices.run(id, service.id);
    });
  });

  transaction();

  res.status(201).json({ id });
});

app.patch('/api/providers/:providerId', (req, res) => {
  const { providerId } = req.params;
  const {
    isAvailable,
    lastSeenAt,
    name,
    phone,
    email,
    startTime,
    endTime,
    lunchStart,
    lunchDurationMinutes,
    averageServiceMinutes
  } = req.body ?? {};

  const updates = [];
  const params = [];
  const addUpdate = (field, value) => {
    if (value === undefined) return;
    updates.push(`${field} = ?`);
    params.push(value);
  };

  if (typeof name === 'string') addUpdate('name', name);
  if (typeof phone === 'string') addUpdate('phone', phone);
  if (typeof email === 'string') addUpdate('email', email);
  if (typeof startTime === 'string') addUpdate('start_time', startTime);
  if (typeof endTime === 'string') addUpdate('end_time', endTime);
  if (typeof lunchStart === 'string') addUpdate('lunch_start', lunchStart);
  if (lunchDurationMinutes !== undefined) {
    const minutes = Number(lunchDurationMinutes);
    if (Number.isFinite(minutes)) addUpdate('lunch_duration_minutes', minutes);
  }
  if (averageServiceMinutes !== undefined) {
    const minutes = Number(averageServiceMinutes);
    if (Number.isFinite(minutes)) addUpdate('average_service_minutes', minutes);
  }
  if (typeof isAvailable === 'boolean') {
    addUpdate('is_available', isAvailable ? 1 : 0);
  }
  if (typeof lastSeenAt === 'string') {
    addUpdate('last_seen_at', lastSeenAt);
  }

  if (updates.length === 0) {
    res.status(400).json({ error: 'No valid fields to update.' });
    return;
  }

  const result = db
    .prepare(`UPDATE providers SET ${updates.join(', ')} WHERE id = ?`)
    .run(...params, providerId);

  if (!result.changes) {
    res.status(404).json({ error: 'Provider not found.' });
    return;
  }

  res.json({ ok: true });
});

app.delete('/api/providers/:providerId', (req, res) => {
  const { providerId } = req.params;
  const provider = db.prepare('SELECT id FROM providers WHERE id = ?').get(providerId);

  if (!provider) {
    res.status(404).json({ error: 'Provider not found.' });
    return;
  }

  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM queue_entries WHERE provider_id = ?').run(providerId);
    db.prepare('DELETE FROM provider_services WHERE provider_id = ?').run(providerId);
    db.prepare('DELETE FROM providers WHERE id = ?').run(providerId);
  });

  transaction();
  res.json({ ok: true });
});

app.post('/api/businesses/:businessId/queue', (req, res) => {
  const { businessId } = req.params;
  const { barberId, service, name, phone, email, isWalkIn = false } = req.body ?? {};

  if (!barberId || !service || !name) {
    res.status(400).json({ error: 'Missing required queue fields.' });
    return;
  }

  const serviceRow = db
    .prepare('SELECT id FROM services WHERE business_id = ? AND key = ?')
    .get(businessId, service);

  if (!serviceRow) {
    res.status(400).json({ error: 'Unknown service key.' });
    return;
  }

  const waitMinutes = calculateEstimatedMinutes(businessId, barberId);
  const joinedAt = new Date();
  const estimatedAt = new Date(joinedAt.getTime() + waitMinutes * 60000);

  const visibleRow = db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM queue_entries
       WHERE business_id = ?
         AND provider_id = ?
         AND status IN (${ACTIVE_STATUSES.map(() => '?').join(',')})`
    )
    .get(businessId, barberId, ...ACTIVE_STATUSES);

  const visibleId = (visibleRow?.count ?? 0) + 1;
  const id = `queue-${crypto.randomUUID()}`;

  db.prepare(
    `INSERT INTO queue_entries (
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
  ).run(
    id,
    businessId,
    barberId,
    serviceRow.id,
    name,
    phone ?? null,
    email ?? null,
    joinedAt.toISOString(),
    estimatedAt.toISOString(),
    'waiting',
    visibleId,
    0,
    isWalkIn ? 1 : 0
  );

  res.status(201).json({ id });
});

app.patch('/api/queue/:queueId', (req, res) => {
  const { queueId } = req.params;
  const { status } = req.body ?? {};

  if (!VALID_STATUSES.includes(status)) {
    res.status(400).json({ error: 'Invalid status.' });
    return;
  }

  const result = db
    .prepare('UPDATE queue_entries SET status = ? WHERE id = ?')
    .run(status, queueId);

  if (!result.changes) {
    res.status(404).json({ error: 'Queue entry not found.' });
    return;
  }

  res.json({ ok: true });
});

app.delete('/api/queue/:queueId', (req, res) => {
  const { queueId } = req.params;
  const result = db.prepare('DELETE FROM queue_entries WHERE id = ?').run(queueId);

  if (!result.changes) {
    res.status(404).json({ error: 'Queue entry not found.' });
    return;
  }

  res.json({ ok: true });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`Queue bot API running on http://localhost:${port}`);
});
