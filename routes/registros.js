//routes/registros.js
const router = require('express').Router();
const ctrl   = require('../controllers/registrosController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/activos',         requireAuth, ctrl.activos);
router.get('/stats',           requireAuth, ctrl.stats);
router.get('/',                requireAuth, ctrl.listar);
router.get('/:folio',          requireAuth, ctrl.obtener);
router.post('/',               requireAuth, ctrl.crear);
router.patch('/:folio/salida', requireAuth, ctrl.registrarSalida);

module.exports = router;