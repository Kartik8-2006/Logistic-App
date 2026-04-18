import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { dashboardData } from './dashboardData.js'
import {
  appendSharedLiveBid,
  listDashboardEntriesFromSharedBids,
  toDashboardRecordsFromBid,
} from './sharedState.js'
import {
  getUserRegistrationByEmailRoleFromSupabase,
  listLiveBidsFromSupabase,
  listUserRegistrationsFromSupabase,
  saveLiveBidToSupabase,
  saveUserRegistrationToSupabase,
  syncDashboardSnapshotToSupabase,
  upsertUserProfileInSupabase,
} from './supabaseStore.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT) || 5000
const DEFAULT_COMPANY_EMAIL = 'company@manifestdrives.com'

app.use(cors())
app.use(express.json())

const parsePositiveNumber = (value) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null
  }

  return parsed
}

const normalizeDateInput = (value) => {
  const raw = String(value ?? '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return null
  }

  return raw
}

const normalizeTimeInput = (value) => {
  const raw = String(value ?? '').trim()
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(raw)) {
    return null
  }

  return raw
}

const buildDateTimeTimestamp = (dateText, timeText) => {
  const normalized = normalizeDateInput(dateText)
  const normalizedTime = normalizeTimeInput(timeText)
  if (!normalized || !normalizedTime) {
    return null
  }

  const timestamp = new Date(`${normalized}T${normalizedTime}:00`).getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

const formatBidOpeningLabel = (dateText, timeText) => {
  const timestamp = buildDateTimeTimestamp(dateText, timeText)
  if (!Number.isFinite(timestamp)) {
    return `${dateText} ${timeText}`
  }

  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

const mergeById = (priorityItems, baseItems) => {
  const seen = new Set()
  const merged = []

  for (const item of priorityItems) {
    if (!item || typeof item !== 'object') {
      continue
    }

    const key = String(item.id ?? '')
    if (key.length === 0 || seen.has(key)) {
      continue
    }

    seen.add(key)
    merged.push(item)
  }

  for (const item of baseItems) {
    if (!item || typeof item !== 'object') {
      continue
    }

    const key = String(item.id ?? '')
    if (key.length === 0 || seen.has(key)) {
      continue
    }

    seen.add(key)
    merged.push(item)
  }

  return merged
}

const companySettingsDefaults = {
  companyName: 'FleetFlow Logistics',
  legalEntityName: 'FleetFlow Logistics LLC',
  operationsEmail: DEFAULT_COMPANY_EMAIL,
  operationsPhone: '+1 (555) 010-5000',
  headquartersAddress: 'Chicago, IL',
  gstNumber: '',
  fleetSize: 0,
  dockDoors: 0,
  weeklyCapacityLoads: 25,
  preferredPaymentTerms: 'Net 15',
  defaultEquipmentType: 'Dry Van',
  defaultBidWindowMinutes: 2,
  notificationChannels: {
    inApp: true,
    email: true,
    sms: false,
  },
}

const normalizeCompanySettingsPayload = (input = {}) => {
  const merged = {
    ...companySettingsDefaults,
    ...(input && typeof input === 'object' ? input : {}),
  }

  return {
    companyName: String(merged.companyName || companySettingsDefaults.companyName).trim(),
    legalEntityName: String(merged.legalEntityName || merged.companyName || companySettingsDefaults.legalEntityName).trim(),
    operationsEmail: String(merged.operationsEmail || DEFAULT_COMPANY_EMAIL).trim().toLowerCase(),
    operationsPhone: String(merged.operationsPhone || '').trim(),
    headquartersAddress: String(merged.headquartersAddress || '').trim(),
    gstNumber: String(merged.gstNumber || '').trim(),
    fleetSize: Math.max(0, Math.round(parsePositiveNumber(merged.fleetSize) ?? 0)),
    dockDoors: Math.max(0, Math.round(parsePositiveNumber(merged.dockDoors) ?? 0)),
    weeklyCapacityLoads: Math.max(1, Math.round(parsePositiveNumber(merged.weeklyCapacityLoads) ?? 25)),
    preferredPaymentTerms: String(merged.preferredPaymentTerms || 'Net 15').trim(),
    defaultEquipmentType: String(merged.defaultEquipmentType || 'Dry Van').trim(),
    defaultBidWindowMinutes: 2,
    notificationChannels: {
      inApp: Boolean(merged.notificationChannels?.inApp ?? true),
      email: Boolean(merged.notificationChannels?.email ?? true),
      sms: Boolean(merged.notificationChannels?.sms ?? false),
    },
  }
}

const buildDashboardSnapshot = async () => {
  const sharedEntries = listDashboardEntriesFromSharedBids()
  const supabaseBids = await listLiveBidsFromSupabase()
  const supabaseEntries = {
    dispatches: [],
    orders: [],
  }

  for (const bid of supabaseBids) {
    const mapped = toDashboardRecordsFromBid(bid)
    if (mapped?.dispatch) {
      supabaseEntries.dispatches.push(mapped.dispatch)
    }

    if (mapped?.order) {
      supabaseEntries.orders.push(mapped.order)
    }
  }

  return {
    ...dashboardData,
    quickActions: (dashboardData.quickActions ?? []).filter((action) => action.id === 'create-load'),
    dispatches: mergeById(
      [...supabaseEntries.dispatches, ...sharedEntries.dispatches],
      dashboardData.dispatches ?? [],
    ),
    orders: mergeById(
      [...supabaseEntries.orders, ...sharedEntries.orders],
      dashboardData.orders ?? [],
    ),
  }
}

const normalizeRole = (role) => (role === 'driver' ? 'driver' : 'company_manager')

const toAuthUser = (entry) => {
  const email = String(entry?.email || '').trim().toLowerCase()
  const password = String(entry?.password || '').trim()
  if (!email || !password) {
    return null
  }

  return {
    id: String(entry?.id || `${entry?.role || 'company_manager'}:${email}`),
    fullName: String(entry?.full_name || entry?.fullName || 'User').trim(),
    email,
    password,
    role: normalizeRole(entry?.role),
    createdAt: String(entry?.created_at || entry?.createdAt || new Date().toISOString()),
    source: String(entry?.source || 'supabase').trim(),
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() })
})

