// routes/areas.js
const router = require('express').Router();
const ctrl   = require('../controllers/areasController');
const { requireAdmin } = require('../middleware/auth');

router.get('/',        ctrl.listar);
router.post('/',       requireAdmin, ctrl.crear);
router.patch('/:id',   requireAdmin, ctrl.actualizar);
router.delete('/:id',  requireAdmin, ctrl.eliminar);

module.exports = router;