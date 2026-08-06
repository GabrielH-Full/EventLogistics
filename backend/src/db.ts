import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { buildInitialState } from './seedData';
import { AppState } from './types/domain';

const DATA_FILE = path.join(__dirname, '..', 'data.json');

export const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://eventlogistics:eventlogistics_secret@localhost:5433/eventlogistics_db'
});

function load(): AppState {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw) as AppState;
    } catch (err) {
      console.error('Falha ao ler data.json, recriando estado inicial.', err);
    }
  }
  const initial = buildInitialState();
  persist(initial);
  return initial;
}

function persist(state: AppState): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

// Estado vive em memória durante a execução; toda mutação chama save() no fim.
export const state: AppState = load();

export function save(): void {
  persist(state);
}

// Dados expostos ao frontend nunca incluem passwordHash.
export function publicState() {
  return {
    products: state.products,
    stalls: state.stalls,
    tickets: state.tickets
  };
}
