const DEFAULT_SUPABASE_URL = 'https://cewcqpzutryovyrvyior.supabase.co'
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_kug5dLSB-_9PaEg68Rzp2A_8x9-N3n6'

const SUPABASE_URL = String(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL,
).trim()
const SUPABASE_PUBLISHABLE_KEY = String(
  process.env.SUPABASE_PUBLISHABLE_KEY
    || process.env.VITE_SUPABASE_PUBLISHABLE_KEY
    || process.env.SUPABASE_ANON_KEY
    || process.env.VITE_SUPABASE_ANON_KEY
    || DEFAULT_SUPABASE_PUBLISHABLE_KEY,
).trim()

const hasSupabaseCredentials = () => Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY)

const normalizeRole = (role) => (role === 'driver' ? 'driver' : 'company_manager')
const normalizeEmail = (email) => String(email ?? '').trim().toLowerCase()
const buildUserId = (email, role) => `${normalizeRole(role)}:${normalizeEmail(email)}`

const buildRequestUrl = (table, query = {}) => {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || String(value).length === 0) {
      return
    }

    params.set(key, String(value))
  })

  const queryText = params.toString()
  return `${SUPABASE_URL}/rest/v1/${table}${queryText ? `?${queryText}` : ''}`
}

const requestSupabase = async ({ table, method = 'GET', query, body, prefer, onConflict } = {}) => {
  if (!hasSupabaseCredentials()) {
    return {
      ok: false,
      data: null,
      error: new Error('Supabase credentials are not configured.'),
    }
  }

  const headers = {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (prefer) {
    headers.Prefer = prefer
  }

  const finalQuery = {
    ...(query || {}),
    ...(onConflict ? { on_conflict: onConflict } : {}),
  }

  try {
    const response = await fetch(buildRequestUrl(table, finalQuery), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })

    const raw = await response.text()
    let data = null
    if (raw) {
      try {
        data = JSON.parse(raw)
      } catch {
        data = raw
      }
    }

    if (!response.ok) {
      return {
        ok: false,
        data,
        error: new Error(`Supabase request failed (${response.status})`),
      }
    }

    return {
      ok: true,
      data,
      error: null,
    }
  } catch (error) {
    return {
      ok: false,
      data: null,
      error,
    }
  }
}

export const listUserRegistrationsFromSupabase = async () => {
  const result = await requestSupabase({
    table: 'app_users',
    method: 'GET',
    query: {
      select: '*',
      order: 'created_at.desc',
      limit: 500,
    },
  })

  if (!result.ok || !Array.isArray(result.data)) {
    return []
  }

  return result.data
}

export const getUserRegistrationByIdFromSupabase = async (id) => {
  if (!id) {
    return null
  }

  const result = await requestSupabase({
    table: 'app_users',
    method: 'GET',
    query: {
      select: '*',
      id: `eq.${String(id)}`,
      limit: 1,
    },
  })

  if (!result.ok || !Array.isArray(result.data) || result.data.length === 0) {
    return null
  }

  return result.data[0]
}

export const getUserRegistrationByEmailRoleFromSupabase = async (email, role) => {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) {
    return null
  }

  return getUserRegistrationByIdFromSupabase(buildUserId(normalizedEmail, role))
}

export const saveUserRegistrationToSupabase = async ({ fullName, email, role, password, source } = {}) => {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail || !password) {
    return { ok: false }
  }

  const normalizedRole = normalizeRole(role)
  const payload = {
    id: buildUserId(normalizedEmail, normalizedRole),
    full_name: String(fullName || 'User').trim(),
    email: normalizedEmail,
    role: normalizedRole,
    password: String(password),
    section: normalizedRole === 'driver' ? 'driver' : 'warehouse',
    source: String(source || 'storefront-auth').trim(),
    profile_data: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const upsertResult = await requestSupabase({
    table: 'app_users',
    method: 'POST',
    body: payload,
    prefer: 'resolution=merge-duplicates,return=representation',
    onConflict: 'id',
  })

  if (upsertResult.ok) {
    return upsertResult
  }

  return requestSupabase({
    table: 'app_users',
    method: 'POST',
    body: payload,
    prefer: 'return=representation',
  })
}

