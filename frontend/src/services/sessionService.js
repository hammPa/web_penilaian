import api from '../api/axiosInstance';

const getAll = async () => {
  const res = await api.get('/sessions');
  return res.data.data;
};

const getById = async (id) => {
  const res = await api.get(`${'/sessions'}/${id}`);
  return res.data.data;
};

const create = async (data) => {
  const res = await api.post('/sessions', data);
  return res.data.data;
};

const update = async (id, data) => {
  const res = await api.put(`${'/sessions'}/${id}`, data);
  return res.data.data;
};

const remove = async (id) => {
  const res = await api.delete(`${'/sessions'}/${id}`);
  return res.data; 
};

const duplicate = async (id, data) => {
  const res = await api.post(`${'/sessions'}/${id}/duplicate`, data);
  return res.data.data;
};

export default { getAll, getById, create, update, remove, duplicate };