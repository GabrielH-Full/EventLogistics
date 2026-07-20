import 'dotenv/config';
import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

import authRoutes from './routes/authRoutes';
import stateRoutes from './routes/stateRoutes';
import ticketRoutes from './routes/ticketRoutes';
import productRoutes from './routes/productRoutes';
import { initSocket } from './socket';

const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');

const app = express();
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.get('/api/health', (req: Request, res: Response) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/state', stateRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api', productRoutes); // /api/products/:id/production e /api/stalls/:stallId/reset

app.use((req: Request, res: Response) => res.status(404).json({ error: 'Rota não encontrada.' }));

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

const httpServer = http.createServer(app);
initSocket(httpServer, CORS_ORIGIN);

httpServer.listen(PORT, () => {
  console.log(`EventLogistics backend rodando em http://localhost:${PORT}`);
});