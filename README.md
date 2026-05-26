# Restaurant ChatBot
A conversational restaurant ordering system built with TypeScript, Express.js, Vue 3, and PostgreSQL. Users interact with a chatbot interface to browse menus, place orders, and pay via Paystacl or other payment providers. Features include real-time notifications, scheduler order and session management  via Redis and Express session.
It also comes with an admin dashboard which requires a password to access, update, add, delete Menu.

# Architecture Choice
This project combines multiple architectural and behavioral patterns to build scalable, maintainable chatbot:

- **Vertical Slicing** - Each Feature (chat, payments, orders) is organized from API layer -> service -> repository. The features are self contained  and easy to modify independently.
- **Strategy Pattern** - Conversation flow (Menu browsing, checkout, order history) are encapsulated as strategies. Adding a new conversation path only requires implementing a new strategy; the core BotEngine never changes.
- **Observer Pattern** - Real-time events (payment success, order updates) are decoupled from business logic. Observers can be added or swapped without modifying the core engine.
- **Adapter Pattern** - Payment providers (Paystack, Circle USDC) are pluggable via the `PaymentProvider interface`. Adding a new payment method is just implementing one interface.

**Positives:** Clear separation of concerns, easy to test and simple to extend


### Design Patterns

| Pattern                  | Implementation                                                                                                                                                    |
|--------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Strategy**             | `CommandStrategy` interface with 7 concrete strategies for conversational flows, new commands can be added without touching the engine                            |
| **Factory**              | `createPaymentProvider()` creates payment provider instances, isolates payment provider creation so adding new gateways is a one-line change                      |
| **Observer**             | `Observer` interface with `LogObserver` and `PaymentObserver` attached to `BotEngine` enables loose-coupled event reactions (Socket push, logging, notifications) |
| **Repository**           | Interface/implementation split for Menu, Order, data access and  abstracts Prisma/data access for testability                                                     |
| **Dependency Injection** | All dependencies injected via constructors, making every class independently testable with mocks                                                                  |
| **C4 model**             | An overview on what we're building with container and component levels, Check [SPEC.md](./SPEC.md)                                                                    |

### Tech Stack

**Backend:** TypeScript, Express.js, Socket.IO, Prisma, PostgreSQL (Neon), Redis, BullMQ, Zod, Pino
**Frontend:** Vite, Vue 3 (Composition API), Pinia, Tailwind CSS, Socket.IO Client
**Payments:** Paystack (NGN), Circle USDC (To be implemented)
