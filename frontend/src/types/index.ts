export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
export type PaymentProvider = 'paystack' | 'circle_usdc'
export type TransactionType = 'CREDIT' | 'DEBIT'

export interface OrderItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  category?: string
  modifier?: unknown
}

export interface MenuItem {
  id: string
  name: string
  price: number
  category: string
  available: boolean
}

export interface Wallet {
  id: string
  sessionId: string
  balance: number
  currency: string
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  walletId: string
  orderId?: string | null
  amount: number
  currency: string
  type: TransactionType
  status: PaymentStatus
  provider: string
  paymentReference: string
  createdAt: string
  updatedAt: string
}

export interface Order {
  id: string
  sessionId: string
  totalAmount: number
  currency: string
  status: PaymentStatus
  provider: PaymentProvider
  paymentReference: string
  items?: OrderItem[]
  createdAt: string
  updatedAt: string
}

export type MessageSender = 'user' | 'bot' | 'system'

export interface BotMessage {
  id: string
  sender: MessageSender
  text: string
  timestamp: Date
}

export interface ChatResponse {
  messages: string[]
  state: string
  cart?: OrderItem[]
  pendingPayment?: {
    orderId: string
    authorizationUrl: string
    total: number
    currency: string
  }
  sessionId?: string
}

export interface PaymentInitRequest {
  sessionId: string
  items: { menuItemId: string; name: string; price: number; quantity: number }[]
  total: number
  currency: string
  email?: string
}

export interface PaymentInitResponse {
  authorizationUrl: string
  reference: string
  orderId: string
}

export interface PaymentStatusResponse {
  status: PaymentStatus
  reference: string
  amount: number
}


export interface ChatMessage {
  id: string
  sender: 'user' | 'bot'
  text: string
  createdAt: string
}
