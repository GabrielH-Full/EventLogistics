"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const stateRoutes_1 = __importDefault(require("./routes/stateRoutes"));
const ticketRoutes_1 = __importDefault(require("./routes/ticketRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const productCategoryRoutes_1 = __importDefault(require("./routes/productCategoryRoutes"));
const adminStallRoutes_1 = __importDefault(require("./routes/adminStallRoutes"));
const adminProductRoutes_1 = __importDefault(require("./routes/adminProductRoutes"));
const socket_1 = require("./socket");
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: CORS_ORIGIN, credentials: true }));
app.use(express_1.default.json({ limit: '10kb' }));
app.use(express_1.default.urlencoded({ extended: false, limit: '10kb' }));
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // limite de 10 tentativas por IP
    message: { error: 'Muitas tentativas de login. Tente novamente mais tarde.' }
});
app.use('/api/auth/login', loginLimiter);
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes_1.default);
app.use('/api/state', stateRoutes_1.default);
app.use('/api/tickets', ticketRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/product-categories', productCategoryRoutes_1.default);
app.use('/api', productRoutes_1.default); // /api/products/:id/production e /api/stalls/:stallId/reset
app.use('/api/stalls', adminStallRoutes_1.default);
app.use('/api/products', adminProductRoutes_1.default);
app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
});
const httpServer = http_1.default.createServer(app);
(0, socket_1.initSocket)(httpServer, CORS_ORIGIN);
httpServer.listen(PORT, () => {
    console.log(`EventLogistics backend rodando em http://localhost:${PORT}`);
});
