const { v4: uuidv4 } = require('uuid');
// Note: Sangat disarankan menggunakan bcrypt untuk hashing password di production
// const bcrypt = require('bcrypt'); 
const userRepository = require('../repositories/UserRepository');

class UserService {
  getAll() {
    const users = userRepository.findAll();
    // Hilangkan password dari response untuk keamanan
    return users.map(({ password, ...user }) => user);
  }

  getById(id) {
    const user = userRepository.findById(id);
    if (!user) throw { status: 404, message: 'User tidak ditemukan' };
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async create(data) {
    if (!data.name || !data.username || !data.password || !data.role) {
      throw { status: 400, message: 'Semua field (name, username, password, role) wajib diisi' };
    }

    const existingUser = userRepository.findByUsername(data.username);
    if (existingUser) {
      throw { status: 400, message: 'Username sudah digunakan' };
    }

    // const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = {
      id: uuidv4(),
      name: data.name,
      username: data.username,
      password: data.password, // Ganti dengan hashedPassword jika pakai bcrypt
      role: data.role,
      teamId: data.teamId || null
    };
    
    const created = userRepository.create(newUser);
    const { password: _, ...result } = created;
    return result;
  }

  async update(id, data) {
    const existing = userRepository.findById(id);
    if (!existing) throw { status: 404, message: 'User tidak ditemukan' };

    // Cek duplikasi username jika username diganti
    if (data.username && data.username !== existing.username) {
      const isDuplicate = userRepository.findByUsername(data.username);
      if (isDuplicate) throw { status: 400, message: 'Username sudah digunakan' };
    }

    const updated = {
      name: data.name || existing.name,
      username: data.username || existing.username,
      role: data.role || existing.role,
      password: data.password ? data.password : existing.password, // Jangan diubah jika kosong
      teamId: data.teamId !== undefined ? data.teamId : existing.teamId
    };

    const result = userRepository.update(id, updated);
    const { password: _, ...safeResult } = result;
    return safeResult;
  }

  delete(id) {
    const existing = userRepository.findById(id);
    if (!existing) throw { status: 404, message: 'User tidak ditemukan' };
    
    // Opsional: Mencegah admin menghapus dirinya sendiri
    // if (existing.role === 'admin') throw { status: 403, message: 'Tidak dapat menghapus admin' };

    userRepository.delete(id);
    return { message: 'User berhasil dihapus' };
  }
}

module.exports = new UserService();