import axios from "axios";

export const API_BASE_URL = `${process.env.EXPO_PUBLIC_API_URL}`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      console.error("Request timeout - backend took too long");
    } else if (!error.response) {
      console.error("Network error - cannot reach:", API_BASE_URL);
    } else if(error.response.status === 401){
      console.log("Session invalid or expired. User needs to login.");
    }else { 
      console.error("API error:", error.response.status, error.response.data);
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

