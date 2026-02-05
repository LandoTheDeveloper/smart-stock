import axios from "axios";

// TODO: UPDATE TO MAIN WEBSITE, MOBILE DEV ONLY
export const API_BASE_URL = "https://nonedified-bailey-slangily.ngrok-free.dev";

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
    } else {
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

