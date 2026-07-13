import api from '../api/axiosInstance';

const getAll = async (criteriaId = '') => {
  const params = criteriaId ? { criteriaId } : {};
  const res = await api.get('/variables', { params });
  return res.data.data;
};

const getById = async (id) => {
  const res = await api.get(`/variables/${id}`);
  return res.data.data;
};

const create = async (data) => {
  const res = await api.post('/variables', data);
  return res.data.data;
};

const update = async (id, data) => {
  const res = await api.put(`/variables/${id}`, data);
  return res.data.data;
};

const remove = async (id) => {
  const res = await api.delete(`/variables/${id}`);
  return res.data;
};

export default { getAll, getById, create, update, remove };