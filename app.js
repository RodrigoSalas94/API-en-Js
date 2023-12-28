const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const usuariosRoutes = require('./api/routes/userRoutes')
const PORT = process.env.PORT || 1234

app.use(bodyParser.json())
app.use('/api', usuariosRoutes)

app.listen(PORT, () => {
  console.log(`server listening on port http://localhost:${PORT}`)
})
