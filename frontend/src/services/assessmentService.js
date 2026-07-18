import api from '../api/axiosInstance';

const create = async (groupId, sessionId, selections, photos = [], recommendation = '') => {
  const res = await api.post('/assessments', { groupId, sessionId, selections, photos, recommendation });
  return res.data.data;
};

const getAll = async () => {
  const res = await api.get('/assessments');
  return res.data.data;
};

const getById = async (id) => {
  const res = await api.get(`/assessments/${id}`);
  return res.data.data;
};

const update = async (id, selections, photos, recommendation) => {
  const res = await api.put(`/assessments/${id}`, { selections, photos, recommendation });
  return res.data.data;
};

export default { create, getAll, getById, update };