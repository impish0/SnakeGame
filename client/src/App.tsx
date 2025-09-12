import { useEffect, useMemo, useRef, useState } from 'react'
import './index.css'

type SnakeType = 'classic' | 'stripe' | 'neon';

type User = {
	id: string
	username: string
	snakeColor: string
	snakeType: SnakeType
}

const SNAKE_TYPES: { id: SnakeType; label: string }[] = [
	{ id: 'classic', label: 'Classic' },
	{ id: 'stripe', label: 'Stripe' },
	{ id: 'neon', label: 'Neon' },
]

const PALETTE = ['#39ff14', '#ff1aff', '#00eaff', '#ffe600', '#ff6b6b', '#7c3aed']

function getApiBase() {
  const runtime = (typeof window !== 'undefined' && (window as any).__SNAKE_CONFIG__?.apiBaseUrl) as string | undefined
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
		} catch {}
		// initial leaderboard
		fetch(`${base}/api/leaderboard?limit=10`).then(r => r.json()).then(setLeaderboard).catch(() => {})
		// detect touch device
		const detectTouch = () => setIsTouch((navigator as any).maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches)
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
			.catch(() => {})
	}, [gameState])

	useEffect(() => {
		if (gameState !== 'menu') return
		const base = getApiBase()
		fetch(`${base}/api/leaderboard?limit=10`).then(r => r.json()).then(setLeaderboard).catch(() => {})
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
			try { localStorage.setItem('snakeUser', JSON.stringify(created)) } catch {}
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
						<div className="mt-6 flex justify-end">
							<button className="px-3 py-1 rounded border border-white/10 bg-white/10 hover:bg-white/20" onClick={() => setEndKey(k => k + 1)}>End Game</button>
						</div>
						<GameCanvas color={snakeColor} type={snakeType} onEnd={(finalScore) => { setScore(finalScore); setGameState('gameover'); }} endKey={endKey} />
						{isTouch && (
							<div className="fixed bottom-6 right-6 grid grid-cols-3 grid-rows-3 gap-2 select-none">
								<div />
								<button className="w-12 h-12 rounded bg-white/10 border border-white/20" onClick={() => window.dispatchEvent(new CustomEvent('snake-dir', { detail: { x: 0, y: -1 } }))}>▲</button>
								<div />
								<button className="w-12 h-12 rounded bg-white/10 border border-white/20" onClick={() => window.dispatchEvent(new CustomEvent('snake-dir', { detail: { x: -1, y: 0 } }))}>◀</button>
								<div className="w-12 h-12" />
								<button className="w-12 h-12 rounded bg-white/10 border border-white/20" onClick={() => window.dispatchEvent(new CustomEvent('snake-dir', { detail: { x: 1, y: 0 } }))}>▶</button>
								<div />
								<button className="w-12 h-12 rounded bg-white/10 border border-white/20" onClick={() => window.dispatchEvent(new CustomEvent('snake-dir', { detail: { x: 0, y: 1 } }))}>▼</button>
								<div />
							</div>
						)}
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

function GameCanvas({ color, type, onEnd, endKey }: { color: string; type: SnakeType; onEnd: (score: number) => void; endKey?: number }) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null)
	const [running, setRunning] = useState(true)
	const [tick, setTick] = useState(0)
	const [score, setScore] = useState(0)

	const gridSize = 20
	const cols = 32
	const rows = 24

	type Point = { x: number; y: number }
	type Snake = { body: Point[]; dir: Point; alive: boolean; color: string; isPlayer: boolean; size: number }

	const initialPlayer: Snake = useMemo(() => ({
		body: [ { x: 8, y: 12 } ],
		dir: { x: 1, y: 0 },
		alive: true,
		color: color,
		isPlayer: true,
		size: 3,
	}), [color])

	const [snakes, setSnakes] = useState<Snake[]>(() => {
		const bots: Snake[] = Array.from({ length: 3 }).map((_, i) => ({
			body: [ { x: 20 + (i % 3), y: 10 + (i % 4) } ],
			dir: { x: i % 2 === 0 ? -1 : 1, y: 0 },
			alive: true,
			color: ['#ff6b6b', '#7c3aed', '#00eaff', '#ffe600', '#ff1aff'][i % 5],
			isPlayer: false,
			size: 2 + (i % 3),
		}))
		return [initialPlayer, ...bots]
	})

	const [food, setFood] = useState<Point>({ x: 16, y: 12 })

	const lastEndKeyRef = useRef<number | undefined>(endKey)
	useEffect(() => {
		if (lastEndKeyRef.current === undefined) { lastEndKeyRef.current = endKey; return }
		if (endKey !== lastEndKeyRef.current) {
			lastEndKeyRef.current = endKey
			setRunning(false)
			setTimeout(() => onEnd(score), 100)
		}
	}, [endKey])

	// Touch: swipe detection on canvas
	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return
		let startX = 0, startY = 0
		const start = (e: TouchEvent) => { const t = e.touches[0]; startX = t.clientX; startY = t.clientY }
		const move = (e: TouchEvent) => {
			if (e.changedTouches.length === 0) return
			const t = e.changedTouches[0]
			const dx = t.clientX - startX
			const dy = t.clientY - startY
			if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return
			if (Math.abs(dx) > Math.abs(dy)) {
				window.dispatchEvent(new CustomEvent('snake-dir', { detail: { x: dx > 0 ? 1 : -1, y: 0 } }))
			} else {
				window.dispatchEvent(new CustomEvent('snake-dir', { detail: { x: 0, y: dy > 0 ? 1 : -1 } }))
			}
			startX = t.clientX; startY = t.clientY
		}
		canvas.addEventListener('touchstart', start, { passive: true })
		canvas.addEventListener('touchmove', move, { passive: true })
		return () => { canvas.removeEventListener('touchstart', start); canvas.removeEventListener('touchmove', move) }
	}, [])

	useEffect(() => {
		const handler = (e: KeyboardEvent | CustomEvent) => {
			if (!running) return
			// Keyboard
			if (e instanceof KeyboardEvent) {
				if (e.key === 'ArrowUp') setSnakes(prev => prev.map(s => s.isPlayer ? { ...s, dir: { x: 0, y: -1 } } : s))
				if (e.key === 'ArrowDown') setSnakes(prev => prev.map(s => s.isPlayer ? { ...s, dir: { x: 0, y: 1 } } : s))
				if (e.key === 'ArrowLeft') setSnakes(prev => prev.map(s => s.isPlayer ? { ...s, dir: { x: -1, y: 0 } } : s))
				if (e.key === 'ArrowRight') setSnakes(prev => prev.map(s => s.isPlayer ? { ...s, dir: { x: 1, y: 0 } } : s))
			} else {
				const detail: any = (e as CustomEvent).detail
				if (detail && typeof detail.x === 'number' && typeof detail.y === 'number') {
					setSnakes(prev => prev.map(s => s.isPlayer ? { ...s, dir: { x: detail.x, y: detail.y } } : s))
				}
			}
		}
		window.addEventListener('keydown', handler as any)
		window.addEventListener('snake-dir', handler as any)
		return () => { window.removeEventListener('keydown', handler as any); window.removeEventListener('snake-dir', handler as any) }
	}, [running])

	useEffect(() => {
		const id = setInterval(() => setTick(t => t + 1), 160)
		return () => clearInterval(id)
	}, [])

	useEffect(() => {
		if (!running) return
		setSnakes(prev => {
			// Move snakes
			let next = prev.map(s => {
				if (!s.alive) return s
				const head = { x: (s.body[0].x + s.dir.x + cols) % cols, y: (s.body[0].y + s.dir.y + rows) % rows }
				const newBody = [head, ...s.body].slice(0, s.size)
				return { ...s, body: newBody }
			})

			// AI for bots: random turns sometimes
			next = next.map(s => {
				if (s.isPlayer || !s.alive) return s
				if (Math.random() < 0.1) {
					const dirs = [ { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 } ]
					const filtered = dirs.filter(d => !(d.x === -s.dir.x && d.y === -s.dir.y))
					s.dir = filtered[Math.floor(Math.random() * filtered.length)]
				}
				return s
			})

			// Eating food grows player
			next = next.map(s => {
				if (!s.alive) return s
				if (s.body[0].x === food.x && s.body[0].y === food.y) {
					const grown = { ...s, size: s.size + 1 }
					if (s.isPlayer) {
						setScore(v => v + 10)
						setFood({ x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) })
					}
					return grown
				}
				return s
			})

			// Self-collision kills only the player (bots ignore to reduce randomness)
			next = next.map(s => {
				if (!s.alive) return s
				if (!s.isPlayer) return s
				const head = s.body[0]
				const hitSelf = s.body.slice(1).some(p => p.x === head.x && p.y === head.y)
				return hitSelf ? { ...s, alive: false } : s
			})

			// Big snakes eat smaller snakes on head collision or overlap
			for (let i = 0; i < next.length; i++) {
				for (let j = i + 1; j < next.length; j++) {
					const a = next[i]
					const b = next[j]
					if (!a.alive || !b.alive) continue
					const ah = a.body[0]
					const bh = b.body[0]
					const headTouch = ah.x === bh.x && ah.y === bh.y
					const overlap = a.body.some(p => p.x === bh.x && p.y === bh.y) || b.body.some(p => p.x === ah.x && p.y === ah.y)
					if (headTouch || overlap) {
						if (a.size === b.size) continue
						if (a.size > b.size) {
							next[j] = { ...b, alive: false }
							if (a.isPlayer) setScore(s => s + 25)
						} else {
							next[i] = { ...a, alive: false }
							if (b.isPlayer) setScore(s => s + 25)
						}
					}
				}
			}

			// End if player dead
			const player = next.find(s => s.isPlayer)
			if (!player?.alive) {
				setRunning(false)
				setTimeout(() => onEnd(score), 300)
			}

			return next
		})
	}, [tick])

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return
		const ctx = canvas.getContext('2d')!
		ctx.clearRect(0, 0, canvas.width, canvas.height)
		ctx.fillStyle = 'rgba(255,255,255,0.04)'
		for (let x = 0; x < cols; x++) {
			for (let y = 0; y < rows; y++) {
				if ((x + y) % 2 === 0) {
					ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize)
				}
			}
		}

		// draw food
		ctx.fillStyle = '#ffcc00'
		ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize)

		// draw snakes with styles
		snakes.forEach(s => {
			ctx.globalAlpha = s.alive ? 1 : 0.3
			s.body.forEach((p, idx) => {
				const size = gridSize - Math.max(0, idx - 1)
				const x = p.x * gridSize + (gridSize - size) / 2
				const y = p.y * gridSize + (gridSize - size) / 2
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

		// score HUD
		ctx.fillStyle = 'white'
		ctx.font = 'bold 16px sans-serif'
		ctx.fillText(`Score: ${score}` , 10, 18)
	}, [snakes, food, score, type, color])

	return (
		<div className="mt-8">
			<canvas ref={canvasRef} width={cols * gridSize} height={rows * gridSize} className="rounded-xl border border-white/10 bg-black/40 w-full h-auto max-w-full" />
		</div>
	)
}
