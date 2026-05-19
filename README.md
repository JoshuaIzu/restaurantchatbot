flowchart TD
    %% External Inputs
    UI_Input(["Frontend Client"])
    Webhook_Input(["Paystack API"])
    RedisQueue(["Redis / BullMQ"])

    %% Backend Container
    subgraph Backend [Server-Side Web App Container]
       
        %% Controllers
        ChatCtrl["Chat Controller\\n(REST API Entry)"]
        WebCtrl["Webhook Controller\\n(Security/Signature)"]

        %% Core Engine
        Engine["ChatBot Core Engine\\n(The Subject / Orchestrator)"]

        %% Strategies (Behavioral Pattern)
        subgraph Strategies [Command Strategies]
                StrategyRouter["Strategy Router"]
            S_Main["MainMenu Strategy"]
            S_Order["PlaceOrder Strategy"]
            S_Checkout["Checkout Strategy"]
            S_Cancel["CancelOrder Strategy"]
        end

        %% Services
        PaySvc["Payment Service\\n(Paystack Adapter)"]

        %% Repositories (Data Access)
        subgraph Repositories [Data Access Layer]
            MenuRepo["Menu Repository"]
            OrderRepo["Order & Loyalty Repository"]
        end

        %% Observers (Behavioral Pattern)
        subgraph Observers [Event Observers]
            Obs_Logger["Analytics Observer"]
            Obs_Worker["Background Dispatcher"]
        end
    end

    %% Arrow Definitions (The Process Flow)
    UI_Input -- "POST /api/chat" --> ChatCtrl
    Webhook_Input -- "POST /webhook" --> WebCtrl

    ChatCtrl -- "Passes input & SessionContext" --> Engine
        Engine -- "Routes based on state" --> StrategyRouter
        StrategyRouter --> S_Main
        StrategyRouter --> S_Order
        StrategyRouter --> S_Checkout
        StrategyRouter --> S_Cancel
   
    Strategies -- "Reads available items" --> MenuRepo
    Strategies -- "Calculates totals, caches cart" --> OrderRepo
   
    S_Checkout -- "Initiates payment" --> PaySvc
    WebCtrl -- "Triggers fulfillment" --> PaySvc
   
    PaySvc -- "Marks order PAID, awards points" --> OrderRepo
    PaySvc -- "Emits 'PAYMENT_SUCCESS'" --> Engine
   
        Engine -- "Broadcasts Events" --> Obs_Logger
        Engine -- "Broadcasts Events" --> Obs_Worker
    Obs_Worker -- "Queues async job payload" --> RedisQueue

    %% Styling
    style Backend fill:#f9f9f9,stroke:#666,stroke-width:2px
    style ChatCtrl fill:#85bbf0,stroke:#5b82a8
    style WebCtrl fill:#85bbf0,stroke:#5b82a8
    style Engine fill:#1168bd,stroke:#0b4884,color:#fff
    style PaySvc fill:#85bbf0,stroke:#5b82a8
    style Strategies fill:#cce5ff,stroke:#85bbf0
    style Repositories fill:#cce5ff,stroke:#85bbf0
    style Observers fill:#cce5ff,stroke:#85bbf0