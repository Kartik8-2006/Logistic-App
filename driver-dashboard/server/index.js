import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { dashboardData } from './dashboardData.js'
import { listSharedLiveBids, upsertSharedLiveBid } from './sharedState.js'
import {
  getLiveBidFromSupabase,
  getUserRegistrationByEmailRoleFromSupabase,
  listLiveBidsFromSupabase,
  saveDriverLocationToSupabase,
  saveDriverMessageToSupabase,
  saveLiveBidToSupabase,
  syncDashboardSnapshotToSupabase,
  upsertUserProfileInSupabase,
} from './supabaseStore.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT) || 5001
const DEFAULT_DRIVER_EMAIL = 'driver@manifestdrives.com'

const driverLocationStore = {
  latest: null,
  history: [],
}

const driverMessageStore = {
  latest: null,
  history: [],
}

app.use(cors())
app.use(express.json())

const mergeById = (priorityItems, baseItems) => {
  const seen = new Set()
  const merged = []

  for (const item of priorityItems) {
    if (!item || typeof item !== 'object') {
      continue
    }

    const key = String(item.id ?? '')
    if (!key || seen.has(key)) {
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
    if (!key || seen.has(key)) {
      continue
    }

    seen.add(key)
    merged.push(item)
  }

  return merged
}

const asPositiveNumber = (value) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

const buildLeaderboard = (bids = []) => {
  return [...bids]
    .filter((entry) => asPositiveNumber(entry.amount) !== null)
    .sort((left, right) => {
      const leftAmount = Number(left.amount)
      const rightAmount = Number(right.amount)
      if (leftAmount !== rightAmount) {
        return leftAmount - rightAmount
      }

      const leftTime = new Date(left.submittedAt || 0).getTime() || 0
      const rightTime = new Date(right.submittedAt || 0).getTime() || 0
      return leftTime - rightTime
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))
}

const getAuctionWindow = (bid) => {
  const start = Number(bid?.auctionState?.opensAt ?? bid?.biddingStartAt)
  const fallbackStart = Number.isFinite(start) ? start : Date.now()
  const end = Number(bid?.auctionState?.closesAt ?? bid?.biddingEndAt)
  const fallbackEnd = Number.isFinite(end) ? end : fallbackStart + (2 * 60 * 1000)

  return {
    opensAt: fallbackStart,
    closesAt: fallbackEnd,
  }
}

const normalizeAuctionState = (bid) => {
  const { opensAt, closesAt } = getAuctionWindow(bid)
  const bids = Array.isArray(bid?.auctionState?.bids) ? bid.auctionState.bids : []
  const leaderboard = buildLeaderboard(bids)
  const winner = bid?.auctionState?.winner ?? null
  const now = Date.now()

  let status = 'scheduled'
  if (now >= closesAt) {
    status = 'closed'
  } else if (now >= opensAt) {
    status = 'open'
  }

  return {
    status,
    opensAt,
    closesAt,
    bids,
    leaderboard,
    winner,
    closedAt: bid?.auctionState?.closedAt ?? null,
  }
}

const finalizeAuction = (bid, options = {}) => {
  const now = Date.now()
  const auctionState = normalizeAuctionState(bid)
  const leaderboard = auctionState.leaderboard
  const winner = leaderboard[0]
    ? {
      driverId: winner.driverId,
      driverName: winner.driverName,
      driverEmail: winner.driverEmail,
      amount: winner.amount,
      selectedAt: options.selectedAt || new Date(now).toISOString(),
      reason: options.reason || 'lowest-bid',
    }
    : null

  const shipmentState = {
    ...(bid?.shipmentState || {}),
    status: winner ? 'Assigned' : (bid?.shipmentState?.status || 'Unassigned'),
    assignedAt: winner ? (bid?.shipmentState?.assignedAt || new Date(now).toISOString()) : (bid?.shipmentState?.assignedAt || null),
    assignedDriverId: winner?.driverId ?? null,
    assignedDriverName: winner?.driverName ?? null,
    assignedDriverEmail: winner?.driverEmail ?? null,
    pickupReachedAt: bid?.shipmentState?.pickupReachedAt ?? null,
    destinationReachedAt: bid?.shipmentState?.destinationReachedAt ?? null,
    podSubmittedAt: bid?.shipmentState?.podSubmittedAt ?? null,
    podApprovedAt: bid?.shipmentState?.podApprovedAt ?? null,
    paymentReleasedAt: bid?.shipmentState?.paymentReleasedAt ?? null,
  }

  return {
    ...bid,
    auctionState: {
      ...auctionState,
      status: 'closed',
      winner,
      closedAt: bid?.auctionState?.closedAt || new Date(now).toISOString(),
    },
    shipmentState,
  }
}

const findBidAcrossSources = async (bidId) => {
  const fromSupabase = await getLiveBidFromSupabase(bidId)
  if (fromSupabase) {
    return fromSupabase
  }

  const fromShared = listSharedLiveBids().find((entry) => String(entry?.id) === String(bidId))
  return fromShared ?? null
}

const persistLiveBidState = async (bid) => {
  await saveLiveBidToSupabase(bid)

  try {
    upsertSharedLiveBid(bid)
  } catch (error) {
    console.error('Failed to upsert shared live bid:', error)
  }
}

const hasDriverConflictForPickupDate = async ({ driverEmail, pickupWindow, currentBidId }) => {
  const normalizedEmail = String(driverEmail || '').trim().toLowerCase()
  if (!normalizedEmail || !pickupWindow) {
    return false
  }

  const liveBids = await listLiveBidsFromSupabase()
  return liveBids.some((entry) => {
    if (!entry || String(entry.id) === String(currentBidId)) {
      return false
    }

    const samePickupDate = String(entry.pickupWindow || '').trim() === String(pickupWindow).trim()
    if (!samePickupDate) {
      return false
    }

    const assignedDriverEmail = String(entry?.shipmentState?.assignedDriverEmail || '').trim().toLowerCase()
    const winnerEmail = String(entry?.auctionState?.winner?.driverEmail || '').trim().toLowerCase()

    return assignedDriverEmail === normalizedEmail || winnerEmail === normalizedEmail
  })
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() })
})

