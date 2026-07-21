const SettingService = require('../services/SettingService');

const SettingController = {
  async get(req, res, next) {
    try {
      const { id } = req.params;
      const value = await SettingService.getSetting(id);
      res.json({ success: true, message: 'Setting retrieved', data: { id, value } });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { value } = req.body;
      const updated = await SettingService.updateSetting(id, value);
      res.json({ success: true, message: 'Pengaturan berhasil diperbarui', data: updated });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = SettingController;