const jwt = require('jsonwebtoken')

const secretKey = 'rodri1234'

const jwtMiddleware = (req, res, next) => {
  if (req.method === 'GET' && req.path === '/usuarios') {
    const token = req.headers.authorization

    if (!token) {
      return res.status(401).json({ message: 'Token no proporcionado' })
    }

    try {
      const decodedToken = jwt.verify(token, secretKey)
      req.userId = decodedToken.userId
      req.roles = decodedToken.roles.map(role => role.nombre)
      req.permisos = decodedToken.permisos
      next()
    } catch (error) {
      console.error('Error al verificar el token:', error)
      res.status(401).json({ message: 'Error al verificar el token', error: error.message })
    }
  } else {
    next()
  }
}

module.exports = { jwtMiddleware }
