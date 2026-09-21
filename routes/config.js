// routes/config.js
const router = require('express').Router();
const ctrl   = require('../controllers/configController');
const { requireAdmin } = require('../middleware/auth');

router.get('/',  ctrl.obtener);
router.put('/',  requireAdmin, ctrl.guardar);

module.exports = router;