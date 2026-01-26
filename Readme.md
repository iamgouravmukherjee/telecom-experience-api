# Telecom Experience API

This project implements a thin Experience API that powers a telecom shopping cart on top of a **non-persistent Salesforce cart context**.

It is intentionally small in scope and designed to demonstrate architecture, API design, and recovery behavior when integrating with an ephemeral downstream system.

## Goals

- Expose a stable cart API to consumers
- Isolate Salesforce-specific behavior behind a client abstraction
- Transparently handle Salesforce cart context expiration
- Favor clarity, correctness, and testability over production polish

## Key Ideas
- The Experience API owns the **stable cart ID**
- Salesforce cart contexts are **ephemeral and replaceable**
- Context expiration is modeled explicitly and handled centrally
- No database or external dependencies are used.

## See:
- `docs/architecture.md` for architectural details
- `docs/api.md` for API contracts
- `docs/prompts.md` for prompt engineering details

## Tech Stack
- Node.js
- Express
- TypeScript
- Vitest

## Setup

### Clone the repository: 

```bash
git clone https://github.com/your-username/telecom-experience-api.git
```

### Navigate to the project directory:
```bash
cd telecom-experience-api
```

### Install dependencies:
```bash
npm install
```

### Run the server:
```bash
npm run dev
```

The server will start on the configured port (default: 3000).


### Run the tests:
```bash
npm run test
```

#### Unit tests focus on:
- Cart creation
- Adding items
- Salesforce context expiration and recovery
- Error handling for missing carts

## Design Decisions

### Stable Experience Cart ID
The API exposes a cart ID that never changes, even if the Salesforce context expires.

### SalesforceCartClient as a real fake
Instead of mocks, a deterministic test double is used to simulate TTL-based expiration and realistic failures.

### Recovery in CartService
All Salesforce-specific errors are caught and handled in one place to keep the API layer simple.

### No persistence
In-memory storage keeps the system easy to reason about and aligned with assignment constraints.

### Known Gaps / Non-Goals
The following are intentionally out of scope:
- Authentication / authorization
- Pricing, promotions, taxes
- Checkout or order submission
- Concurrency handling
- Persistence or durability guarantees
- Idempotency beyond basic retry behavior
