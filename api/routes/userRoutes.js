const express = require('express')
const router = express.Router()
const { jwtMiddleware } = require('../middlewares/authMiddleware')
const { getUsuarios, registroUsuario, loginUsuario, actualizarUsuario, desactivarUsuario, reactivarUsuario } = require('../controllers/userControllers')

router.get('/usuarios', jwtMiddleware, getUsuarios)
router.post('/registro', registroUsuario)
router.post('/login', loginUsuario)
router.put('/usuarios/:id', actualizarUsuario)
router.put('/usuarios/desactivar/:id', desactivarUsuario)
router.put('/usuarios/reactivar/:id', reactivarUsuario)

module.exports = router
