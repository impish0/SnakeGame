import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './index.css'

type SnakeType = 'classic' | 'stripe' | 'neon';

type User = {
	id: string
	username: string
	snakeColor: string
	snakeType: SnakeType
}

// Game constants
const GRID_SIZE = 20
const COLS = 32
const ROWS = 24
const FOOD_COUNT = 5
const MAX_ENEMIES = 10
const ENEMY_AI_FOOD_CHASE_CHANCE = 0.7
const SPAWN_SAFE_DISTANCE = 3
const SPAWN_MAX_ATTEMPTS = 50
const ENEMY_COLORS = ['#ff6b6b', '#7c3aed', '#00eaff', '#ffe600', '#ff1aff']

const SNAKE_TYPES: { id: SnakeType; label: string }[] = [
	{ id: 'classic', label: 'Classic' },
	{ id: 'stripe', label: 'Stripe' },
	{ id: 'neon', label: 'Neon' },
]

const PALETTE = ['#39ff14', '#ff1aff', '#00eaff', '#ffe600', '#ff6b6b', '#7c3aed']

function getApiBase() {
  const runtime = (typeof window !== 'undefined' && (window as Window).__SNAKE_CONFIG__?.apiBaseUrl) as string | undefined
  const envBase = (import.meta.env.VITE_API_URL as string | undefined)
  const devDefault = import.meta.env.DEV ? 'http://localhost:4000' : ''
  const base = runtime || envBase || devDefault || ''
  return base.endsWith('/') ? base.slice(0, -1) : base
}

