import api from '../api/axiosInstance';

const groupService = {
  getAll: async () => (await api.get('/groups')).data.data,
  create: async (data) => (await api.post('/groups', data)).data.data,
  update: async (id, data) => (await api.put(`/groups/${id}`, data)).data.data,
  remove: async (id) => (await api.delete(`/groups/${id}`)).data.data
};
export default groupService;