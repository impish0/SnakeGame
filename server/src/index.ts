import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

// Runtime config for client to discover API base at runtime
app.get('/config.json', (_req, res) => {
    const publicApiUrl = process.env.PUBLIC_API_URL || '';
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ apiBaseUrl: publicApiUrl }));
});

// Create or fetch user
app.post('/api/users', async (req, res) => {
	try {
		const { username, snakeColor, snakeType } = req.body ?? {};
		if (!username || typeof username !== 'string') {
			return res.status(400).json({ error: 'username required' });
		}
		const color: string | undefined = typeof snakeColor === 'string' && snakeColor ? snakeColor : undefined;
		const type: string | undefined = typeof snakeType === 'string' && snakeType ? snakeType : undefined;

		const updateData: Record<string, unknown> = {};
		if (color !== undefined) updateData.snakeColor = color;
		if (type !== undefined) updateData.snakeType = type;

		const createData: Record<string, unknown> = { username };
		if (color !== undefined) createData.snakeColor = color;
		if (type !== undefined) createData.snakeType = type;

		const user = await prisma.user.upsert({
			where: { username },
			update: updateData,
			create: createData as any,
		});
		return res.json(user);
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: 'internal_error' });
	}
});

// Update user preferences
app.put('/api/users/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const { snakeColor, snakeType } = req.body ?? {};
		const data: Record<string, unknown> = {};
		if (typeof snakeColor === 'string') data.snakeColor = snakeColor;
		if (typeof snakeType === 'string') data.snakeType = snakeType;
		const user = await prisma.user.update({
			where: { id },
			data,
		});
		return res.json(user);
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: 'internal_error' });
	}
});

// Submit score
app.post('/api/scores', async (req, res) => {
	try {
		const { userId, value } = req.body ?? {};
		if (!userId || typeof value !== 'number') {
			return res.status(400).json({ error: 'userId and numeric value required' });
		}
		const score = await prisma.score.create({ data: { userId, value } });
		return res.json(score);
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: 'internal_error' });
	}
});

// Leaderboard top N
app.get('/api/leaderboard', async (req, res) => {
	try {
		const limit = Math.min(parseInt(String(req.query.limit ?? '10'), 10) || 10, 50);
		const rows = await prisma.score.findMany({
			orderBy: { value: 'desc' },
			take: limit,
			include: { user: true },
		});
		return res.json(rows.map(r => ({
			id: r.id,
			value: r.value,
			createdAt: r.createdAt,
			user: { id: r.user.id, username: r.user.username, snakeColor: r.user.snakeColor, snakeType: r.user.snakeType },
		})));
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: 'internal_error' });
	}
});

// Serve client build in production
try {
	const clientDist = path.resolve(__dirname, '../../client/dist');
	app.use(express.static(clientDist));
	// Serve disk config if present (overrides env-based config above)
	const diskConfig = path.join(clientDist, 'config.json');
	app.get('/config.json', (req, res, next) => {
		if (fs.existsSync(diskConfig)) return res.sendFile(diskConfig);
		return next();
	});
	app.get('*', (req, res) => {
		if (req.path.startsWith('/api')) {
			return res.status(404).json({ error: 'not_found' });
		}
		res.sendFile(path.join(clientDist, 'index.html'));
	});
} catch {}

const port = process.env.PORT || 4000;
app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});
