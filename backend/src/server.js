require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const stateRoutes = require('./routes/stateRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const productRoutes = require('./routes/productRoutes');
const { initSocket } = require('./socket');

const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');

const app = express();
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/state', stateRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api', productRoutes); // /api/products/:id/production e /api/stalls/:stallId/reset

app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

const httpServer = http.createServer(app);
initSocket(httpServer, CORS_ORIGIN);

httpServer.listen(PORT, () => {
  console.log(`EventLogistics backend rodando em http://localhost:${PORT}`);
});