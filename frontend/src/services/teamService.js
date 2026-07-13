import api from '../api/axiosInstance';

const teamService = {
  getAll: async () => (await api.get('/teams')).data.data,
  getById: async (id) => (await api.get(`/teams/${id}`)).data.data,
  create: async (data) => (await api.post('/teams', data)).data.data,
  update: async (id, data) => (await api.put(`/teams/${id}`, data)).data.data,
  remove: async (id) => (await api.delete(`/teams/${id}`)).data.data
};
export default teamService;