export const upsertUserProfileInSupabase = async ({
  email,
  role,
  fullName,
  profileData,
  source,
  fallbackPassword,
} = {}) => {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail) {
    return { ok: false, data: null, error: new Error('email is required') }
  }

  const normalizedRole = normalizeRole(role)
  const id = buildUserId(normalizedEmail, normalizedRole)
  const existing = await getUserRegistrationByIdFromSupabase(id)
  const nowIso = new Date().toISOString()

  if (existing) {
    return requestSupabase({
      table: 'app_users',
      method: 'PATCH',
      query: {
        id: `eq.${id}`,
      },
      body: {
        full_name: String(fullName || existing.full_name || 'User').trim(),
        profile_data: profileData ?? existing.profile_data ?? {},
        updated_at: nowIso,
      },
      prefer: 'return=representation',
    })
  }

  return requestSupabase({
    table: 'app_users',
    method: 'POST',
    body: {
      id,
      full_name: String(fullName || 'User').trim(),
      email: normalizedEmail,
      role: normalizedRole,
      password: String(fallbackPassword || 'profile-only'),
      section: normalizedRole === 'driver' ? 'driver' : 'warehouse',
      source: String(source || 'profile-sync').trim(),
      profile_data: profileData ?? {},
      created_at: nowIso,
      updated_at: nowIso,
    },
    prefer: 'resolution=merge-duplicates,return=representation',
    onConflict: 'id',
  })
}

export const deleteUserRegistrationFromSupabase = async (id) => {
  if (!id) {
    return { ok: false, data: null, error: new Error('id is required') }
  }

  return requestSupabase({
    table: 'app_users',
    method: 'DELETE',
    query: {
      id: `eq.${String(id)}`,
    },
    prefer: 'return=representation',
  })
}

export const saveLiveBidToSupabase = async (bid) => {
  if (!bid?.id) {
    return { ok: false }
  }

  const payload = {
    id: String(bid.id),
    source_load_id: String(bid.sourceLoadId || ''),
    customer_name: String(bid.customerName || ''),
    bid_data: bid,
    created_at: String(bid.createdAt || new Date().toISOString()),
    updated_at: new Date().toISOString(),
  }

  return requestSupabase({
    table: 'live_bids',
    method: 'POST',
    body: payload,
    prefer: 'resolution=merge-duplicates,return=representation',
    onConflict: 'id',
  })
}

export const listLiveBidsFromSupabase = async () => {
  const result = await requestSupabase({
    table: 'live_bids',
    method: 'GET',
    query: {
      select: 'id,bid_data,created_at',
      order: 'created_at.desc',
      limit: 300,
    },
  })

  if (!result.ok || !Array.isArray(result.data)) {
    return []
  }

  return result.data
    .map((row) => row?.bid_data)
    .filter((entry) => entry && typeof entry === 'object')
}

export const getLiveBidFromSupabase = async (bidId) => {
  if (!bidId) {
    return null
  }

  const result = await requestSupabase({
    table: 'live_bids',
    method: 'GET',
    query: {
      select: 'id,bid_data,created_at',
      id: `eq.${String(bidId)}`,
      limit: 1,
    },
  })

  if (!result.ok || !Array.isArray(result.data) || result.data.length === 0) {
    return null
  }

  return result.data[0]?.bid_data ?? null
}

export const saveDriverLocationToSupabase = async (record) => {
  if (!record?.id) {
    return { ok: false }
  }

  return requestSupabase({
    table: 'driver_locations',
    method: 'POST',
    body: {
      id: String(record.id),
      shipment_id: String(record.shipmentId || ''),
      load_id: String(record.loadId || ''),
      driver: String(record.driver || ''),
      latitude: Number(record.latitude),
      longitude: Number(record.longitude),
      speed_mph: Number.isFinite(Number(record.speedMph)) ? Number(record.speedMph) : 0,
      recorded_at: String(record.recordedAt || new Date().toISOString()),
      source: String(record.source || 'current-shipment'),
      received_at: String(record.receivedAt || new Date().toISOString()),
      updated_at: new Date().toISOString(),
    },
    prefer: 'resolution=merge-duplicates,return=representation',
    onConflict: 'id',
  })
}

export const saveDriverMessageToSupabase = async (record) => {
  if (!record?.id) {
    return { ok: false }
  }

  return requestSupabase({
    table: 'driver_messages',
    method: 'POST',
    body: {
      id: String(record.id),
      shipment_id: String(record.shipmentId || ''),
      load_id: String(record.loadId || ''),
      driver: String(record.driver || ''),
      message: String(record.message || ''),
      category: String(record.category || 'general'),
      priority: String(record.priority || 'normal'),
      sent_at: String(record.sentAt || new Date().toISOString()),
      received_at: String(record.receivedAt || new Date().toISOString()),
      updated_at: new Date().toISOString(),
    },
    prefer: 'resolution=merge-duplicates,return=representation',
    onConflict: 'id',
  })
}

export const syncDashboardSnapshotToSupabase = async (appName, payload) => {
  if (!appName || !payload) {
    return { ok: false }
  }

  return requestSupabase({
    table: 'dashboard_snapshots',
    method: 'POST',
    body: {
      id: String(appName),
      app_name: String(appName),
      payload,
      updated_at: new Date().toISOString(),
    },
    prefer: 'resolution=merge-duplicates,return=representation',
    onConflict: 'id',
  })
}
