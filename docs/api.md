# Purpose

This spec defines the HTTP API contracts exposed by the Experience API.
The API provides a stable cart interface while hiding Salesforce cart context complexity and expiration behavior.
This document is written for Claude Code and should be used to generate endpoint handlers and request/response models.

## API Overview

Base URL: `/`

All responses are JSON.

## Data Models

### Cart

```json
{
  "cartId": "string",
  "items": [
    {
      "sku": "string",
      "quantity": "number"
    }
  ]
}
```

- `cartId` is the Experience Cart ID
- `items` represents the current cart contents

### Add Item Request

```json
{
  "sku": "string",
  "quantity": "number"
}
```

### Constraints:

- `sku` must be non-empty
- `quantity` must be a positive integer

## Endpoints

### Create Cart

POST `/cart`

Creates a new Experience Cart and an underlying Salesforce cart context.

#### Response

`200 OK`

```json
{
  "cartId": "exp_123",
  "items": []
}
```

#### Errors

- `500 Internal Server Error` – unexpected failure

### Get Cart

GET `/cart/{cartId}`

Returns the current state of the cart.

#### Response

`200 OK`

```json
{
  "cartId": "exp_123",
  "items": [
    {
      "sku": "5G-UNL-PLAN",
      "quantity": 1
    }
  ]
}
```

#### Errors

- `404 Not Found` – cart does not exist
- `500 Internal Server Error` – unexpected failure

### Add Item to Cart

POST `/cart/{cartId}/items`

Adds a line item to the cart.

If the underlying Salesforce context has expired, the system must transparently recover and retry.

### Add Item Request

```json
{
  "sku": "5G-UNL-PLAN",
  "quantity": 1
}
```

#### Response

`200 OK`    

```json
{
  "cartId": "exp_123",
  "items": [
    {
      "sku": "5G-UNL-PLAN",
      "quantity": 1
    }
  ]
}
```

#### Errors

- `400 Bad Request` – invalid request body
- `404 Not Found` – cart does not exist
- `409 Conflict` – cart could not be recovered after Salesforce context expiration
- `500 Internal Server Error` – unexpected failure

## Behavioral Notes

- Salesforce context expiration is not exposed to API consumers
- Successful responses always reflect the latest recovered cart state
- Experience Cart IDs remain stable even if Salesforce context changes
The API guarantees idempotent behavior only where explicitly implemented

## Non-Goals

- No pagination
- No partial updates
- No optimistic locking
- No authentication