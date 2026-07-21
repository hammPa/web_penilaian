const settingRepository = require('../repositories/SettingRepository');

const SettingService = {
  async getSetting(id) {
    const setting = await settingRepository.findById(id);
    if (!setting) {
      // Fallback default jika belum ada di database
      if (id === 'whatsapp_admin') return '6281234567890';
      return '';
    }
    return setting.value;
  },

  async updateSetting(id, value) {
    const existing = await settingRepository.findById(id);
    if (existing) {
      return await settingRepository.update(id, { value });
    } else {
      return await settingRepository.create({ id, value });
    }
  }
};

module.exports = SettingService;