app.get('/api/dashboard', async (_req, res) => {
  await syncDashboardSnapshotToSupabase('driver-dashboard', dashboardData)
  res.json(dashboardData)
})

app.get('/api/live-bids', async (_req, res) => {
  const bidsFromSupabase = await listLiveBidsFromSupabase()
  const bidsFromSharedFile = listSharedLiveBids()

  res.json({
    ok: true,
    bids: mergeById(bidsFromSupabase, bidsFromSharedFile),
  })
})

app.get('/api/live-bids/:bidId/leaderboard', async (req, res) => {
  const bid = await findBidAcrossSources(req.params.bidId)
  if (!bid) {
    res.status(404).json({ ok: false, message: 'Bid not found.' })
    return
  }

  const auctionState = normalizeAuctionState(bid)
  const payload = auctionState.status === 'closed' ? finalizeAuction(bid, { reason: 'auto-close-read' }) : { ...bid, auctionState }

  if (payload.auctionState.status === 'closed') {
    await persistLiveBidState(payload)
  }

  res.json({
    ok: true,
    bidId: payload.id,
    auctionState: payload.auctionState,
    leaderboard: payload.auctionState.leaderboard,
    winner: payload.auctionState.winner,
  })
})

app.post('/api/live-bids/:bidId/place-bid', async (req, res) => {
  const bidId = String(req.params.bidId || '').trim()
  const amount = asPositiveNumber(req.body?.amount)
  const driverName = String(req.body?.driverName || 'Driver').trim()
  const driverId = String(req.body?.driverId || `driver-${Date.now()}`).trim()
  const driverEmail = String(req.body?.driverEmail || '').trim().toLowerCase()

  if (!bidId || !amount) {
    res.status(400).json({ ok: false, message: 'bidId and positive amount are required.' })
    return
  }

  const baseBid = await findBidAcrossSources(bidId)
  if (!baseBid) {
    res.status(404).json({ ok: false, message: 'Bid not found.' })
    return
  }

  const { opensAt, closesAt } = getAuctionWindow(baseBid)
  const now = Date.now()

  if (now < opensAt) {
    res.status(409).json({
      ok: false,
      message: 'Bidding window has not opened yet.',
      opensAt,
      closesAt,
    })
    return
  }

  if (now >= closesAt) {
    const closedBid = finalizeAuction(baseBid, { reason: 'window-elapsed' })
    await persistLiveBidState(closedBid)
    res.status(409).json({
      ok: false,
      message: 'Bidding window is already closed.',
      winner: closedBid.auctionState.winner,
      leaderboard: closedBid.auctionState.leaderboard,
    })
    return
  }

  const hasConflict = await hasDriverConflictForPickupDate({
    driverEmail,
    pickupWindow: baseBid.pickupWindow,
    currentBidId: baseBid.id,
  })

  if (hasConflict) {
    res.status(409).json({
      ok: false,
      message: 'Capacity conflict: this driver already has an assigned load for the same pickup date.',
    })
    return
  }

  const auctionState = normalizeAuctionState(baseBid)
  const existing = auctionState.bids.filter((entry) => {
    if (driverEmail) {
      return String(entry.driverEmail || '').trim().toLowerCase() !== driverEmail
    }

    return String(entry.driverId || '') !== driverId
  })

  existing.push({
    driverId,
    driverName,
    driverEmail,
    amount: Math.round(amount),
    submittedAt: new Date(now).toISOString(),
  })

  const nextAuctionState = {
    ...auctionState,
    status: 'open',
    bids: existing,
    leaderboard: buildLeaderboard(existing),
    winner: null,
  }

  const bidWithLiveAuction = {
    ...baseBid,
    auctionState: nextAuctionState,
  }

  await persistLiveBidState(bidWithLiveAuction)

  res.json({
    ok: true,
    bidId,
    auctionState: nextAuctionState,
    leaderboard: nextAuctionState.leaderboard,
  })
})

