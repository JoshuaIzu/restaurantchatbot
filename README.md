# Restaurant ChatBot

A conversational restaurant ordering system built with TypeScript, Express.js, Vue 3, and PostgreSQL. Users interact with a chatbot interface to browse menus, place orders, and pay via Paystack or Circle USDC.

## Architecture

### C4 Component Diagram

```text
+=============================================================================================================+
|  [Container: Client-Side Web Application (Astro + Vue 3 + Pinia + Tailwind + Socket.IO Client)]  [PLANNED]  |
|                                                                                                             |
|  [Components]                                                                                               |
|  +------------------+    +------------------+    +------------------+    +------------------+               |
|  |   ChatWindow     |    |   MessageBubble  |    |     InputBar     |    | TypingIndicator  |               |
|  +------------------+    +------------------+    +------------------+    +------------------+               |
|  +------------------+    +------------------+    +------------------+                                       |
|  |    MenuCard      |    |  PaymentModal    |    |   Badge/Button   |                                       |
|  +------------------+    +------------------+    +------------------+                                       |
|                                                                                                             |
|  [Pinia Stores]                                                                                             |
|  +------------------+    +------------------+    +------------------+                                       |
|  |   session.ts     |    |    chat.ts       |    |    order.ts      |                                       |
|  +------------------+    +------------------+    +------------------+                                       |
|                                                                                                             |
|  [Services]                                                                                                 |
|  +------------------+    +------------------+                                                               |
|  |   paystack.ts    |    |    socket.ts     |                                                               |
|  | (JS SDK wrapper) |    | (IO client)      |                                                               |
|  +------------------+    +------------------+                                                               |
+============|==========================|======================================================================+
             |                          |
             | POST /api/chat           | Socket.IO connect (query: sessionId)
             | POST /api/payment/init   | Listen: payment_success, payment_failed
             | GET  /api/menu           |
             | GET  /api/orders/:sid    |
             | GET  /api/wallet/:sid    |
             v                          v
+=============================================================================================================================+
|  [Container: Server-Side Web Application (TypeScript Express.js + Socket.IO)]                                               |
|                                                                                                                             |
|  [Controllers - API Entry Points]                                                                                           |
|  +----------------------------------+    +----------------------------------+    +----------------------------------+       |
|  |        ChatController            |    |      PaymentController           |    |     AdminMenuController          |       |
|  | (POST /api/chat)                 |    | (POST /api/payment/initialize)   |    | (CRUD /api/admin/menu/*)         |       |
|  | (Delegates to BotEngine)         |    | (POST /api/payment/webhook)      |    | (requireAdminKey middleware)     |       |
|  | (GET /api/menu, /orders, /wallet)|    | (GET /api/payment/status/:ref)   |    +----------------------------------+       |
|  +----------------------------------+    +----------------------------------+                                               |
|             |                                      |                                                                        |
|             | (SessionContext)                     | (HMAC-SHA512 verification)                                             |
|             v                                      v                                                                        |
|  +----------------------------------+    +----------------------------------+                                               |
|  |        BotEngine                 |    |       PaymentService             |                                               |
|  |  (Strategy Context / Subject)    |    |  (Payment Flow Orchestrator)     |                                               |
|  |                                  |    |                                  |                                               |
|  |  [Built-in Strategies]           |    |  [Payment Providers]             |                                               |
|  |  - MainMenuStrategy              |    |  - PaystackProvider (NGN)        |                                               |
|  |  - OrderPlacementStrategy        |    |  - CircleUsdcProvider (stub)     |                                               |
|  |  - HistoryStrategy               |    |  (via createPaymentProvider)     |                                               |
|  |  - CancelOrderStrategy           |    +----------------------------------+                                               |
|  |  - PaymentStatusStrategy         |              |                                                                        |
|  |                                  |              | (Initializes payment, verifies, fulfills)                              |
|  |  [Externally Registered]         |              v                                                                        |
|  |  - CheckoutStrategy              |    +----------------------------------+                                               |
|  |  - CheckoutPaymentSelection      |    |     Data Access Layer            |                                               |
|  +----------------------------------+    |  (Repository Pattern)            |                                               |
|             |                            |                                  |                                               |
|             | (Routes to strategy)       |  +--------------------------+    |                                               |
|             v                            |  | PrismaMenuRepository     |    |                                               |
|  +----------------------------------+    |  | PrismaOrderRepository    |    |                                               |
|  |       Command Strategies         |    |  | PrismaWalletRepository   |    |                                               |
|  |  (Strategy Pattern)              |    |  +--------------------------+    |                                               |
|  |                                  |    +----------------------------------+                                               |
|  |  - MainMenuStrategy              |              |                                                                        |
|  |  - OrderPlacementStrategy        |              | (Reads/writes menu, orders, wallets, transactions)                     |
|  |  - CheckoutStrategy              |              v                                                                        |
|  |  - HistoryStrategy               |    +----------------------------------+                                               |
|  |  - CancelOrderStrategy           |    |    PostgreSQL Database           |                                               |
|  |  - PaymentStatusStrategy         |    |  (Neon DB via PrismaPg)          |                                               |
|  +----------------------------------+    |                                  |                                               |
|             |                            |  [Models]                        |                                               |
|             | (Executes commands)        |  - MenuItem, Order, OrderItem    |                                               |
|             v                            |  - Wallet, Transaction           |                                               |
|  +----------------------------------+    +----------------------------------+                                               |
|  |       Event Observers            |                                                                                       |
|  |  (Observer Pattern)              |    [Middleware]                                                                       |
|  |                                  |    +----------------------------------+                                               |
|  |  - LogObserver (Pino)            |    |      Zod Validation              |                                               |
|  |  - PaymentObserver (Socket.IO)   |    |    - validateChat                |                                               |
|  +----------------------------------+    |    - validatePaymentInit         |                                               |
|             |                            +----------------------------------+                                               |
|             | (Emits real-time events)                                                                                      |
|             v                                                                                                               |
|  +----------------------------------+    [Session Management]                                                               |
|  |       Socket.IO Server           |    +----------------------------------+                                               |
|  |  (sessionSocketMap)              |    |  express-session + connect-redis |                                               |
|  |                                  |    |  (Redis-backed sessions)         |                                               |
|  |  Events:                         |    +----------------------------------+                                               |
|  |  - payment_success               |              |                                                                        |
|  |  - payment_failed                |              v                                                                        |
|  +----------------------------------+    +----------------------------------+                                               |
|             |                            |        Redis                     |                                               |
|             | (Targets specific client)  |  (Session storage + BullMQ)      |                                               |
|             v                            +----------------------------------+                                               |
+=============|                                                                                                    ===========+
              |                                           | (Queues async jobs)                                    |
              | (Real-time payment notifications)         v                                                        |
              |                                  +----------------------------------+                              |
              |                                  |       BullMQ Queue               |                              |
              |                                  |  (order-scheduler queue)         |                              |
              |                                  +----------------------------------+                              |                                   
              |                                           |                                                        |
              |                                           |                                                        |
              |                                           |                                                        |
              |                                           |                                                        |
              |                                           | (Processes delayed orders)                             |
              |                                           v                                                        |
              |                                  +----------------------------------+                              |
              |                                  |     SchedulerService             |                              |
              |                                  |  (Worker + Queue disposal)       |                              |
              |                                  |  (graceful shutdown)             |                              |
              |                                  +----------------------------------+                              |
              |                                                                                                    |
              v                                                                                                    v
+=============================================================================================================================+
|  [External Systems]                                                                                                         |
|                                                                                                                             |
|  +----------------------------------+    +----------------------------------+                                               |
|  |       Paystack API               |    |       Circle USDC API            |                                               |
|  |  (Payment Gateway - NGN)         |    |  (Crypto Payments)               |                                               |
|  |                                  |    |                                  |                                               |
|  |  - POST /transaction/initialize  |    |  - To be  implemented            |                                               |
|  |  - GET /transaction/status/:ref |     |                                  |                                               |
|  |  - GET /transaction/verify/:ref  |    |                                  |                                               |
|  |  - POST /webhook (HMAC verified) |    |                                  |                                               |
|  +----------------------------------+    +----------------------------------+                                               |
+=============================================================================================================================+
```

