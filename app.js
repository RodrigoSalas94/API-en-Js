const express = require('express')
const app = express()
const usuariosRoutes = require('./api/routes/userRoutes')
const PORT = process.env.PORT || 1234

app.use(express.json())
app.use('/api', usuariosRoutes)

app.listen(PORT, () => {
  console.log(`server listening on port http://localhost:${PORT}`)
})
