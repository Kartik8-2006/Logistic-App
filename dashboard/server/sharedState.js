import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sharedDirectory = path.resolve(__dirname, '..', '..', 'shared')
const sharedFilePath = path.join(sharedDirectory, 'live-bids.json')

const emptyStore = {
	bids: [],
}

const customerTonePalette = [
	'bg-blue-600',
	'bg-rose-600',
	'bg-emerald-600',
	'bg-indigo-600',
	'bg-orange-500',
	'bg-slate-700',
]

const ensureStore = () => {
	if (!fs.existsSync(sharedDirectory)) {
		fs.mkdirSync(sharedDirectory, { recursive: true })
	}

	if (!fs.existsSync(sharedFilePath)) {
		fs.writeFileSync(sharedFilePath, JSON.stringify(emptyStore, null, 2), 'utf-8')
	}
}

const readStore = () => {
	ensureStore()

	try {
		const raw = fs.readFileSync(sharedFilePath, 'utf-8')
		const parsed = JSON.parse(raw)
		if (Array.isArray(parsed?.bids)) {
			return {
				bids: parsed.bids,
			}
		}
	} catch {
		// Ignore parse/read errors and fallback to an empty store.
	}

	return { ...emptyStore }
}

const writeStore = (store) => {
	ensureStore()
	fs.writeFileSync(sharedFilePath, JSON.stringify(store, null, 2), 'utf-8')
}

const toNumberOrNull = (value) => {
	const parsed = Number(value)
	return Number.isFinite(parsed) ? parsed : null
}

const formatCurrency = (value) => {
	const parsed = Number(value)
	if (!Number.isFinite(parsed)) {
		return '--'
	}

	return `$${Math.round(parsed).toLocaleString('en-US')}`
}

const buildCustomerCode = (customerName) => {
	const parts = String(customerName ?? '')
		.trim()
		.split(/\s+/)
		.filter(Boolean)

	if (parts.length === 0) {
		return 'CM'
	}

	return parts
		.slice(0, 2)
		.map((part) => part[0])
		.join('')
		.toUpperCase()
}

const pickCustomerTone = (id) => {
	const raw = String(id ?? '')
	const checksum = raw
		.split('')
		.reduce((total, char) => total + char.charCodeAt(0), 0)

	return customerTonePalette[checksum % customerTonePalette.length]
}

const parseWeightLbs = (managerInput, fallbackWeightLbs) => {
	if (Number.isFinite(Number(fallbackWeightLbs))) {
		return Math.max(1, Math.round(Number(fallbackWeightLbs)))
	}

	const totalWeightKg = toNumberOrNull(managerInput?.totalWeight)
	if (totalWeightKg === null) {
		return 12000
	}

	return Math.max(1, Math.round(totalWeightKg * 2.20462))
}

const asPositiveNumber = (value) => {
	const parsed = Number(value)
	if (!Number.isFinite(parsed) || parsed <= 0) {
		return null
	}

	return parsed
}

const resolveAuctionWinner = (bid) => {
	const auctionState = bid?.auctionState ?? {}
	const closesAt = Number(auctionState?.closesAt ?? bid?.biddingEndAt)
	const closedByStatus = String(auctionState?.status ?? '').toLowerCase() === 'closed'
	const closedByTime = Number.isFinite(closesAt) ? Date.now() >= closesAt : false
	const isClosed = closedByStatus || closedByTime

	const rankedBids = (Array.isArray(auctionState?.bids) ? auctionState.bids : [])
		.filter((entry) => asPositiveNumber(entry?.amount) !== null)
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

	const explicitWinner = auctionState?.winner && typeof auctionState.winner === 'object'
		? auctionState.winner
		: null

	if (explicitWinner) {
		return explicitWinner
	}

	if (isClosed && rankedBids[0]) {
		return rankedBids[0]
	}

	return null
}

export const listSharedLiveBids = () => {
	const { bids } = readStore()
	return bids
}

export const appendSharedLiveBid = (bid) => {
	const store = readStore()
	const nextBids = [
		bid,
		...store.bids.filter((existingBid) => existingBid?.id !== bid?.id),
	]

	writeStore({ bids: nextBids })

	return nextBids
}

export const toDashboardRecordsFromBid = (bid) => {
	const managerInput = bid?.managerInput ?? {}
	const sourceLoadId = String(bid?.sourceLoadId ?? bid?.id ?? `LOAD-CM-${Date.now()}`)
	const customerName = String(bid?.customerName ?? managerInput.companyManager ?? 'Company Manager')
	const origin = String(bid?.origin ?? managerInput.sourceLocation ?? 'Source')
	const destination = String(bid?.destination ?? managerInput.destinationLocation ?? 'Destination')
	const priority = String(bid?.urgency ?? 'Medium')
	const askRate = toNumberOrNull(bid?.askRate)
	const shipmentState = bid?.shipmentState ?? {}
	const resolvedWinner = resolveAuctionWinner(bid)
	const shipmentStatus = String(shipmentState?.status ?? '').trim()
	const normalizedShipmentStatus = shipmentStatus.toLowerCase()
	const assignedDriverName = String(shipmentState?.assignedDriverName ?? '').trim()
	const winnerDriverName = String(resolvedWinner?.driverName ?? '').trim()
	const winnerAmount = asPositiveNumber(resolvedWinner?.amount)

	const status = shipmentStatus && normalizedShipmentStatus !== 'unassigned'
		? shipmentStatus
		: (assignedDriverName || winnerDriverName ? 'Assigned' : 'Unassigned')
	const driver = assignedDriverName || winnerDriverName || 'Not assigned'
	const truck = String(shipmentState?.assignedTruck ?? '').trim() || '-'
	const effectiveRate = winnerAmount ?? askRate
	const defaultNotes = managerInput?.importantNote || bid?.note || 'Created by manager and waiting for assignment.'
	const notes = winnerAmount && (assignedDriverName || winnerDriverName)
		? `${defaultNotes} Winner ${driver} at ${formatCurrency(winnerAmount)}.`
		: defaultNotes

	const order = {
		id: sourceLoadId,
		customerName,
		customerType: 'Manager Created Load',
		customerCode: buildCustomerCode(customerName),
		customerTone: pickCustomerTone(sourceLoadId),
		origin,
		destination,
		eta: bid?.deliveryWindow || 'TBD',
		status,
		priority,
		driver,
		truck,
		rate: formatCurrency(effectiveRate),
		margin: '--',
		pod: false,
		loadType: managerInput?.equipmentType || bid?.equipment || 'Dry Van',
	}

	const dispatch = {
		id: sourceLoadId,
		route: `${origin} - ${destination}`,
		driver,
		status,
		pickupDate: bid?.pickupWindow || 'TBD',
		pickupTime: '--',
		deliveryDate: bid?.deliveryWindow || 'TBD',
		deliveryTime: '--',
		price: formatCurrency(effectiveRate),
		truck,
		customer: customerName,
		loadType: managerInput?.equipmentType || bid?.equipment || 'Dry Van',
		priority,
		notes,
	}

	return {
		order,
		dispatch,
	}
}

export const listDashboardEntriesFromSharedBids = () => {
	const bids = listSharedLiveBids()

	const records = bids.map((bid) => {
		const normalizedBid = {
			...bid,
			weightLbs: parseWeightLbs(bid?.managerInput, bid?.weightLbs),
		}
		return toDashboardRecordsFromBid(normalizedBid)
	})

	return {
		orders: records.map((entry) => entry.order),
		dispatches: records.map((entry) => entry.dispatch),
	}
}
