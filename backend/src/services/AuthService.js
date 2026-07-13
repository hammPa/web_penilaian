const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const userRepository = require('../repositories/UserRepository');

class AuthService {
  async login(username, password) {
    const user = userRepository.findByUsername(username);
    if (!user || user.password !== password) {
      throw { status: 401, message: 'Username atau password salah' };
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    return {
      token,
      user: { id: user.id, username: user.username, role: user.role }
    };
  }

  verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
  }
}

module.exports = new AuthService();