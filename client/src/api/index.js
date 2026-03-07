import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

export const UserSignUp = (data) => API.post("/api/user/signup", data);
export const UserSignIn = (data) => API.post("/api/user/signin", data);

export const getDashboardDetails = (token) =>
  API.get("/api/user/dashboard", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getWorkouts = (token, date) =>
  API.get(`/api/user/workout?date=${date}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const addWorkout = (token, data) =>
  API.post(`/api/user/workout`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });