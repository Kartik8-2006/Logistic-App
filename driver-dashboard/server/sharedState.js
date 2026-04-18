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

const ensureStore = () => {
	if (!fs.existsSync(sharedDirectory)) {
		fs.mkdirSync(sharedDirectory, { recursive: true })
	}

	if (!fs.existsSync(sharedFilePath)) {
		fs.writeFileSync(sharedFilePath, JSON.stringify(emptyStore, null, 2), 'utf-8')
	}
}

export const listSharedLiveBids = () => {
	const { bids } = readStore()
	return bids
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
		// Ignore read/parse failures and fallback to empty store.
	}

	return { ...emptyStore }
}

const writeStore = (store) => {
	ensureStore()
	fs.writeFileSync(sharedFilePath, JSON.stringify(store, null, 2), 'utf-8')
}

export const upsertSharedLiveBid = (bid) => {
	const store = readStore()
	const nextBids = [
		bid,
		...store.bids.filter((existingBid) => existingBid?.id !== bid?.id),
	]

	writeStore({ bids: nextBids })

	return nextBids
}
