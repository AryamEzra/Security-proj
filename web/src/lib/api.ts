import axios from "axios";

// const api = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
//   headers: { "Content-Type": "application/json" }
// });

const api = axios.create({
  baseURL: '/api', // Use the proxy path instead of full URL
  headers: { "Content-Type": "application/json" }
});

// Add request interceptor to include auth tokens
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const response = await api.post("/refresh", { refreshToken });
        
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        
        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Redirect to login if refresh fails
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export async function login(username: string, password: string) {
  const { data } = await api.post("/login", { username, password });
  
  // Store tokens for future requests
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  
  return { ...data, userId: data.user?.id || 1 };
}

export async function refresh(refreshToken?: string) {
  const tokenToUse = refreshToken || localStorage.getItem('refreshToken');
  if (!tokenToUse) {
    throw new Error('No refresh token available');
  }
  
  const { data } = await api.post("/refresh", { refreshToken: tokenToUse });
  
  // Update stored tokens
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  
  return data;
}

export async function me() {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    throw new Error('No access token available');
  }
  
  const { data } = await api.post("/me", { accessToken });
  return data;
}

export async function getSessionsForUser(userId: number) {
  const { data } = await api.get(`/sessions/${userId}`);
  return data;
}

export async function getEvents() {
  const { data } = await api.get("/events");
  return data;
}

export async function revokeSession(sessionId: number) {
  const { data } = await api.post("/revoke/session", { sessionId });
  return data;
}

export async function revokeFamily(familyId: number) {
  const { data } = await api.post("/revoke/family", { familyId });
  return data;
}

export async function getUsers() {
  const { data } = await api.get("/users");
  return data;
}

export async function getStats() {
  const { data } = await api.get("/stats");
  return data;
}