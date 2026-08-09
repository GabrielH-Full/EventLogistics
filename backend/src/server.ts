import 'dotenv/config';
import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes';
import stateRoutes from './routes/stateRoutes';
import ticketRoutes from './routes/ticketRoutes';
import productRoutes from './routes/productRoutes';
import userRoutes from './routes/userRoutes';
import productCategoryRoutes from './routes/productCategoryRoutes';
import adminStallRoutes from './routes/adminStallRoutes';
import adminProductRoutes from './routes/adminProductRoutes';
import { initSocket } from './socket';

const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');

const app = express();
app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // limite de 10 tentativas por IP
  message: { error: 'Muitas tentativas de login. Tente novamente mais tarde.' }
});
app.use('/api/auth/login', loginLimiter);

app.get('/api/health', (req: Request, res: Response) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/state', stateRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/product-categories', productCategoryRoutes);
app.use('/api', productRoutes); // /api/products/:id/production e /api/stalls/:stallId/reset
app.use('/api/stalls', adminStallRoutes);
app.use('/api/products', adminProductRoutes);

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