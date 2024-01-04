const jwt = require('jsonwebtoken')

const secretKey = 'rodri1234'

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' })
  }

  try {
    const decodedToken = jwt.verify(token, secretKey)

    if (decodedToken.roles && Array.isArray(decodedToken.roles)) {
      req.roles = decodedToken.roles.map(role => role.nombre)
    } else {
      req.roles = []
    }

    req.userId = decodedToken.userId
    req.permisos = decodedToken.permisos
    next()
  } catch (error) {
    console.error('Error al verificar el token:', error)
    res.status(401).json({ message: 'Error al verificar el token', error: error.message })
  }
}

module.exports = { authMiddleware }