### Component Flow Summary

#### 1. Chat Flow

```
Frontend (POST /api/chat)
  -> ChatController (extracts message, builds SessionContext from Express session)
  -> BotEngine.handleInput() (resolves strategy based on session state + input)
  -> CommandStrategy.execute() (processes business logic, updates cart/state)
  -> BotEngine returns { messages, newState }
  -> ChatController saves session to Redis, returns response to frontend
```

**Conversation State Machine:**
```
main_menu --"1"--> browsing_menu --item#--> browsing_menu (add to cart)
browsing_menu --"99"--> checkout --"1" or "2"--> awaiting_schedule --minutes--> awaiting_payment
main_menu --"99"--> checkout
main_menu --"98"--> order_history --> main_menu
main_menu --"97"--> payment_status --> main_menu
main_menu --"0"--> cancel_order --> main_menu
```

#### 2. Payment Flow

```
Frontend (POST /api/payment/initialize)
  -> PaymentController.initiatePayment()
  -> PaymentService.initiatePayment()
     -> WalletRepository.findOrCreateBySessionId()
     -> OrderRepository.createOrder(status: PENDING)
     -> createPaymentProvider() -> PaystackProvider.initializeTransaction()
     -> Returns authorization URL to frontend
  -> User completes payment on Paystack
  -> Paystack sends webhook (POST /api/payment/webhook)
  -> PaymentController.handlePaystackWebhook()
     -> Verifies HMAC-SHA512 signature from x-paystack-signature header
     -> PaymentService.fulfillSuccessfulPayment()
        -> PaystackProvider.verifyTransaction(reference)
        -> WalletRepository.creditBalance()
        -> WalletRepository.debitBalance()
        -> OrderRepository.updateOrderStatus(COMPLETED)
        -> BotEngine.notify("PAYMENT_SUCCESS", payload)
           -> PaymentObserver emits Socket.IO "payment_success" to client
  -> Frontend receives real-time notification
```

