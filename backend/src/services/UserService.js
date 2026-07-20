const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/UserRepository');

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 6;

class UserService {
  async getAll() {
    const users = await userRepository.findAll();
    // Hilangkan password dari response untuk keamanan
    return users.map(({ password, ...user }) => user);
  }

  async getById(id) {
    const user = await userRepository.findById(id);
    if (!user) throw { status: 404, message: 'User tidak ditemukan' };
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async create(data) {
    if (!data.name || !data.username || !data.password || !data.role) {
      throw { status: 400, message: 'Semua field (name, username, password, role) wajib diisi' };
    }
    if (data.password.length < MIN_PASSWORD_LENGTH) {
      throw { status: 400, message: `Password minimal ${MIN_PASSWORD_LENGTH} karakter` };
    }

    const existingUser = await userRepository.findByUsername(data.username);
    if (existingUser) {
      throw { status: 400, message: 'Username sudah digunakan' };
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const newUser = {
      id: uuidv4(),
      name: data.name,
      username: data.username,
      password: hashedPassword,
      role: data.role,
      teamId: data.teamId || null
    };
    const created = await userRepository.create(newUser);
    const { password: _, ...result } = created;
    return result;
  }

  async update(id, data) {
    const existing = await userRepository.findById(id);
    if (!existing) throw { status: 404, message: 'User tidak ditemukan' };

    // Cek duplikasi username jika username diganti
    if (data.username && data.username !== existing.username) {
      const isDuplicate = await userRepository.findByUsername(data.username);
      if (isDuplicate) throw { status: 400, message: 'Username sudah digunakan' };
    }

    // Password hanya diproses ulang kalau memang dikirim & tidak kosong.
    // Endpoint ini BUKAN jalur reset password oleh admin -- untuk itu pakai
    // resetPassword() di bawah, yang tercatat siapa & kapan me-reset-nya.
    let password = existing.password;
    if (data.password) {
      if (data.password.length < MIN_PASSWORD_LENGTH) {
        throw { status: 400, message: `Password minimal ${MIN_PASSWORD_LENGTH} karakter` };
      }
      password = await bcrypt.hash(data.password, SALT_ROUNDS);
    }

    const updated = {
      name: data.name || existing.name,
      username: data.username || existing.username,
      role: data.role || existing.role,
      password,
      teamId: data.teamId !== undefined ? data.teamId : existing.teamId
    };

    const result = await userRepository.update(id, updated);
    const { password: _, ...safeResult } = result;
    return safeResult;
  }

  /**
   * Reset password oleh admin. Terpisah dari update() biasa supaya jelas
   * ini aksi administratif (bukan user ganti password sendiri), dan
   * tercatat siapa admin yang melakukannya & kapan -- penting untuk audit
   * trail di skala production.
   */
  async resetPassword(id, newPassword, adminId) {
    const existing = await userRepository.findById(id);
    if (!existing) throw { status: 404, message: 'User tidak ditemukan' };
    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
      throw { status: 400, message: `Password baru minimal ${MIN_PASSWORD_LENGTH} karakter` };
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const updated = await userRepository.update(id, {
      password: hashedPassword,
      passwordResetAt: new Date().toISOString(),
      passwordResetBy: adminId
    });

    const { password: _, ...safeResult } = updated;
    return safeResult;
  }

  async delete(id) {
    const existing = await userRepository.findById(id);
    if (!existing) throw { status: 404, message: 'User tidak ditemukan' };

    await userRepository.delete(id);
    return { message: 'User berhasil dihapus' };
  }
}

module.exports = new UserService();