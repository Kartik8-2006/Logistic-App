import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { dashboardData } from './dashboardData.js'
import {
  deleteUserRegistrationFromSupabase,
  listLiveBidsFromSupabase,
  listUserRegistrationsFromSupabase,
  syncDashboardSnapshotToSupabase,
} from './supabaseStore.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT) || 5002

app.use(cors())
app.use(express.json())

const normalizeRole = (role) => (role === 'driver' ? 'driver' : 'company_manager')

const compactKeyFromEmail = (email) => String(email ?? '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '')
  .slice(0, 12)

const titleFromRegistration = (registration) => {
  const fullName = String(registration?.full_name || registration?.fullName || '').trim()
  if (fullName) {
    return fullName
  }

  const email = String(registration?.email || '').trim()
  if (!email.includes('@')) {
    return 'New User'
  }

  const localPart = email.split('@')[0]
  return localPart
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join(' ') || 'New User'
}

const toAdminDriverRecord = (registration, index) => {
  const email = String(registration?.email || '').trim().toLowerCase()
  const key = compactKeyFromEmail(email) || String(index + 1).padStart(3, '0')
  const profile = registration?.profile_data && typeof registration.profile_data === 'object'
    ? registration.profile_data
    : {}

  const readyForDispatch = Boolean(profile.readyForDispatch ?? true)
  const driverStatus = readyForDispatch ? 'Available' : 'Off Duty'

  return {
    id: `DRV-SB-${key}`,
    userId: String(registration?.id || `driver:${email}`),
    name: titleFromRegistration(registration),
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop',
    licenseType: String(profile.licenseType || 'CDL Class A').trim(),
    experience: String(profile.experience || 'Newly registered').trim(),
    status: driverStatus,
    statusTone: readyForDispatch ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700',
    hosRisk: String(profile.hosRisk || 'Low').trim(),
    hosRiskTone: String(profile.hosRisk || 'Low').trim() === 'High' ? 'bg-rose-400' : String(profile.hosRisk || 'Low').trim() === 'Medium' ? 'bg-amber-400' : 'bg-emerald-400',
    rating: Number.isFinite(Number(profile.rating)) ? Number(profile.rating) : 4.5,
    lastTrip: {
      route: String(profile.lastRoute || 'Awaiting first assignment'),
      status: 'Registered via storefront',
    },
    currentLocation: {
      city: String(profile.homeTerminal || 'Unassigned').trim(),
      terminal: 'Driver profile sync',
    },
    contact: {
      phone: String(profile.phone || 'N/A').trim(),
      email,
    },
    profileSnapshot: profile,
  }
}

const toWarehouseCardRecord = (registration, index) => {
  const email = String(registration?.email || '').trim().toLowerCase()
  const key = compactKeyFromEmail(email) || String(index + 1)
  const profile = registration?.profile_data && typeof registration.profile_data === 'object'
    ? registration.profile_data
    : {}

  const fleetSize = Number.isFinite(Number(profile.fleetSize)) ? Number(profile.fleetSize) : 0
  const dockDoors = Number.isFinite(Number(profile.dockDoors)) ? Number(profile.dockDoors) : 0
  const weeklyCapacityLoads = Number.isFinite(Number(profile.weeklyCapacityLoads)) ? Number(profile.weeklyCapacityLoads) : 25
  const utilization = Math.max(20, Math.min(95, Math.round(40 + (weeklyCapacityLoads * 1.2))))

  return {
    id: `WH-SB-${key}`,
    userId: String(registration?.id || `company_manager:${email}`),
    name: String(profile.companyName || `${titleFromRegistration(registration)} Hub`).trim(),
    address: String(profile.headquartersAddress || email).trim(),
    status: 'Active',
    statusBg: 'bg-[#ebfdf5] text-[#10b981]',
    utilization,
    utilColor: utilization >= 85 ? 'bg-[#ef4444]' : utilization >= 70 ? 'bg-[#f59e0b]' : 'bg-[#10b981]',
    inbound: String(Math.max(0, Math.round(weeklyCapacityLoads * 0.55))),
    outbound: String(Math.max(0, Math.round(weeklyCapacityLoads * 0.45))),
    onHand: String(Math.max(0, fleetSize * 18)),
    dockStatus: dockDoors > 0 ? `${dockDoors} Configured` : 'Pending setup',
    dockTone: dockDoors > 0 ? 'bg-[#10b981]' : 'bg-[#f59e0b]',
    dockText: dockDoors > 0 ? 'text-[#10b981]' : 'text-[#f59e0b]',
    yardStatus: fleetSize > 0 ? 'Active' : 'New',
    yardTone: fleetSize > 0 ? 'bg-[#3b82f6]' : 'bg-[#10b981]',
    yardText: fleetSize > 0 ? 'text-[#3b82f6]' : 'text-[#10b981]',
    appointments: `${Math.max(0, Math.round(weeklyCapacityLoads * 0.5))} In / ${Math.max(0, Math.round(weeklyCapacityLoads * 0.5))} Out`,
    companyProfile: {
      legalEntityName: String(profile.legalEntityName || '').trim(),
      operationsEmail: String(profile.operationsEmail || email).trim(),
      operationsPhone: String(profile.operationsPhone || '').trim(),
      gstNumber: String(profile.gstNumber || '').trim(),
      preferredPaymentTerms: String(profile.preferredPaymentTerms || 'Net 15').trim(),
      defaultEquipmentType: String(profile.defaultEquipmentType || 'Dry Van').trim(),
      fleetSize,
      dockDoors,
      weeklyCapacityLoads,
    },
  }
}

const mergeUsersIntoDashboardData = (baseData, registrations, liveBids) => {
  const normalizedRegistrations = Array.isArray(registrations)
    ? registrations.filter((entry) => entry && entry.email)
    : []

  const existingDriverEmails = new Set(
    (baseData?.drivers || [])
      .map((driver) => String(driver?.contact?.email || '').trim().toLowerCase())
      .filter(Boolean),
  )

  const driverRegistrations = normalizedRegistrations
    .filter((entry) => normalizeRole(entry.role) === 'driver')
    .filter((entry) => !existingDriverEmails.has(String(entry.email).trim().toLowerCase()))

  const warehouseRegistrations = normalizedRegistrations
    .filter((entry) => normalizeRole(entry.role) === 'company_manager')

  const supabaseDrivers = driverRegistrations.map(toAdminDriverRecord)
  const supabaseWarehouses = warehouseRegistrations.map(toWarehouseCardRecord)
  const mergedDrivers = [...supabaseDrivers, ...(baseData?.drivers || [])]

  const totalDrivers = mergedDrivers.length
  const availableDrivers = mergedDrivers.filter((driver) => driver.status === 'Available').length

  const driverSummary = Array.isArray(baseData?.driverSummary)
    ? baseData.driverSummary.map((summaryCard) => {
      if (summaryCard.id === 'total-drivers') {
        return { ...summaryCard, value: String(totalDrivers) }
      }

      if (summaryCard.id === 'available-now') {
        return { ...summaryCard, value: String(availableDrivers) }
      }

      return summaryCard
    })
    : []

  const lifecycleTimeline = (Array.isArray(liveBids) ? liveBids : [])
    .filter((bid) => bid?.shipmentState?.destinationReachedAt || bid?.shipmentState?.paymentReleasedAt)
    .map((bid) => ({
      bidId: bid.id,
      loadId: bid.sourceLoadId || bid.id,
      destinationReachedAt: bid?.shipmentState?.destinationReachedAt || null,
      paymentReleasedAt: bid?.shipmentState?.paymentReleasedAt || null,
      assignedDriverName: bid?.shipmentState?.assignedDriverName || bid?.auctionState?.winner?.driverName || 'Unassigned',
      assignedDriverEmail: bid?.shipmentState?.assignedDriverEmail || bid?.auctionState?.winner?.driverEmail || null,
    }))

  return {
    ...baseData,
    driverSummary,
    drivers: mergedDrivers,
    supabaseWarehouses,
    lifecycleTimeline,
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() })
})

app.get('/api/dashboard', async (_req, res) => {
  const [registrations, liveBids] = await Promise.all([
    listUserRegistrationsFromSupabase(),
    listLiveBidsFromSupabase(),
  ])

  const snapshot = mergeUsersIntoDashboardData(dashboardData, registrations, liveBids)
  await syncDashboardSnapshotToSupabase('admin-dashboard', snapshot)
  res.json(snapshot)
})

app.delete('/api/admin/users/:userId', async (req, res) => {
  const userId = String(req.params?.userId || '').trim()
  if (!userId) {
    res.status(400).json({ ok: false, message: 'userId is required.' })
    return
  }

  const deleteResult = await deleteUserRegistrationFromSupabase(userId)
  if (!deleteResult.ok) {
    res.status(502).json({
      ok: false,
      message: 'Unable to delete user profile.',
      detail: deleteResult.data || null,
    })
    return
  }

  res.json({
    ok: true,
    userId,
  })
})

app.listen(port, () => {
  console.log(`Dashboard API is running on http://localhost:${port}`)
})
