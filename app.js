const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const pool = require('./connection.js')

app.use(bodyParser.json())

const PORT = process.env.PORT || 1234
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

app.get('/usuarios', jwtMiddleware, async (req, res) => {
  try {
    const { userId, roles } = req

    if (roles.includes('Admin')) {
      const query = `
        SELECT u.id, u.nombre, u.email, r.nombre as rol, p.escritura, p.lectura
        FROM usuarios u
        INNER JOIN roles r ON u.id = r.usuarioid
        INNER JOIN permisos p ON u.id = p.idpermisos
        WHERE u.activo = true; -- Mostrar solo usuarios activos
      `
      const { rows } = await pool.query(query)
      return res.json(rows)
    } else if (roles.includes('Usuario')) {
      const query = `
        SELECT u.id, u.nombre, u.email, r.nombre as rol, p.escritura, p.lectura
        FROM usuarios u
        INNER JOIN roles r ON u.id = r.usuarioid
        INNER JOIN permisos p ON u.id = p.idpermisos
        WHERE u.id = $1
      `
      const { rows } = await pool.query(query, [userId])
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' })
      }
      return res.json({
        id: rows[0].id,
        nombre: rows[0].nombre,
        email: rows[0].email,
        roles: rows[0].roles,
        permisos: rows[0].permisos
      })
    } else {
      return res.status(403).json({ message: 'Acceso no autorizado' })
    }
  } catch (error) {
    console.error('Error al procesar la solicitud:', error)
    res.status(500).json({ message: 'Error interno del servidor', error: error.message })
  }
})

app.post('/registro', async (req, res) => {
  const { nombre, email, password, roles, permisos } = req.body

  try {
    const emailExistente = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email])
    if (emailExistente.rows.length > 0) {
      return res.status(400).json({ message: 'El correo ya está registrado' })
    }

    const nombreExistente = await pool.query('SELECT * FROM usuarios WHERE nombre = $1', [nombre])
    if (nombreExistente.rows.length > 0) {
      return res.status(400).json({ message: 'El nombre ya está registrado' })
    }

    const hashedPassword = await bcrypt.hash(password, 4)
    const resultUsuario = await pool.query('INSERT INTO usuarios (nombre, email, password) VALUES ($1, $2, $3) RETURNING id', [nombre, email, hashedPassword])
    const usuarioId = resultUsuario.rows[0].id

    await Promise.all(roles.map(role => pool.query('INSERT INTO roles (nombre, usuarioid) VALUES ($1, $2)', [role, usuarioId])))
    await pool.query('INSERT INTO permisos (idpermisos, escritura, lectura) VALUES ($1, $2, $3)', [usuarioId, permisos.escritura, permisos.lectura])

    const token = jwt.sign({
      userId: usuarioId,
      roles: roles.map(role => ({ nombre: role })),
      permisos: { escritura: permisos.escritura, lectura: permisos.lectura }
    }, secretKey, { expiresIn: '1h' })

    res.json({ token, message: 'Usuario registrado y autenticado correctamente' })
  } catch (error) {
    console.error('Error al registrar usuario:', error)
    res.status(500).json({ message: 'Error al registrar usuario', error: error.message })
  }
})

app.post('/login', async (req, res) => {
  const { email, password } = req.body

  try {
    const { rows } = await pool.query('SELECT id, password FROM usuarios WHERE email = $1', [email])

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' })
    }

    const usuarioId = rows[0].id
    const hashedPassword = rows[0].password
    const isMatch = await bcrypt.compare(password, hashedPassword)

    if (!isMatch) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' })
    }

    const rolesResult = await pool.query('SELECT nombre FROM roles WHERE usuarioid = $1', [usuarioId])
    const permisosResult = await pool.query('SELECT escritura, lectura FROM permisos WHERE idpermisos = $1', [usuarioId])
    const roles = rolesResult.rows.map(role => ({ nombre: role.nombre }))
    const permisos = permisosResult.rows[0]

    const token = jwt.sign({
      userId: usuarioId,
      roles,
      permisos
    }, secretKey, { expiresIn: '1h' })

    res.json({ token, message: 'Usuario autenticado correctamente' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al autenticar usuario' })
  }
})

app.put('/usuarios/:id', async (req, res) => {
  const { id } = req.params
  const { nombre, email, password, roles, permisos } = req.body

  try {
    const hashedPassword = await bcrypt.hash(password, 4)
    const userId = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1', [email]
    )
    if (userId.length !== 0) {
      return res.status(400).json({ message: 'El email que intenta ingresar ya existe' })
    }
    await pool.query(
      'UPDATE usuarios SET nombre = $1, email = $2, password = $3 WHERE id = $4',
      [nombre, email, hashedPassword, id]
    )

    await pool.query('DELETE FROM roles WHERE usuarioid = $1', [id])
    await pool.query('DELETE FROM permisos WHERE idpermisos = $1', [id])

    await Promise.all(roles.map(rol => pool.query('INSERT INTO roles (nombre, usuarioid) VALUES ($1, $2)', [rol, id])))
    await pool.query('INSERT INTO permisos (idpermisos, escritura, lectura) VALUES ($1, $2, $3)', [id, permisos.escritura, permisos.lectura])

    res.status(200).json({ message: 'Usuario modificado correctamente' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al modificar usuario', error: error.message })
  }
})

app.put('/usuarios/desactivar/:id', async (req, res) => {
  const { id } = req.params
  const token = req.headers.authorization

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' })
  }

  try {
    const decodedToken = jwt.verify(token, secretKey)
    const roles = decodedToken.roles.map(role => role.nombre)

    if (!roles.includes('Admin')) {
      return res.status(403).json({ message: 'Acceso no autorizado' })
    }

    await pool.query('UPDATE usuarios SET activo = false WHERE id = $1', [id])

    res.status(200).json({ message: 'Usuario desactivado correctamente' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al desactivar usuario', error: error.message })
  }
})

// Ruta para reactivar usuarios
app.put('/usuarios/reactivar/:id', async (req, res) => {
  const { id } = req.params
  const token = req.headers.authorization

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' })
  }

  try {
    const decodedToken = jwt.verify(token, secretKey)
    const roles = decodedToken.roles.map(role => role.nombre)

    if (!roles.includes('Admin')) {
      return res.status(403).json({ message: 'Acceso no autorizado' })
    }

    await pool.query('UPDATE usuarios SET activo = true WHERE id = $1', [id])

    res.status(200).json({ message: 'Usuario reactivado correctamente' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al reactivar usuario', error: error.message })
  }
})
app.listen(PORT, () => {
  console.log(`server listening on port http://localhost:${PORT}`)
})
