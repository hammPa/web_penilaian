import api from '../api/axiosInstance';

const getAll = async () => {
  const res = await api.get('/criteria');
  return res.data.data;
};

const getById = async (id) => {
  const res = await api.get(`/criteria/${id}`);
  return res.data.data;
};

const create = async (data) => {
  const res = await api.post('/criteria', data);
  return res.data.data;
};

const update = async (id, data) => {
  const res = await api.put(`/criteria/${id}`, data);
  return res.data.data;
};

const remove = async (id) => {
  const res = await api.delete(`/criteria/${id}`);
  return res.data;
};

export default { getAll, getById, create, update, remove };