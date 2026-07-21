import api from '../api/axiosInstance';

const settingService = {
  get: async (id) => {
    const response = await api.get(`/settings/${id}`);
    return response.data.data;
  },
  update: async (id, value) => {
    const response = await api.put(`/settings/${id}`, { value });
    return response.data.data;
  }
};

export default settingService;