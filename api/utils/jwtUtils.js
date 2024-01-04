const jwt = require('jsonwebtoken')
const secretKey = 'rodri1234'

function generateToken (payload, secretKey, options) {
  return jwt.sign(payload, secretKey, options)
}
function verifyToken (token, secretKey) {
  return jwt.verify(token, secretKey)
}
module.exports = {
  secretKey,
  generateToken,
  verifyToken
}
