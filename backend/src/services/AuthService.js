const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET } = require('../config');
const userRepository = require('../repositories/UserRepository');

class AuthService {
  async login(username, password) {
    const user = userRepository.findByUsername(username);
    if (!user) {
      throw { status: 401, message: 'Username atau password salah' };
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      throw { status: 401, message: 'Username atau password salah' };
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, username: user.username, role: user.role, teamId: user.teamId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: { id: user.id, name: user.name, username: user.username, role: user.role, teamId: user.teamId }
    };
  }

  verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
  }

  async getUserById(id) {
    const user = userRepository.findById(id);
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  }
}

module.exports = new AuthService();