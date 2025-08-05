import axios from "axios";

const API_URL = "http://localhost:5000/api/auth";

export const register = async (userData) => {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
};

export const login = async (credentials) => {
    const res = await axios.post(`${API_URL}/login`, credentials);
    return res.data;
};
