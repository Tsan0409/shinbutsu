import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Customer {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  postCode: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerRequest {
  id?: string;
  username: string;
  email: string;
  phoneNumber: string;
  postCode: string;
}

export const customerApi = {
  // 全顧客取得
  getAll: async (): Promise<Customer[]> => {
    const response = await api.get<Customer[]>('/customers');
    return response.data;
  },

  // 顧客詳細取得
  getById: async (id: string): Promise<Customer> => {
    const response = await api.get<Customer>(`/customers/${id}`);
    return response.data;
  },

  // 顧客作成
  create: async (customer: CustomerRequest): Promise<Customer> => {
    const response = await api.post<Customer>('/customers', customer);
    return response.data;
  },

  // 顧客更新
  update: async (id: string, customer: Omit<CustomerRequest, 'id'>): Promise<Customer> => {
    const response = await api.put<Customer>(`/customers/${id}`, customer);
    return response.data;
  },

  // 顧客削除
  delete: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },
};
