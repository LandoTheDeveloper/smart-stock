import axios from "axios";

const API_BASE_URL = "https://smart-stock.food";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth.token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