app.get('/api/dashboard', async (_req, res) => {
  const snapshot = await buildDashboardSnapshot()
  await syncDashboardSnapshotToSupabase('dashboard', snapshot)
  res.json(snapshot)
})

app.get('/api/auth/users', async (_req, res) => {
  const users = (await listUserRegistrationsFromSupabase())
    .map(toAuthUser)
    .filter(Boolean)

  res.json({ ok: true, users })
})

app.post('/api/auth/register', async (req, res) => {
  const { fullName, email, password, role } = req.body ?? {}

  if (!email || !password) {
    res.status(400).json({
      ok: false,
      message: 'email and password are required.',
    })
    return
  }

  const normalizedUser = {
    fullName: String(fullName || 'User').trim(),
    email: String(email).trim().toLowerCase(),
    password: String(password),
    role: normalizeRole(role),
    source: 'storefront-auth',
  }

  const result = await saveUserRegistrationToSupabase(normalizedUser)
  if (!result.ok) {
    res.status(502).json({
      ok: false,
      message: 'Unable to save user in Supabase.',
      detail: result.data || null,
    })
    return
  }

  res.status(201).json({ ok: true, user: normalizedUser })
})

app.get('/api/company-settings', async (req, res) => {
  const email = String(req.query?.email || DEFAULT_COMPANY_EMAIL).trim().toLowerCase()
  const registration = await getUserRegistrationByEmailRoleFromSupabase(email, 'company_manager')
  const settings = normalizeCompanySettingsPayload(registration?.profile_data)

  res.json({
    ok: true,
    email,
    settings,
  })
})

