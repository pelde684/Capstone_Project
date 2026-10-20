import axios from "axios";

const API_URL = "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const loginUser = async (email, password) => {
  return api.post("/auth/login", {
    email,
    password,
  });
};

export const getBelongings = async () => {
  return api.get("/belongings");
};

export const getStudents = async () => {
  return api.get("/students");
};

export const verifyBelonging = async (id, status) => {
  return api.put(`/belongings/${id}/verify`, {
    status,
  });
};

export const confirmHandover = async (id) => {
  return api.put(`/belongings/${id}/handover`);
};

export default api;