# Purpose

This spec defines the architecture and core abstractions for a thin Experience API that manages a telecom shopping cart on top of a non-persistent Salesforce cart context.

The system must isolate Salesforce behavior, handle context expiration transparently, and expose a stable cart identity to API consumers.

## High-level Architecture

The system is composed of four primary layers:

```
HTTP API Layer
   ↓
CartService (application orchestration)
   ↓
SalesforceCartClient (test double)
   ↓
InMemoryCartStore (context + snapshot mapping)
```

## Key architectural principles

- The Experience API owns the `stable cart identity`
- Salesforce cart context is `ephemeral and replaceable`
- All Salesforce-specific behavior is isolated behind a `client abstraction`
- No persistence beyond in-memory storage
- Favor pure functions and deterministic behavior where possible

## Core Concepts

### Experience Cart

- Identified by a stable `experienceCartId`
- This ID is returned to API consumers and never changes
- Mapped internally to a Salesforce cart context

### Salesforce Cart Context

- Identified by a `salesforceContextId`
- Has a finite lifetime and may expire at any time
- Expiration is modeled explicitly and must be handled

## Components and Responsibilities

### 1. HTTP API Layer

Responsibilities:

- Handle HTTP requests and responses
- Perform basic input validation
- Translate HTTP errors from domain errors
- Delegate all business logic to CartService

Non-responsibilities:

- No Salesforce logic
- No cart lifecycle decisions
- No direct access to stores or Salesforce client

### 2. CartService

This is the primary orchestration layer.

#### Responsibilities:

- Create and manage Experience Carts
- Map Experience Cart IDs to Salesforce contexts
- Handle Salesforce context expiration transparently
- Coordinate calls between the store and Salesforce client
- Return normalized cart representations

#### Key behaviors:

On Salesforce context expiration:
- Create a new Salesforce context
- Rehydrate cart state if applicable
- Update the store mapping
- Retry the failed operation

CartService must not expose Salesforce-specific errors or identifiers to callers.

### 3. SalesforceCartClient (Test Double)

This component simulates Salesforce cart behavior.

#### Responsibilities:

- Create Salesforce cart contexts
- Enforce context expiration via TTL
- Maintain cart line items per context
- Throw explicit errors when context is expired or missing

#### Requirements:

- No real Salesforce calls
- Expiration must be deterministic and testable
- Errors must be domain-specific (e.g. SalesforceContextExpiredError)

This client should behave realistically enough to exercise recovery logic.

### 4. InMemoryCartStore

#### Responsibilities:

Store mappings from experienceCartId to:

- current salesforceContextId
- snapshot of cart items (if needed for recovery)

Support basic CRUD operations

#### Constraints:

- In-memory only
- No persistence guarantees
- No concurrency handling required

## Error Handling Strategy

- Salesforce errors are caught and translated at the CartService layer
- Context expiration is a recoverable condition
- Missing Experience Cart IDs result in terminal errors
- Unexpected errors propagate as generic failures
- Explicit error types should be used internally to avoid string matching.

## Non-Goals

The following are explicitly out of scope:

- Authentication / authorization
- Pricing, promotions, or tax calculation
- Checkout or order submission
- Database persistence
- High concurrency or distributed coordination

## Implementation Notes

- Language: TypeScript on Node 20+
- Use a minimal HTTP framework (e.g. Express or Fastify)
- Favor clarity and correctness over production hardening
- Keep modules small and cohesive
- Unit tests should target CartService and SalesforceCartClient behavior


