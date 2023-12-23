const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
app.use(bodyParser.json())
const PORT = process.env.PORT ?? 1234
const pool = require('./tabla.js')
const secretKey = 'rodri1234'
app.get('/usuarios', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM usuarios')
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al obtener usuarios' })
  }
})
app.post('/registro', async (req, res) => {
  const { nombre, email, password } = req.body

  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await pool.query('INSERT INTO usuarios (nombre, email, password, roles, permisos) VALUES ($1, $2, $3, $4, $5) RETURNING id', [nombre, email, hashedPassword, ['user'], ['lectura']])

    const usuarioId = result.rows[0].id

    const token = jwt.sign({ userId: usuarioId, roles: ['Admin'], permisos: ['lectura', 'escritura'] }, secretKey, { expiresIn: '1h' })

    res.json({ token, message: 'Usuario registrado y autenticado correctamente' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al registrar usuario' })
  }
})
app.post('/usuarios', async (req, res) => {
  const { nombre, email, password } = req.body

  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    await pool.query('INSERT INTO usuarios (nombre, email, password) VALUES ($1, $2, $3)', [nombre, email, hashedPassword])
    res.status(201).json({ message: 'Usuario creado correctamente' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al crear usuario' })
  }
})
app.post('/login', async (req, res) => {
  const { email, password } = req.body

  try {
    const { rows } = await pool.query('SELECT password FROM usuarios WHERE email = $1', [email])

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' })
    }

    const hashedPassword = rows[0].password
    const isMatch = await bcrypt.compare(password, hashedPassword)

    if (!isMatch) {
      res.status(401).json({ message: 'Usuario o contraseña incorrectos' })
    } else {
      res.json({ message: 'Usuario autenticado correctamente' })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al autenticar usuario' })
  }
})

app.put('/usuarios/:id', async (req, res) => {
  const { id } = req.params
  const { nombre, email, password } = req.body

  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    await pool.query(
      'UPDATE usuarios SET nombre = $1, email = $2, password = $3 WHERE id = $4',
      [nombre, email, hashedPassword, id]
    )
    res.status(200).json({ message: 'Usuario modificado correctamente' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al modificar usuario' })
  }
})

app.listen(PORT, () => {
  console.log(`server listening on port http://localhost:${PORT}`)
})
