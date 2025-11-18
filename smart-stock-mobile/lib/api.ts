
import axios from "axios";

export const api = axios.create({
  // TODO: replace with backend port
  // Example: "http://192.168.1.23:5000"
  baseURL: "http://192.168.0.123:5000",
});


export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};