app.post('/api/company-settings', async (req, res) => {
  const email = String(req.body?.email || DEFAULT_COMPANY_EMAIL).trim().toLowerCase()
  const settings = normalizeCompanySettingsPayload(req.body?.settings)

  const saveResult = await upsertUserProfileInSupabase({
    email,
    role: 'company_manager',
    fullName: settings.companyName,
    profileData: settings,
    source: 'dashboard-settings',
  })

  if (!saveResult.ok) {
    res.status(502).json({
      ok: false,
      message: 'Unable to save company settings.',
      detail: saveResult.data || null,
    })
    return
  }

  res.json({
    ok: true,
    email,
    settings,
  })
})

app.post('/api/create-load', async (req, res) => {
  const {
    companyManager,
    companyManagerEmail,
    sourceLocation,
    destinationLocation,
    pickupDate,
    liveBidDate,
    liveBidTime,
    destinationReachDate,
    loadType,
    equipmentType,
    loadSize,
    totalWeight,
    commodity,
    packageCount,
    basePrice,
    bidBasePrice,
    insuranceValue,
    paymentTerms,
    temperatureRequirement,
    importantNote,
    specialInstructions,
    loadPhotos,
    shipmentInvoice,
  } = req.body ?? {}

  if (!companyManager || !sourceLocation || !destinationLocation) {
    res.status(400).json({
      ok: false,
      message: 'companyManager, sourceLocation, and destinationLocation are required.',
    })
    return
  }

  const normalizedPickupDate = normalizeDateInput(pickupDate)
  const normalizedLiveBidDate = normalizeDateInput(liveBidDate)
  const normalizedLiveBidTime = normalizeTimeInput(liveBidTime)
  const normalizedDestinationReachDate = normalizeDateInput(destinationReachDate)

  if (!normalizedPickupDate || !normalizedLiveBidDate || !normalizedLiveBidTime || !normalizedDestinationReachDate) {
    res.status(400).json({
      ok: false,
      message: 'pickupDate, liveBidDate, liveBidTime, and destinationReachDate are required.',
    })
    return
  }

  const biddingStartAt = buildDateTimeTimestamp(normalizedLiveBidDate, normalizedLiveBidTime)
  if (biddingStartAt === null) {
    res.status(400).json({
      ok: false,
      message: 'Invalid live bid date/time. Use YYYY-MM-DD and HH:MM (24-hour) format.',
    })
    return
  }

  const normalizedBidRate = parsePositiveNumber(bidBasePrice)
  const normalizedBaseRate = parsePositiveNumber(basePrice)
  const askRate = normalizedBidRate ?? normalizedBaseRate

  if (askRate === null) {
    res.status(400).json({
      ok: false,
      message: 'basePrice or bidBasePrice must be a valid number.',
    })
    return
  }

  const laneMiles = 420
  const now = Date.now()
  const loadId = `LOAD-CM-${now}`
  const bidId = `BID-CM-${now}`
  const biddingEndAt = biddingStartAt + (2 * 60 * 1000)
  const bidOpeningLabel = formatBidOpeningLabel(normalizedLiveBidDate, normalizedLiveBidTime)

  const normalizedWeightLbs = parsePositiveNumber(totalWeight)
  const weightLbs = normalizedWeightLbs === null ? 12000 : Math.round(normalizedWeightLbs * 2.20462)
  const normalizedPackageCount = parsePositiveNumber(packageCount)
  const pieceCount = normalizedPackageCount === null ? 120 : Math.round(normalizedPackageCount)
  const floorRate = Math.max(Math.round(askRate * 0.9), 1)

  const managerBid = {
    id: bidId,
    sourceLoadId: loadId,
    customerName: String(companyManager).trim(),
    lane: `${String(sourceLocation).trim()} -> ${String(destinationLocation).trim()}`,
    origin: String(sourceLocation).trim(),
    destination: String(destinationLocation).trim(),
    pickupWindow: normalizedPickupDate,
    deliveryWindow: normalizedDestinationReachDate,
    laneMiles,
    askRate,
    floorRate,
    rpm: laneMiles > 0 ? askRate / laneMiles : 0,
    urgency: 'Medium',
    bidType: 'Spot',
    equipment: String(equipmentType || 'Dry Van').trim(),
    region: String(destinationLocation).trim(),
    portalPublishedAt: now,
    biddingStartAt,
    biddingEndAt,
    score: 82,
    weightLbs,
    dimensions: String(loadSize || '53 ft x 8.5 ft x 9 ft').trim(),
    lengthFt: 53,
    widthFt: 8.5,
    heightFt: 9,
    palletCount: Math.max(1, Math.round(pieceCount / 12)),
    pieceCount,
    commodity: String(commodity || 'General Merchandise').trim(),
    handlingNotes: 'Follow shipment instructions from company manager.',
    requiresHazmat: false,
    temperatureControl: String(temperatureRequirement || '').trim().length > 0,
    requiresTeamDriver: false,
    loadPhotos: Array.isArray(loadPhotos) ? loadPhotos : [],
    note: `New company load posted. Type: ${String(loadType || 'Full Truckload (FTL)').trim()} | Live bid opens at ${bidOpeningLabel} | Payment: ${String(paymentTerms || 'Net 15').trim()}`,
    auctionState: {
      status: now >= biddingStartAt ? 'open' : 'scheduled',
      opensAt: biddingStartAt,
      closesAt: biddingEndAt,
      bids: [],
      leaderboard: [],
      winner: null,
      closedAt: null,
    },
    shipmentState: {
      status: 'Unassigned',
      assignedAt: null,
      pickupReachedAt: null,
      destinationReachedAt: null,
      podSubmittedAt: null,
      podApprovedAt: null,
      paymentReleasedAt: null,
    },
    managerInput: {
      companyManager: String(companyManager).trim(),
      managerEmail: String(companyManagerEmail || DEFAULT_COMPANY_EMAIL).trim().toLowerCase(),
      sourceLocation: String(sourceLocation).trim(),
      destinationLocation: String(destinationLocation).trim(),
      pickupDate: normalizedPickupDate,
      liveBidDate: normalizedLiveBidDate,
      liveBidTime: normalizedLiveBidTime,
      liveBidDateTime: `${normalizedLiveBidDate}T${normalizedLiveBidTime}:00`,
      destinationReachDate: normalizedDestinationReachDate,
      loadType: String(loadType || 'Full Truckload (FTL)').trim(),
      equipmentType: String(equipmentType || 'Dry Van').trim(),
      loadSize: String(loadSize || '').trim(),
      totalWeight: parsePositiveNumber(totalWeight),
      commodity: String(commodity || '').trim(),
      packageCount: parsePositiveNumber(packageCount),
      basePrice: normalizedBaseRate,
      bidBasePrice: normalizedBidRate,
      insuranceValue: parsePositiveNumber(insuranceValue),
      paymentTerms: String(paymentTerms || 'Net 15').trim(),
      temperatureRequirement: String(temperatureRequirement || '').trim(),
      importantNote: String(importantNote || '').trim(),
      specialInstructions: String(specialInstructions || '').trim(),
      shipmentInvoice: shipmentInvoice ?? null,
    },
    createdAt: new Date(now).toISOString(),
  }

  appendSharedLiveBid(managerBid)
  await saveLiveBidToSupabase(managerBid)

  const mapped = toDashboardRecordsFromBid(managerBid)
  const dashboardSnapshot = await buildDashboardSnapshot()
  await syncDashboardSnapshotToSupabase('dashboard', dashboardSnapshot)

  res.status(201).json({
    ok: true,
    bid: managerBid,
    dispatch: mapped.dispatch,
    order: mapped.order,
    dashboard: dashboardSnapshot,
  })
})

app.listen(port, () => {
  console.log(`Dashboard API is running on http://localhost:${port}`)
})
