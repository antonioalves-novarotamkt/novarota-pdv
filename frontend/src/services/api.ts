import axios, { AxiosInstance, AxiosError } from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
        const isAuthCall = error.config?.url?.startsWith('/auth/');
        if (error.response?.status === 401 && !isAuthCall) {
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

  async downloadProductsExcel(clientId: string, template = false) {
    const response = await this.client.get(`/clients/${clientId}/export/excel`, {
      params: template ? { template: 1 } : undefined,
      responseType: 'blob',
    });
    const disposition: string = response.headers['content-disposition'] ?? '';
    const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'cardapio.xlsx';

    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async importProductsExcel(clientId: string, file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    // The instance defaults to JSON, which makes axios serialize FormData as JSON and drop the file.
    const response = await this.client.post(`/clients/${clientId}/import/excel`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  }
}

export interface ImportResult {
  created: number;
  updated: number;
  categoriesCreated: number;
}

export interface ImportErrorResponse {
  error: string;
  details?: { row: number; message: string }[];
}

export async function readApiError(err: any): Promise<ImportErrorResponse> {
  if (!err.response) {
    return { error: `Não foi possível conectar ao servidor (${API_URL}).` };
  }
  let data = err.response.data;
  if (data instanceof Blob) {
    try {
      data = JSON.parse(await data.text());
    } catch {
      data = null;
    }
  }
  return { error: data?.error || 'Erro inesperado. Tente novamente.', details: data?.details };
}

export const apiClient = new ApiClient();
