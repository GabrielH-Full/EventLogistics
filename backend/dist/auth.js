"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPassword = checkPassword;
exports.signToken = signToken;
exports.verifyToken = verifyToken;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_troque_em_producao';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '12h');
function checkPassword(plain, hash) {
    return bcryptjs_1.default.compareSync(plain, hash);
}
function signToken(user) {
    // Nunca colocamos passwordHash no token.
    const payload = {
        sub: user.id,
        username: user.username,
        role: user.role,
        stallId: user.stallId,
        displayName: user.displayName
    };
    const options = { expiresIn: JWT_EXPIRES_IN };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, options);
}
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, JWT_SECRET);
}