app.post('/api/live-bids/:bidId/close', async (req, res) => {
  const bidId = String(req.params.bidId || '').trim()
  if (!bidId) {
    res.status(400).json({ ok: false, message: 'bidId is required.' })
    return
  }

  const bid = await findBidAcrossSources(bidId)
  if (!bid) {
    res.status(404).json({ ok: false, message: 'Bid not found.' })
    return
  }

  const closedBid = finalizeAuction(bid, {
    reason: String(req.body?.reason || 'manual-close').trim(),
  })

  await persistLiveBidState(closedBid)

  res.json({
    ok: true,
    bidId,
    auctionState: closedBid.auctionState,
    winner: closedBid.auctionState.winner,
    shipmentState: closedBid.shipmentState,
  })
})

app.post('/api/live-bids/:bidId/mark-milestone', async (req, res) => {
  const bidId = String(req.params.bidId || '').trim()
  const milestone = String(req.body?.milestone || '').trim()
  const at = String(req.body?.at || new Date().toISOString()).trim()

  const milestoneMap = {
    pickup_reached: { field: 'pickupReachedAt', status: 'In Transit' },
    destination_reached: { field: 'destinationReachedAt', status: 'Destination Reached' },
    pod_submitted: { field: 'podSubmittedAt', status: 'POD Submitted' },
    pod_approved: { field: 'podApprovedAt', status: 'POD Approved' },
    payment_released: { field: 'paymentReleasedAt', status: 'Paid' },
  }

  if (!milestoneMap[milestone]) {
    res.status(400).json({ ok: false, message: 'Invalid milestone.' })
    return
  }

  const bid = await findBidAcrossSources(bidId)
  if (!bid) {
    res.status(404).json({ ok: false, message: 'Bid not found.' })
    return
  }

  const milestoneMeta = milestoneMap[milestone]
  const shipmentState = {
    ...(bid.shipmentState || {}),
    [milestoneMeta.field]: at,
    status: milestoneMeta.status,
  }

  const updatedBid = {
    ...bid,
    shipmentState,
  }

  await persistLiveBidState(updatedBid)

  res.json({
    ok: true,
    bidId,
    shipmentState,
  })
})