export default function App() {
	const [username, setUsername] = useState('')
	const [user, setUser] = useState<User | null>(null)
	const [snakeColor, setSnakeColor] = useState(PALETTE[0])
	const [snakeType, setSnakeType] = useState<SnakeType>('classic')
	const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu')
	const [score, setScore] = useState(0)
	const [leaderboard, setLeaderboard] = useState<Array<{ id: string; value: number; createdAt: string; user: { id: string; username: string; snakeColor: string; snakeType: SnakeType } }>>([])
	const [endKey, setEndKey] = useState(0)
	const [isTouch, setIsTouch] = useState(false)

	useEffect(() => {
		const base = getApiBase()
		void fetch(`${base}/health`).catch(() => {})
		try {
			const last = localStorage.getItem('snakeUser')
			if (last) {
				const parsed = JSON.parse(last) as User
				setUser(parsed)
				setUsername(parsed.username)
				setSnakeColor(parsed.snakeColor)
				setSnakeType(parsed.snakeType)
			}
		} catch { /* ignore localStorage errors */ }
		// initial leaderboard
		fetch(`${base}/api/leaderboard?limit=10`).then(r => r.json()).then(setLeaderboard).catch(() => { /* ignore */ })
		// detect touch device
		const detectTouch = () => setIsTouch(navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches)
		detectTouch()
		window.addEventListener('resize', detectTouch)
		return () => window.removeEventListener('resize', detectTouch)
	}, [])

	useEffect(() => {
		if (gameState !== 'gameover') return
		if (!user) return
		const base = getApiBase()
		void fetch(`${base}/api/scores`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userId: user.id, value: score }),
		})
			.then(() => fetch(`${base}/api/leaderboard?limit=10`))
			.then(r => r.json())
			.then(setLeaderboard)
			.catch(() => { /* ignore */ })
	}, [gameState, user, score])

	useEffect(() => {
		if (gameState !== 'menu') return
		const base = getApiBase()
		fetch(`${base}/api/leaderboard?limit=10`).then(r => r.json()).then(setLeaderboard).catch(() => { /* ignore */ })
	}, [gameState])

	const startGame = async () => {
		const name = username.trim()
		if (!name) {
			alert('Please enter a username to start.')
			return
		}
		try {
			const base = getApiBase()
			const res = await fetch(`${base}/api/users`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: name, snakeColor, snakeType }),
			})
			if (!res.ok) throw new Error(`API error ${res.status}`)
			const created = await res.json()
			setUser(created)
			try { localStorage.setItem('snakeUser', JSON.stringify(created)) } catch { /* ignore */ }
			setScore(0)
			setGameState('playing')
		} catch (err) {
			console.error('Failed to start game', err)
			alert('Unable to start game. Check server is reachable and try again.')
		}
	}

	return (
		<div className="min-h-screen w-full bg-gradient-to-br from-black via-indigo-950 to-indigo-900 text-white">
			<div className="max-w-5xl mx-auto p-6">
				<header className="flex items-center justify-between">
					<h1 className="text-3xl font-bold tracking-tight">
						<span className="text-lime-400">S</span>erpent
						<span className="text-fuchsia-400">A</span>rena
					</h1>
					{user ? (
						<div className="text-sm opacity-80">Signed in as {user.username}</div>
					) : null}
				</header>

				{gameState === 'menu' && (
					<div className="mt-8 grid gap-6 md:grid-cols-2">
						<section className="bg-white/5 rounded-xl p-5 border border-white/10">
							<h2 className="font-semibold mb-4">Player</h2>
							<input
								className="w-full px-3 py-2 rounded bg-black/30 border border-white/10 outline-none focus:border-cyan-300"
								placeholder="Username"
								value={username}
								onChange={e => setUsername(e.target.value)}
							/>
							<div className="mt-4">
								<h3 className="text-sm mb-2">Snake color</h3>
								<div className="flex gap-2 flex-wrap">
									{PALETTE.map(c => (
										<button key={c} className={`w-8 h-8 rounded-full border-2 ${snakeColor === c ? 'border-white' : 'border-transparent'}`} style={{ backgroundColor: c }} onClick={() => setSnakeColor(c)} />
									))}
								</div>
							</div>
							<div className="mt-4">
								<h3 className="text-sm mb-2">Snake style</h3>
								<div className="flex gap-2">
									{SNAKE_TYPES.map(t => (
										<button key={t.id} className={`px-3 py-1 rounded border ${snakeType === t.id ? 'border-fuchsia-400 bg-fuchsia-400/10' : 'border-white/10'}`} onClick={() => setSnakeType(t.id)}>
											{t.label}
										</button>
									))}
								</div>
							</div>
							<button onClick={startGame} className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-400 text-black font-semibold hover:scale-[1.02] transition">
								Start
							</button>
						</section>
						<section className="bg-white/5 rounded-xl p-5 border border-white/10">
							<h2 className="font-semibold mb-4">Preview</h2>
							<div className="h-64 rounded-lg bg-black/30 border border-white/10 flex items-center justify-center">
								<div className="flex items-center gap-2">
									<div className="w-8 h-8 rounded" style={{ backgroundColor: snakeColor }} />
									<div className="text-sm opacity-80">{snakeType} serpent</div>
								</div>
							</div>
						</section>
						<section className="bg-white/5 rounded-xl p-5 border border-white/10 md:col-span-2">
							<h2 className="font-semibold mb-4">Leaderboard</h2>
							<ol className="space-y-2">
								{leaderboard.map((row, i) => (
									<li key={row.id} className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<span className="w-6 text-right opacity-50">{i + 1}</span>
											<div className="w-3 h-3 rounded" style={{ backgroundColor: row.user.snakeColor }} />
											<span>{row.user.username}</span>
										</div>
										<div className="font-semibold">{row.value}</div>
									</li>
								))}
							</ol>
						</section>
					</div>
				)}

				{gameState === 'playing' && (
					<>
						<div className="mt-6 flex items-center justify-between">
							{isTouch && <span className="text-sm opacity-60">Touch and drag to guide your snake</span>}
							{!isTouch && <span className="text-sm opacity-60">Use arrow keys to move</span>}
							<button className="px-3 py-1 rounded border border-white/10 bg-white/10 hover:bg-white/20" onClick={() => setEndKey(k => k + 1)}>End Game</button>
						</div>
						<GameCanvas color={snakeColor} type={snakeType} onEnd={(finalScore) => { setScore(finalScore); setGameState('gameover'); }} endKey={endKey} />
					</>
				)}

				{gameState === 'gameover' && (
					<div className="mt-8 grid gap-6 md:grid-cols-2">
						<div className="bg-white/5 rounded-xl p-5 border border-white/10">
							<h2 className="font-semibold mb-4">Game Over</h2>
							<p className="text-lg">Score: <span className="font-bold text-yellow-300">{score}</span></p>
							<div className="mt-4 flex gap-3">
								<button className="px-4 py-2 rounded bg-white/10 border border-white/20" onClick={() => setGameState('menu')}>Menu</button>
								<button className="px-4 py-2 rounded bg-cyan-300/20 border border-cyan-300/40" onClick={() => setGameState('playing')}>Restart</button>
							</div>
						</div>
						<div className="bg-white/5 rounded-xl p-5 border border-white/10">
							<h2 className="font-semibold mb-4">Leaderboard</h2>
							<ol className="space-y-2">
								{leaderboard.map((row, i) => (
									<li key={row.id} className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<span className="w-6 text-right opacity-50">{i + 1}</span>
											<div className="w-3 h-3 rounded" style={{ backgroundColor: row.user.snakeColor }} />
											<span>{row.user.username}</span>
										</div>
										<div className="font-semibold">{row.value}</div>
									</li>
								))}
							</ol>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

type Point = { x: number; y: number }
type Snake = { body: Point[]; dir: Point; alive: boolean; color: string; isPlayer: boolean; size: number; id: number }

function GameCanvas({ color, type, onEnd, endKey }: { color: string; type: SnakeType; onEnd: (score: number) => void; endKey?: number }) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null)
	const [running, setRunning] = useState(true)
	const [tick, setTick] = useState(0)
	const scoreRef = useRef(0)
	const [score, setScoreState] = useState(0)
	const setScore = useCallback((updater: number | ((prev: number) => number)) => {
		setScoreState(prev => {
			const next = typeof updater === 'function' ? updater(prev) : updater
			scoreRef.current = next
			return next
		})
	}, [])

	const nextIdRef = useRef(1)

	const initialPlayer: Snake = useMemo(() => ({
		body: [ { x: 8, y: 12 } ],
		dir: { x: 1, y: 0 },
		alive: true,
		color: color,
		isPlayer: true,
		size: 3,
		id: 0,
	}), [color])

	// Create food at random position, avoiding snakes and existing food
	const createFood = useCallback((snakeBodies: Point[], existingFoods: Point[]): Point => {
		let attempts = 0
		let x: number
		let y: number
		do {
			x = Math.floor(Math.random() * COLS)
			y = Math.floor(Math.random() * ROWS)
			attempts++
		} while (
			attempts < SPAWN_MAX_ATTEMPTS &&
			(snakeBodies.some(p => p.x === x && p.y === y) ||
			 existingFoods.some(f => f.x === x && f.y === y))
		)
		return { x, y }
	}, [])

	const createEnemy = useCallback((index: number, playerBody?: Point[]): Snake => {
		const id = nextIdRef.current++
		// Spawn at random position away from player
		let spawnX: number
		let spawnY: number
		let attempts = 0
		do {
			spawnX = Math.floor(Math.random() * COLS)
			spawnY = Math.floor(Math.random() * ROWS)
			attempts++
		} while (
			attempts < SPAWN_MAX_ATTEMPTS &&
			playerBody &&
			playerBody.some(p => Math.abs(p.x - spawnX) <= SPAWN_SAFE_DISTANCE && Math.abs(p.y - spawnY) <= SPAWN_SAFE_DISTANCE)
		)
		return {
			body: [ { x: spawnX, y: spawnY } ],
			dir: { x: index % 2 === 0 ? -1 : 1, y: 0 },
			alive: true,
			color: ENEMY_COLORS[index % ENEMY_COLORS.length],
			isPlayer: false,
			size: 3,
			id,
		}
	}, [])

	// Use a ref to track if we've initialized to prevent double-init in Strict Mode
	const initializedRef = useRef(false)
	const [snakes, setSnakes] = useState<Snake[]>(() => {
		// Only create initial enemy once
		if (initializedRef.current) {
			return [initialPlayer]
		}
		initializedRef.current = true
		// Start with exactly 1 enemy
		const enemy: Snake = {
			body: [ { x: 22, y: 10 } ],
			dir: { x: -1, y: 0 },
			alive: true,
			color: ENEMY_COLORS[0],
			isPlayer: false,
			size: 3,
			id: nextIdRef.current++,
		}
		return [initialPlayer, enemy]
	})

	// Initialize foods avoiding initial snake positions
	const [foods, setFoods] = useState<Point[]>(() => {
		const initialSnakeBodies = [{ x: 8, y: 12 }, { x: 22, y: 10 }]
		const initialFoods: Point[] = []
		for (let i = 0; i < FOOD_COUNT; i++) {
			let x: number
			let y: number
			let attempts = 0
			do {
				x = Math.floor(Math.random() * COLS)
				y = Math.floor(Math.random() * ROWS)
				attempts++
			} while (
				attempts < SPAWN_MAX_ATTEMPTS &&
				(initialSnakeBodies.some(p => p.x === x && p.y === y) ||
				 initialFoods.some(f => f.x === x && f.y === y))
			)
			initialFoods.push({ x, y })
		}
		return initialFoods
	})

	const lastEndKeyRef = useRef<number | undefined>(endKey)
	useEffect(() => {
		if (lastEndKeyRef.current === undefined) { lastEndKeyRef.current = endKey; return }
		if (endKey !== lastEndKeyRef.current) {
			lastEndKeyRef.current = endKey
			setRunning(false)
			setTimeout(() => onEnd(scoreRef.current), 100)
		}
	}, [endKey, onEnd])

	// Touch: finger-following control - snake moves toward finger position
	const touchTargetRef = useRef<{ x: number; y: number } | null>(null)
	const [touchTarget, setTouchTarget] = useState<{ x: number; y: number } | null>(null)

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const getGridPos = (clientX: number, clientY: number) => {
			const rect = canvas.getBoundingClientRect()
			const scaleX = canvas.width / rect.width
			const scaleY = canvas.height / rect.height
			const x = Math.floor(((clientX - rect.left) * scaleX) / GRID_SIZE)
			const y = Math.floor(((clientY - rect.top) * scaleY) / GRID_SIZE)
			return { x: Math.max(0, Math.min(COLS - 1, x)), y: Math.max(0, Math.min(ROWS - 1, y)) }
		}

		const handleTouch = (e: TouchEvent) => {
			e.preventDefault() // Prevent scrolling on iPad
			if (e.touches.length === 0) return
			const t = e.touches[0]
			const pos = getGridPos(t.clientX, t.clientY)
			touchTargetRef.current = pos
			setTouchTarget(pos)
		}

		const handleTouchEnd = () => {
			touchTargetRef.current = null
			setTouchTarget(null)
		}

		canvas.addEventListener('touchstart', handleTouch, { passive: false })
		canvas.addEventListener('touchmove', handleTouch, { passive: false })
		canvas.addEventListener('touchend', handleTouchEnd, { passive: true })
		canvas.addEventListener('touchcancel', handleTouchEnd, { passive: true })

		return () => {
			canvas.removeEventListener('touchstart', handleTouch)
			canvas.removeEventListener('touchmove', handleTouch)
			canvas.removeEventListener('touchend', handleTouchEnd)
			canvas.removeEventListener('touchcancel', handleTouchEnd)
		}
	}, [])

	useEffect(() => {
		const handler = (e: KeyboardEvent | CustomEvent) => {
			if (!running) return
			// Helper to check if new direction is opposite of current (would reverse)
			const isReverse = (current: Point, next: Point) => current.x === -next.x && current.y === -next.y
			// Keyboard
			if (e instanceof KeyboardEvent) {
				if (e.key === 'ArrowUp') setSnakes(prev => prev.map(s => s.isPlayer && !isReverse(s.dir, { x: 0, y: -1 }) ? { ...s, dir: { x: 0, y: -1 } } : s))
				if (e.key === 'ArrowDown') setSnakes(prev => prev.map(s => s.isPlayer && !isReverse(s.dir, { x: 0, y: 1 }) ? { ...s, dir: { x: 0, y: 1 } } : s))
				if (e.key === 'ArrowLeft') setSnakes(prev => prev.map(s => s.isPlayer && !isReverse(s.dir, { x: -1, y: 0 }) ? { ...s, dir: { x: -1, y: 0 } } : s))
				if (e.key === 'ArrowRight') setSnakes(prev => prev.map(s => s.isPlayer && !isReverse(s.dir, { x: 1, y: 0 }) ? { ...s, dir: { x: 1, y: 0 } } : s))
			} else {
				const detail = (e as CustomEvent<{ x: number; y: number }>).detail
				if (detail && typeof detail.x === 'number' && typeof detail.y === 'number') {
					setSnakes(prev => prev.map(s => s.isPlayer && !isReverse(s.dir, detail) ? { ...s, dir: { x: detail.x, y: detail.y } } : s))
				}
			}
		}
		window.addEventListener('keydown', handler as EventListener)
		window.addEventListener('snake-dir', handler as EventListener)
		return () => { window.removeEventListener('keydown', handler as EventListener); window.removeEventListener('snake-dir', handler as EventListener) }
	}, [running])

	useEffect(() => {
		const id = setInterval(() => setTick(t => t + 1), 160)
		return () => clearInterval(id)
	}, [])

	// Calculate enemy speed based on size (slower when bigger)
	const getEnemyTickInterval = (size: number) => {
		// Base interval is 160ms, enemies skip ticks based on size
		// Size 3 = move every tick, size 6 = move every 2 ticks, size 9 = every 3 ticks
		return Math.max(1, Math.floor(size / 3))
	}

	useEffect(() => {
		if (!running) return
		setSnakes(prev => {
			// Player touch control: steer toward finger position
			let next = prev.map(s => {
				if (!s.isPlayer || !s.alive) return s
				const target = touchTargetRef.current
				if (!target) return s

				const head = s.body[0]
				const dx = target.x - head.x
				const dy = target.y - head.y

				// Only change direction if finger is not on the snake head
				if (dx === 0 && dy === 0) return s

				const dirs = [ { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 } ]
				// Don't reverse direction (can't go backward)
				const validDirs = dirs.filter(d => !(d.x === -s.dir.x && d.y === -s.dir.y))

				// Choose direction that moves us closer to target
				let bestDir = s.dir
				if (Math.abs(dx) >= Math.abs(dy)) {
					// Prioritize horizontal movement
					const wantX = dx > 0 ? 1 : -1
					const preferred = validDirs.find(d => d.x === wantX && d.y === 0)
					if (preferred) bestDir = preferred
					else if (dy !== 0) {
						// Can't go horizontal, try vertical
						const wantY = dy > 0 ? 1 : -1
						const fallback = validDirs.find(d => d.y === wantY && d.x === 0)
						if (fallback) bestDir = fallback
					}
				} else {
					// Prioritize vertical movement
					const wantY = dy > 0 ? 1 : -1
					const preferred = validDirs.find(d => d.y === wantY && d.x === 0)
					if (preferred) bestDir = preferred
					else if (dx !== 0) {
						// Can't go vertical, try horizontal
						const wantX = dx > 0 ? 1 : -1
						const fallback = validDirs.find(d => d.x === wantX && d.y === 0)
						if (fallback) bestDir = fallback
					}
				}
				return { ...s, dir: bestDir }
			})

			// Move snakes (enemies move slower based on size)
			next = next.map(s => {
				if (!s.alive) return s
				// Enemies skip ticks based on their size
				if (!s.isPlayer) {
					const interval = getEnemyTickInterval(s.size)
					if (tick % interval !== 0) return s
				}
				const head = { x: (s.body[0].x + s.dir.x + COLS) % COLS, y: (s.body[0].y + s.dir.y + ROWS) % ROWS }
				const newBody = [head, ...s.body].slice(0, s.size)
				return { ...s, body: newBody }
			})

			// AI for bots: move toward food most of the time, occasionally random
			next = next.map(s => {
				if (s.isPlayer || !s.alive) return s
				const head = s.body[0]
				const dirs = [ { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 } ]
				// Don't reverse direction
				const validDirs = dirs.filter(d => !(d.x === -s.dir.x && d.y === -s.dir.y))

				// 70% chance to move toward nearest food, 30% random
				if (Math.random() < ENEMY_AI_FOOD_CHASE_CHANCE) {
					// Find nearest food
					let nearestFood = foods[0]
					let nearestDist = Math.abs(foods[0].x - head.x) + Math.abs(foods[0].y - head.y)
					for (const f of foods) {
						const dist = Math.abs(f.x - head.x) + Math.abs(f.y - head.y)
						if (dist < nearestDist) {
							nearestDist = dist
							nearestFood = f
						}
					}

					const dx = nearestFood.x - head.x
					const dy = nearestFood.y - head.y

					// Prefer the direction that gets us closer to food
					let bestDir = s.dir
					if (Math.abs(dx) > Math.abs(dy)) {
						// Move horizontally toward food
						const wantX = dx > 0 ? 1 : -1
						const preferred = validDirs.find(d => d.x === wantX && d.y === 0)
						if (preferred) bestDir = preferred
					} else if (dy !== 0) {
						// Move vertically toward food
						const wantY = dy > 0 ? 1 : -1
						const preferred = validDirs.find(d => d.y === wantY && d.x === 0)
						if (preferred) bestDir = preferred
					}
					return { ...s, dir: bestDir }
				} else {
					// Random direction
					const newDir = validDirs[Math.floor(Math.random() * validDirs.length)]
					return { ...s, dir: newDir }
				}
			})

			// Eating food grows snakes (both player and enemies)
			const eatenFoodIndices: number[] = []
			next = next.map(s => {
				if (!s.alive) return s
				const headX = s.body[0].x
				const headY = s.body[0].y
				const foodIndex = foods.findIndex(f => f.x === headX && f.y === headY)
				if (foodIndex !== -1) {
					eatenFoodIndices.push(foodIndex)
					if (s.isPlayer) {
						setScore(v => v + 10)
					}
					return { ...s, size: s.size + 1 }
				}
				return s
			})
			if (eatenFoodIndices.length > 0) {
				// Replace eaten food with new food, avoiding snake bodies
				const allBodies = next.flatMap(s => s.body)
				setFoods(prev => {
					const newFoods = [...prev]
					for (const idx of eatenFoodIndices) {
						const otherFoods = newFoods.filter((_, i) => i !== idx)
						newFoods[idx] = createFood(allBodies, otherFoods)
					}
					return newFoods
				})
			}

			// Self-collision kills only the player (bots ignore to reduce randomness)
			next = next.map(s => {
				if (!s.alive) return s
				if (!s.isPlayer) return s
				const head = s.body[0]
				const hitSelf = s.body.slice(1).some(p => p.x === head.x && p.y === head.y)
				return hitSelf ? { ...s, alive: false } : s
			})

			// Player eating enemy: player bites off from the collision point backward
			// Enemy can only die when fully consumed (size becomes 0)
			// Build collision updates without mutating
			const playerEatingUpdates: Map<number, Snake> = new Map()
			let scoreFromEating = 0
			for (let i = 0; i < next.length; i++) {
				const player = next[i]
				if (!player.isPlayer || !player.alive) continue
				const playerHead = player.body[0]

				for (let j = 0; j < next.length; j++) {
					if (i === j) continue
					const enemy = playerEatingUpdates.get(j) ?? next[j]
					if (enemy.isPlayer || !enemy.alive) continue

					// Check if player head touches any part of enemy body
					const hitIndex = enemy.body.findIndex(p => p.x === playerHead.x && p.y === playerHead.y)
					if (hitIndex !== -1) {
						// Player bites from hitIndex backward (removes hitIndex and everything after)
						const segmentsEaten = enemy.body.length - hitIndex
						const newEnemyBody = enemy.body.slice(0, hitIndex)
						const newEnemySize = enemy.size - segmentsEaten

						if (newEnemySize <= 0 || newEnemyBody.length === 0) {
							// Enemy fully consumed - dies
							playerEatingUpdates.set(j, { ...enemy, alive: false, body: [], size: 0 })
							scoreFromEating += 50
						} else {
							// Enemy partially eaten - shrinks
							playerEatingUpdates.set(j, { ...enemy, body: newEnemyBody, size: newEnemySize })
							scoreFromEating += 5 * segmentsEaten
						}
					}
				}
			}
			// Apply player eating updates
			if (playerEatingUpdates.size > 0) {
				next = next.map((s, i) => playerEatingUpdates.get(i) ?? s)
				setScore(v => v + scoreFromEating)
			}

			// Enemy head hitting player kills player (enemy doesn't die from this)
			// But only if the enemy still has a head (wasn't just eaten)
			const enemyHitUpdates: Map<number, Snake> = new Map()
			for (let i = 0; i < next.length; i++) {
				const enemy = next[i]
				if (enemy.isPlayer || !enemy.alive) continue
				// Skip if enemy has no body (was fully eaten)
				if (enemy.body.length === 0) continue
				const enemyHead = enemy.body[0]

				for (let j = 0; j < next.length; j++) {
					const player = next[j]
					if (!player.isPlayer || !player.alive) continue

					// Check if enemy head hits player body (excluding head-to-head which player wins)
					const hitPlayer = player.body.some((p, idx) => {
						if (p.x === enemyHead.x && p.y === enemyHead.y) {
							// Head-to-head collision: player wins (they eat the enemy)
							if (idx === 0) return false
							return true
						}
						return false
					})
					if (hitPlayer) {
						enemyHitUpdates.set(j, { ...player, alive: false })
					}
				}
			}
			// Apply enemy hit updates
			if (enemyHitUpdates.size > 0) {
				next = next.map((s, i) => enemyHitUpdates.get(i) ?? s)
			}

			// Spawn new enemies when one is killed (start with 1, spawn 2 when killed)
			// But cap total enemies at MAX_ENEMIES
			const deadEnemies = next.filter(s => !s.isPlayer && !s.alive)

			if (deadEnemies.length > 0) {
				// Remove dead enemies and spawn 2 new ones for each killed (up to cap)
				next = next.filter(s => s.isPlayer || s.alive)
				const currentEnemyCount = next.filter(s => !s.isPlayer).length
				const playerSnakeForSpawn = next.find(s => s.isPlayer)
				const playerBody = playerSnakeForSpawn?.body ?? []
				const enemiesToSpawn = Math.min(deadEnemies.length * 2, MAX_ENEMIES - currentEnemyCount)
				for (let i = 0; i < enemiesToSpawn; i++) {
					next.push(createEnemy(nextIdRef.current, playerBody))
				}
			}

			// End if player dead
			const playerSnake = next.find(s => s.isPlayer)
			if (!playerSnake?.alive) {
				setRunning(false)
				setTimeout(() => onEnd(scoreRef.current), 300)
			}

			return next
		})
	}, [tick, running, foods, onEnd, setScore, createFood, createEnemy])

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return
		const ctx = canvas.getContext('2d')!
		ctx.clearRect(0, 0, canvas.width, canvas.height)
		ctx.fillStyle = 'rgba(255,255,255,0.04)'
		for (let x = 0; x < COLS; x++) {
			for (let y = 0; y < ROWS; y++) {
				if ((x + y) % 2 === 0) {
					ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE)
				}
			}
		}

		// draw all food blocks
		ctx.fillStyle = '#ffcc00'
		for (const f of foods) {
			ctx.fillRect(f.x * GRID_SIZE, f.y * GRID_SIZE, GRID_SIZE, GRID_SIZE)
		}

		// draw snakes with styles
		snakes.forEach(s => {
			ctx.globalAlpha = s.alive ? 1 : 0.3
			s.body.forEach((p, idx) => {
				const size = GRID_SIZE - Math.max(0, idx - 1)
				const x = p.x * GRID_SIZE + (GRID_SIZE - size) / 2
				const y = p.y * GRID_SIZE + (GRID_SIZE - size) / 2
				if (type === 'neon' && s.isPlayer) {
					ctx.shadowBlur = 16
					ctx.shadowColor = color
					ctx.fillStyle = color
					ctx.fillRect(x, y, size, size)
					ctx.shadowBlur = 0
				} else if (type === 'stripe' && s.isPlayer) {
					ctx.fillStyle = idx % 2 === 0 ? color : 'white'
					ctx.globalAlpha = idx % 2 === 0 ? 1 : 0.5
					ctx.fillRect(x, y, size, size)
					ctx.globalAlpha = s.alive ? 1 : 0.3
				} else {
					ctx.fillStyle = s.color
					ctx.fillRect(x, y, size, size)
				}
			})
			ctx.globalAlpha = 1
		})

		// draw touch target indicator
		if (touchTarget) {
			ctx.strokeStyle = color
			ctx.lineWidth = 2
			ctx.globalAlpha = 0.6
			ctx.beginPath()
			ctx.arc(
				touchTarget.x * GRID_SIZE + GRID_SIZE / 2,
				touchTarget.y * GRID_SIZE + GRID_SIZE / 2,
				GRID_SIZE / 2 + 4,
				0,
				Math.PI * 2
			)
			ctx.stroke()
			ctx.globalAlpha = 1
		}

		// score HUD
		ctx.fillStyle = 'white'
		ctx.font = 'bold 16px sans-serif'
		ctx.fillText(`Score: ${score}` , 10, 18)
	}, [snakes, foods, score, type, color, touchTarget])

	return (
		<div className="mt-8">
			<canvas ref={canvasRef} width={COLS * GRID_SIZE} height={ROWS * GRID_SIZE} className="rounded-xl border border-white/10 bg-black/40 w-full h-auto max-w-full" />
		</div>
	)
}
