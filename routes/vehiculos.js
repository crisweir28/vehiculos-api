// routes/vehiculos.js
const router = require('express').Router();
const ctrl   = require('../controllers/vehiculosController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/',                    requireAuth,  ctrl.listar);
router.get('/:id',                 requireAuth,  ctrl.obtener);
router.post('/',                   requireAdmin, ctrl.crear);
router.delete('/:id',              requireAdmin, ctrl.eliminar);
router.get('/:id/movimientos',     requireAuth,  ctrl.historial);
router.patch('/:id/estatus',       requireAdmin, ctrl.cambiarEstatus);
router.post('/:id/salida',         requireAuth,  ctrl.registrarSalida);
router.post('/:id/entrada',        requireAuth,  ctrl.registrarEntrada);
router.get('/:id/mantenimientos',  requireAuth,  ctrl.historialMantenimientos);

module.exports = router;