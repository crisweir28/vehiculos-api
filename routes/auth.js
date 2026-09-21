// routes/auth.js
const router = require('express').Router();
const ctrl   = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/login',      ctrl.login);
router.post('/logout',     ctrl.logout);
router.get('/verificar',   requireAuth, ctrl.verificar);
router.post('/recuperar',  ctrl.recuperar);   // público
router.post('/reset',      ctrl.resetPassword); // público

module.exports = router;