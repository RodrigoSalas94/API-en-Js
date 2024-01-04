const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middlewares/authMiddleware')
const { getUsuarios, registroUsuario, loginUsuario, actualizarUsuario, desactivarUsuario, reactivarUsuario } = require('../controllers/userControllers')
const { rolesAssing } = require('../controllers/rolesControllers')

router.get('/usuarios', authMiddleware, getUsuarios)
router.post('/registro', registroUsuario)
router.post('/login', loginUsuario)
router.put('/usuarios/:id', actualizarUsuario)
router.put('/usuarios/desactivar/:id', desactivarUsuario)
router.put('/usuarios/reactivar/:id', reactivarUsuario)
router.post('/roles/asignar-roles/:id', authMiddleware, rolesAssing)

module.exports = router
