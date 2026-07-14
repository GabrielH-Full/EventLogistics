const fs = require('fs');
const path = require('path');
const { buildInitialState } = require('./seedData');

const DATA_FILE = path.join(__dirname, '..', 'data.json');

function load() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('Falha ao ler data.json, recriando estado inicial.', err);
    }
  }
  const initial = buildInitialState();
  persist(initial);
  return initial;
}

function persist(state) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

// Estado vive em memória durante a execução; toda mutação chama save() no fim.
const state = load();

function save() {
  persist(state);
}

// Dados expostos ao frontend nunca incluem passwordHash.
function publicState() {
  return {
    products: state.products,
    stalls: state.stalls,
    tickets: state.tickets
  };
}

module.exports = { state, save, publicState };
