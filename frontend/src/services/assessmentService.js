import api from '../api/axiosInstance';

const create = async (selections) => {
  const res = await api.post('/assessments', { selections });
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

export default { create, getAll, getById };