import express from 'express';
import multer from 'multer';
import { query } from '../db/index.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Map CSV tipo to DB enum
const tipoMap = {
  'Auditoria': 'AUDITORIA',
  'Formacao': 'FORMACAO',
  'Acompanhamento': 'ACOMPANHAMENTO',
  'Outros': 'OUTROS'
};

function parseDatePtBR(dateStr) {
  // Expect dd/mm/yyyy
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts.map(p => p.trim());
  const d = Number(dd), m = Number(mm), y = Number(yyyy);
  if (!d || !m || !y) return null;
  const jsDate = new Date(y, m - 1, d);
  if (isNaN(jsDate.getTime())) return null;
  // Return ISO string suitable for timestamp
  return jsDate.toISOString();
}

function parseCsvSemicolon(text) {
  // Very simple parser for semicolon-delimited CSV
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];
  const header = lines[0].split(';').map(h => h.trim().toLowerCase());
  const dataLines = lines.slice(1);
  return dataLines.map((line, idx) => {
    const cols = line.split(';');
    const row = {};
    header.forEach((h, i) => {
      row[h] = (cols[i] ?? '').trim();
    });
    row.__line = idx + 2; // account for header
    return row;
  });
}

// Accept both JSON body { csv } and file upload with field name 'file'
router.post('/import-visitas', upload.single('file'), async (req, res) => {
  try {
    let csv = req.body?.csv;
    if (req.file && req.file.buffer) {
      csv = req.file.buffer.toString('utf8');
    }
    if (!csv || typeof csv !== 'string') {
      return res.status(400).json({ error: 'Missing CSV content (provide json {csv} or upload a file)' });
    }

    const rows = parseCsvSemicolon(csv);
    if (rows.length === 0) {
      return res.status(400).json({ error: 'CSV appears empty' });
    }

    const results = { imported: 0, createdVisitIds: [], errors: [] };

    for (const r of rows) {
      try {
        const tipoRaw = r.tipo?.trim();
        const titulo = r.titulo?.trim();
        const texto = r.texto?.trim();
        const dataStr = r.data?.trim();
        const dotEmail = r.dot_email?.trim();
        const lojasStr = r.lojas?.trim();

        if (!tipoRaw || !titulo || !dataStr || !dotEmail || !lojasStr) {
          results.errors.push({ line: r.__line, message: 'Missing required fields' });
          continue;
        }

        const tipo = tipoMap[tipoRaw] || tipoRaw.toUpperCase();
        const dtstart = parseDatePtBR(dataStr);
        if (!dtstart) {
          results.errors.push({ line: r.__line, message: `Invalid date: ${dataStr}` });
          continue;
        }

        // Lookup DOT user by email
        const userRes = await query('SELECT id FROM users WHERE email = $1', [dotEmail]);
        if (userRes.rows.length === 0) {
          results.errors.push({ line: r.__line, message: `DOT user not found: ${dotEmail}` });
          continue;
        }
        const userId = userRes.rows[0].id;

        // Process each store code (comma-separated)
        const storeCodes = lojasStr.split(',').map(s => s.trim()).filter(Boolean);
        if (storeCodes.length === 0) {
          results.errors.push({ line: r.__line, message: 'No store codes provided' });
          continue;
        }

        for (const code of storeCodes) {
          const storeRes = await query('SELECT id FROM stores WHERE codehex = $1', [code]);
          if (storeRes.rows.length === 0) {
            results.errors.push({ line: r.__line, message: `Store not found: ${code}` });
            continue;
          }
          const storeId = storeRes.rows[0].id;

          // Check for duplicates: same type, DOT, store, date
          const dtDate = new Date(dtstart);
          const startOfDay = new Date(dtDate.getFullYear(), dtDate.getMonth(), dtDate.getDate()).toISOString();
          const endOfDay = new Date(dtDate.getFullYear(), dtDate.getMonth(), dtDate.getDate() + 1).toISOString();
          
          const duplicateCheck = await query(
            `SELECT id FROM visits 
             WHERE store_id = $1 AND user_id = $2 AND type = $3 
             AND dtstart >= $4 AND dtstart < $5`,
            [storeId, userId, tipo, startOfDay, endOfDay]
          );
          
          if (duplicateCheck.rows.length > 0) {
            results.errors.push({ 
              line: r.__line, 
              message: `Duplicado: já existe ${tipoRaw} para DOT ${dotEmail} na loja ${code} em ${dataStr}` 
            });
            continue;
          }

          const ins = await query(
            `INSERT INTO visits (store_id, user_id, type, title, description, dtstart, status, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id`,
            [storeId, userId, tipo, titulo, texto || '', dtstart, 'SCHEDULED', userId]
          );
          results.imported += 1;
          results.createdVisitIds.push(ins.rows[0].id);
        }
      } catch (rowErr) {
        results.errors.push({ line: r.__line, message: String(rowErr?.message || rowErr) });
      }
    }

    return res.json(results);
  } catch (error) {
    console.error('Import visitas error:', error);
    return res.status(500).json({ error: 'Failed to import visitas' });
  }
});

export default router;