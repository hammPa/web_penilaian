import api from '../api/axiosInstance';

const getAll = async (sessionId) => {
  // Jika parameter sessionId dikirim, tambahkan sebagai query params
  const config = sessionId ? { params: { sessionId } } : {};
  const res = await api.get('/tables', config);
  return res.data.data;
};

const getById = async (id) => {
  const res = await api.get(`/tables/${id}`);
  return res.data.data;
};

const create = async (data) => {
  const res = await api.post('/tables', data);
  return res.data.data;
};

const update = async (id, data) => {
  const res = await api.put(`/tables/${id}`, data);
  return res.data.data;
};

const remove = async (id) => {
  const res = await api.delete(`/tables/${id}`);
  return res.data;
};

export default { getAll, getById, create, update, remove };