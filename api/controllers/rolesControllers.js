const pool = require('../connections/connection')

const rolesAssing = async (req, res) => {
  const { id } = req.params
  const { roles } = req.body

  try {
    const { roles: userRoles } = req
    if (!userRoles.includes('Admin')) {
      return res.status(403).json({ message: 'Acceso no autorizado para asignar roles' })
    }

    await pool.query('DELETE FROM roles WHERE usuarioid = $1', [id])

    await Promise.all(roles.map(role => pool.query('INSERT INTO roles (nombre, usuarioid) VALUES ($1, $2)', [role, id])))
    return res.status(200).json({ message: 'Roles asignados correctamente' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error al asignar los roles', error: error.message })
  }
}

module.exports = {
  rolesAssing
}
