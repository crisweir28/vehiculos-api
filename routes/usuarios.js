//routes/usuarios.js
const router = require('express').Router();
const ctrl   = require('../controllers/usuariosController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/',          requireAdmin, ctrl.listar);
router.post('/',         requireAdmin, ctrl.crear);
router.delete('/:usuario', requireAdmin, ctrl.eliminar);
router.patch('/:usuario', requireAdmin, ctrl.actualizar);

module.exports = router;