app.post('/api/driver-location', async (req, res) => {
  const {
    shipmentId,
    loadId,
    driver,
    latitude,
    longitude,
    speedMph,
    recordedAt,
    source,
  } = req.body ?? {}

  const parsedLatitude = Number(latitude)
  const parsedLongitude = Number(longitude)

  if (!shipmentId || !driver || !Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) {
    res.status(400).json({
      ok: false,
      message: 'shipmentId, driver, latitude, and longitude are required.',
    })
    return
  }

  const parsedSpeed = Number(speedMph)
  const locationRecord = {
    id: `loc-${Date.now()}`,
    shipmentId,
    loadId: loadId ?? shipmentId,
    driver,
    latitude: parsedLatitude,
    longitude: parsedLongitude,
    speedMph: Number.isFinite(parsedSpeed) ? Math.max(0, Math.round(parsedSpeed)) : 0,
    recordedAt: recordedAt ?? new Date().toISOString(),
    source: source ?? 'current-shipment',
    receivedAt: new Date().toISOString(),
  }

  driverLocationStore.latest = locationRecord
  driverLocationStore.history.unshift(locationRecord)
  if (driverLocationStore.history.length > 200) {
    driverLocationStore.history.pop()
  }

  await saveDriverLocationToSupabase(locationRecord)

  res.json({
    ok: true,
    receivedAt: locationRecord.receivedAt,
    record: locationRecord,
  })
})

app.get('/api/driver-location/latest', (_req, res) => {
  res.json({
    ok: true,
    latest: driverLocationStore.latest,
    updatesCount: driverLocationStore.history.length,
  })
})

app.post('/api/driver-message', async (req, res) => {
  const {
    shipmentId,
    loadId,
    driver,
    message,
    category,
    priority,
    sentAt,
  } = req.body ?? {}

  const cleanMessage = String(message ?? '').trim()
  if (!shipmentId || !driver || cleanMessage.length === 0) {
    res.status(400).json({
      ok: false,
      message: 'shipmentId, driver, and message are required.',
    })
    return
  }

  const payload = {
    id: `msg-${Date.now()}`,
    shipmentId,
    loadId: loadId ?? shipmentId,
    driver,
    message: cleanMessage,
    category: category ?? 'general',
    priority: priority ?? 'normal',
    sentAt: sentAt ?? new Date().toISOString(),
    receivedAt: new Date().toISOString(),
  }

  driverMessageStore.latest = payload
  driverMessageStore.history.unshift(payload)
  if (driverMessageStore.history.length > 100) {
    driverMessageStore.history.pop()
  }

  await saveDriverMessageToSupabase(payload)

  res.json({
    ok: true,
    receivedAt: payload.receivedAt,
    record: payload,
  })
})

app.get('/api/driver-message/latest', (_req, res) => {
  res.json({
    ok: true,
    latest: driverMessageStore.latest,
    totalMessages: driverMessageStore.history.length,
  })
})

app.get('/api/driver-settings', async (req, res) => {
  const email = String(req.query?.email || DEFAULT_DRIVER_EMAIL).trim().toLowerCase()
  const registration = await getUserRegistrationByEmailRoleFromSupabase(email, 'driver')

  res.json({
    ok: true,
    email,
    settings: registration?.profile_data || {},
  })
})

app.post('/api/driver-settings', async (req, res) => {
  const email = String(req.body?.email || DEFAULT_DRIVER_EMAIL).trim().toLowerCase()
  const settings = req.body?.settings && typeof req.body.settings === 'object' ? req.body.settings : {}

  const saveResult = await upsertUserProfileInSupabase({
    email,
    role: 'driver',
    fullName: String(settings.fullName || 'Driver').trim(),
    profileData: settings,
    source: 'driver-settings',
  })

  if (!saveResult.ok) {
    res.status(502).json({
      ok: false,
      message: 'Unable to save driver settings.',
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

app.listen(port, () => {
  console.log(`Dashboard API is running on http://localhost:${port}`)
})
