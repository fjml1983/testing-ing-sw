const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const ALLOWED_FORMATS = new Set(['DVD', 'Xbox']);
const ALLOWED_OPERATIONS = new Set(['venta', 'renta']);

function initializeDatabase(db) {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS operations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        year TEXT NOT NULL,
        format TEXT NOT NULL,
        operation TEXT NOT NULL,
        member_name TEXT,
        is_member INTEGER NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
  });
}

function validatePayload(payload) {
  const title = String(payload.title || '').trim();
  const year = String(payload.year || '').trim();
  const format = String(payload.format || '').trim();
  const operation = String(payload.operation || '').trim();
  const memberName = String(payload.memberName || '').trim();

  if (!title) {
    return { ok: false, message: 'El titulo es obligatorio.' };
  }

  if (!/^[A-Za-z0-9 ]{1,25}$/.test(title)) {
    return {
      ok: false,
      message: 'El titulo debe ser alfanumerico con espacios y maximo 25 caracteres.'
    };
  }

  if (!/^\d{4}$/.test(year)) {
    return { ok: false, message: 'El anio debe tener exactamente 4 digitos numericos.' };
  }

  if (!ALLOWED_FORMATS.has(format)) {
    return { ok: false, message: 'El formato debe ser DVD o Xbox.' };
  }

  if (!ALLOWED_OPERATIONS.has(operation)) {
    return { ok: false, message: 'La operacion debe ser venta o renta.' };
  }

  if (memberName && !/^[A-Za-z0-9 ]{1,80}$/.test(memberName)) {
    return {
      ok: false,
      message: 'El nombre del socio debe ser alfanumerico y permitir espacios.'
    };
  }

  const isMember = memberName.length > 0;

  if (!isMember && (format !== 'DVD' || operation !== 'venta')) {
    return {
      ok: false,
      message: 'Un no socio solamente puede comprar DVDs.'
    };
  }

  if (isMember && format === 'Xbox' && operation !== 'renta') {
    return {
      ok: false,
      message: 'Un socio solo puede rentar juegos Xbox.'
    };
  }

  return {
    ok: true,
    data: {
      title,
      year,
      format,
      operation,
      memberName,
      isMember
    }
  };
}

function createApp(options = {}) {
  const dbPath = options.dbPath || path.join(__dirname, 'store.sqlite');
  const db = new sqlite3.Database(dbPath);
  const app = express();

  initializeDatabase(db);

  app.use(cors());
  app.use(express.json());

  app.get('/api/operations', (_req, res) => {
    db.all(
      `
        SELECT id, title, year, format, operation, member_name AS memberName, is_member AS isMember, created_at AS createdAt
        FROM operations
        ORDER BY id DESC
        LIMIT 50
      `,
      [],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ message: 'No se pudieron obtener las operaciones.' });
        }

        return res.json(rows);
      }
    );
  });

  app.post('/api/operations', (req, res) => {
    const validation = validatePayload(req.body || {});

    if (!validation.ok) {
      return res.status(400).json({ message: validation.message });
    }

    const { title, year, format, operation, memberName, isMember } = validation.data;
    const createdAt = new Date().toISOString();

    db.run(
      `
        INSERT INTO operations (title, year, format, operation, member_name, is_member, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [title, year, format, operation, memberName, isMember ? 1 : 0, createdAt],
      function onInsert(err) {
        if (err) {
          return res.status(500).json({ message: 'No se pudo guardar la operacion.' });
        }

        return res.status(201).json({
          id: this.lastID,
          title,
          year,
          format,
          operation,
          memberName,
          isMember,
          createdAt
        });
      }
    );
  });

  function closeDatabase() {
    return new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  return { app, db, closeDatabase };
}

module.exports = {
  createApp,
  validatePayload
};