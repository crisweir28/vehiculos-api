// controllers/areasController.js
const pool = require('../db/connection');

// Función interna para obtener email de un área por nombre
exports.getEmail = async (nombreArea) => {
  try {
    const [rows] = await pool.execute(
      'SELECT email FROM areas WHERE nombre = ?', [nombreArea]
    );
    return rows[0]?.email || null;
  } catch { return null; }
};

// GET /api/areas
exports.listar = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM areas ORDER BY nombre ASC');
    res.json({ ok: true, areas: rows });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};

// POST /api/areas
exports.crear = async (req, res) => {
  try {
    const { nombre, email } = req.body;
    if (!nombre || !email)
      return res.status(400).json({ ok: false, error: 'Nombre y email son requeridos.' });

    const [exists] = await pool.execute('SELECT id FROM areas WHERE nombre = ?', [nombre]);
    if (exists.length)
      return res.status(409).json({ ok: false, error: `El área "${nombre}" ya existe.` });

    const id = Date.now();
    await pool.execute('INSERT INTO areas (id, nombre, email) VALUES (?, ?, ?)', [id, nombre, email]);
    res.status(201).json({ ok: true, id, nombre, email });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};

// PATCH /api/areas/:id
exports.actualizar = async (req, res) => {
  try {
    const { nombre, email } = req.body;
    const [result] = await pool.execute(
      'UPDATE areas SET nombre = ?, email = ? WHERE id = ?',
      [nombre, email, req.params.id]
    );
    if (!result.affectedRows)
      return res.status(404).json({ ok: false, error: 'Área no encontrada.' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};

// DELETE /api/areas/:id
exports.eliminar = async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM areas WHERE id = ?', [req.params.id]);
    if (!result.affectedRows)
      return res.status(404).json({ ok: false, error: 'Área no encontrada.' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
};