import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ApiError {
  error: string;
  message?: string;
}

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          this.clearToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      this.token = storedToken;
    }
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('accessToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('clientId');
  }

  // Auth
  async register(email: string, password: string, name: string) {
    const response = await this.client.post('/auth/register', {
      email,
      password,
      name,
    });
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  // Clients
  async getClients() {
    const response = await this.client.get('/clients');
    return response.data.data;
  }

  async createClient(name: string, slug: string, email: string, phone?: string) {
    const response = await this.client.post('/clients', {
      name,
      slug,
      email,
      phone,
    });
    return response.data.data;
  }

  async getClient(clientId: string) {
    const response = await this.client.get(`/clients/${clientId}`);
    return response.data.data;
  }

  async updateClient(clientId: string, data: Partial<any>) {
    const response = await this.client.patch(`/clients/${clientId}`, data);
    return response.data.data;
  }

  async deleteClient(clientId: string) {
    const response = await this.client.delete(`/clients/${clientId}`);
    return response.data;
  }

  // Products
  async getProducts(clientId: string, categoryId?: string) {
    const response = await this.client.get(`/clients/${clientId}/products`, {
      params: { categoryId },
    });
    return response.data.data;
  }

  async createProduct(clientId: string, productData: any) {
    const response = await this.client.post(
      `/clients/${clientId}/products`,
      productData
    );
    return response.data.data;
  }

  async getProduct(clientId: string, productId: string) {
    const response = await this.client.get(
      `/clients/${clientId}/products/${productId}`
    );
    return response.data.data;
  }

  async updateProduct(clientId: string, productId: string, data: any) {
    const response = await this.client.patch(
      `/clients/${clientId}/products/${productId}`,
      data
    );
    return response.data.data;
  }

  async deleteProduct(clientId: string, productId: string) {
    const response = await this.client.delete(
      `/clients/${clientId}/products/${productId}`
    );
    return response.data;
  }
}

export const apiClient = new ApiClient();
