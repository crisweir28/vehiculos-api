// routes/citas.js
const router = require('express').Router();
const ctrl   = require('../controllers/citasController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/hoy',               requireAuth, ctrl.hoy);
router.get('/',                  requireAuth, ctrl.listar);
router.get('/buscar',                         ctrl.buscar);
router.post('/',                              ctrl.crear);
router.get('/aprobar/:token',                 ctrl.aprobar);
router.get('/rechazar/:token',                ctrl.rechazar);
router.get('/fecha',                          ctrl.porFecha);
router.patch('/:oficio/accion',  requireAuth, ctrl.accion);

module.exports = router;