#### 3. Real-Time Notification Flow

```
Socket.IO Server (maintains sessionSocketMap: sessionId -> socketId)
  <- Frontend connects with query: { sessionId }
  <- PaymentObserver listens for BotEngine.notify() events
  <- On "PAYMENT_SUCCESS" or "PAYMENT_FAILED":
     -> Looks up socketId from sessionSocketMap
     -> Emits "payment_success" or "payment_failed" to specific client
  -> Frontend Socket.IO client listens and updates UI
```

#### 4. Scheduled Order Flow

```
CheckoutStrategy (during checkout)
  -> Asks user for schedule time (minutes or 0 for immediate)
  -> SchedulerService.scheduleOrder(orderId, scheduledAt)
     -> Calculates delay = scheduledAt - now
     -> Adds job to BullMQ "order-scheduler" queue
  -> BullMQ Worker processes job at scheduled time
     -> Checks if order exists and is COMPLETED
     -> (Placeholder for future fulfillment logic)
  -> Graceful shutdown: SchedulerService.dispose() closes queue + worker
```

### Design Patterns

| Pattern              | Implementation                                                                          |
|----------------------|-----------------------------------------------------------------------------------------|
| **Strategy**         | `CommandStrategy` interface with 7 concrete strategies for conversational flows         |
| **Factory**          | `createPaymentProvider()` creates payment provider instances                            |
| **Observer**         | `Observer` interface with `LogObserver` and `PaymentObserver` attached to `BotEngine`   |
| **Repository**       | Interface/implementation split for Menu, Order, Wallet data access                      |
| **Dependency Injection** | All dependencies injected via constructors                                          |
| **Singleton**        | BullMQ queue and worker use module-level singletons                                     |

### Tech Stack

**Backend:** TypeScript, Express.js, Socket.IO, Prisma, PostgreSQL (Neon), Redis, BullMQ, Zod, Pino
**Frontend (Planned):** Astro, Vue 3 (Composition API), Pinia, Tailwind CSS, Socket.IO Client
**Payments:** Paystack (NGN), Circle USDC (To be implemented)
