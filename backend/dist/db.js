"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.state = exports.db = void 0;
exports.save = save;
exports.publicState = publicState;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pg_1 = require("pg");
const seedData_1 = require("./seedData");
const DATA_FILE = path_1.default.join(__dirname, '..', 'data.json');
exports.db = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://eventlogistics:eventlogistics_secret@localhost:5433/eventlogistics_db'
});
function load() {
    if (fs_1.default.existsSync(DATA_FILE)) {
        try {
            const raw = fs_1.default.readFileSync(DATA_FILE, 'utf-8');
            return JSON.parse(raw);
        }
        catch (err) {
            console.error('Falha ao ler data.json, recriando estado inicial.', err);
        }
    }
    const initial = (0, seedData_1.buildInitialState)();
    persist(initial);
    return initial;
}
function persist(state) {
    fs_1.default.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
}
// Estado vive em memória durante a execução; toda mutação chama save() no fim.
exports.state = load();
function save() {
    persist(exports.state);
}
// Dados expostos ao frontend nunca incluem passwordHash.
function publicState() {
    return {
        products: exports.state.products,
        stalls: exports.state.stalls,
        tickets: exports.state.tickets
    };
}
