// Auth & Users
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface DecodedToken {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// User
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// Client (Tenant)
export interface Client {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  logo?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Category
export interface Category {
  id: string;
  name: string;
  icon?: string;
  order: number;
  clientId: string;
  createdAt: string;
  updatedAt: string;
}

// Product with calculated price
export interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  basePrice: number; // Preço base
  markup: number; // Margem em %
  finalPrice: number; // Preço calculado
  active: boolean;
  clientId: string;
  categoryId?: string;
  category?: Category;
  images: ProductImage[];
  channelPrices: ChannelPrice[];
  createdAt: string;
  updatedAt: string;
}

// Product Image
export interface ProductImage {
  id: string;
  url: string;
  order: number;
  productId: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
}

// Sales Channel
export interface SalesChannel {
  id: string;
  name: string;
  icon?: string;
  order: number;
  clientId: string;
}

// Channel Price
export interface ChannelPrice {
  id: string;
  price: number;
  extraMarkup: number;
  isActive: boolean;
  productId: string;
  channelName: string;
  createdAt: string;
  updatedAt: string;
}

// API Request/Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Forms
export interface CreateProductInput {
  name: string;
  description?: string;
  sku?: string;
  basePrice: number;
  markup?: number;
  categoryId?: string;
  active?: boolean;
}

export interface CreateClientInput {
  name: string;
  email: string;
  phone?: string;
  slug: string;
}

export interface UpdateClientInput {
  name?: string;
  email?: string;
  phone?: string;
}

export interface ImportExcelInput {
  file: File;
}
