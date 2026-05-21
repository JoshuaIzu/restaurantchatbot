import type {
  ChatResponse,
  MenuItem,
  Order,
  Wallet,
  Transaction,
  PaymentInitRequest,
  PaymentInitResponse,
  PaymentStatusResponse,
} from '../types'

const API_BASE = import.meta.env.VITE_API_BASE_URL

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`,{
    headers: { 'Content-Type': 'application/json'},
    credentials: 'include',
    ...options,
  })

  if(!response.ok){
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || `API Error: ${response.status}`)
  }
  return response.json()
}

export const apiClient = {
  async sendChatMessage(message: string): Promise<ChatResponse> {
    return request<ChatResponse>('api/chat',{
      method: 'POST',
      body: JSON.stringify({ message })
        })
  },

  async getMenu(): Promise<MenuItem[]> {
    return request<MenuItem[]>('api/menu')
  },
  async getMenuItem(id:string): Promise<MenuItem> {
    return request<MenuItem>(`api/menu/${id}`)
  },

  async getWallet(sessionId: string): Promise<Wallet> {
    return request<Wallet>(`api/wallet/${sessionId}`)
  },
  async getOrders(sessionId: string): Promise<Order[]> {
    return request<Order[]>(`api/orders/${sessionId}`)
  },
  async getTransactions(sessionId: string): Promise<Transaction[]> {
    return request<Transaction[]>(`api/transactions/${sessionId}`)
  },

  async initializePayment(data: PaymentInitRequest): Promise<PaymentInitResponse> {
    return request<PaymentInitResponse>('api/payment/initialize',{
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async checkPaymentStatus(reference:string): Promise<PaymentStatusResponse> {
    return request<PaymentStatusResponse>(`api/payment/status/${reference}`)
  },

  async adminLogin(adminKey:string): Promise<boolean> {
    const response = await fetch(`${API_BASE}/api/admin/login`,{
      method: 'GET',
      headers: { 'x-admin-key': adminKey },
    })
    return response.ok
  },
  async adminGetMenu(adminKey: string): Promise<MenuItem[]> {
    return request<MenuItem[]>(`api/admin/menu`,{
      headers: { 'x-admin-key': adminKey },
    })
  },
  async adminUpdateMenuItem(
      adminKey: string,
      id: string,
      item: { name?: string, price?: number, category?: string, available?: boolean}
  ): Promise<MenuItem> {
    return request<MenuItem>(`api/admin/menu/${id}`,{
      method: 'PUT',
      headers: { 'x-admin-key': adminKey },
      body: JSON.stringify(item),
    })
  },
  async adminDeleteMenuItem(adminKey: string, id:string): Promise<void> {
    return request<void>(`api/admin/menu/${id}`,{
      method: 'DELETE',
      headers: { 'x-admin-key': adminKey },
    })
  },
}