import { OpenAPIV3 } from 'openapi-types';

export const openApiSpec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'Telecom Experience Cart API',
    version: '1.0.0',
    description:
      'Thin Experience API that manages a telecom shopping cart on top of a non-persistent Salesforce cart context.',
  },
  servers: [
    { url: '/', description: 'Current environment' },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
      },
    },
    schemas: {
      CartItem: {
        type: 'object',
        properties: {
          sku: { type: 'string' },
          quantity: { type: 'integer', minimum: 1 },
        },
        required: ['sku', 'quantity'],
        additionalProperties: false,
      },
      Cart: {
        type: 'object',
        properties: {
          cartId: { type: 'string' },
          items: {
            type: 'array',
            items: { $ref: '#/components/schemas/CartItem' },
          },
        },
        required: ['cartId', 'items'],
        additionalProperties: false,
      },
      AddItemRequest: {
        type: 'object',
        properties: {
          sku: { type: 'string' },
          quantity: { type: 'integer', minimum: 1 },
        },
        required: ['sku', 'quantity'],
        additionalProperties: false,
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
        required: ['error'],
      },
    },
  },
  security: [{ ApiKeyAuth: [] }],
  paths: {
    '/cart': {
      post: {
        summary: 'Create Cart',
        description: 'Creates a new Experience Cart and underlying Salesforce context.',
        responses: {
          200: {
            description: 'Cart created successfully',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Cart' } } },
          },
          500: {
            description: 'Unexpected error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/cart/{cartId}': {
      get: {
        summary: 'Get Cart',
        parameters: [
          {
            name: 'cartId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Current cart snapshot',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Cart' } } },
          },
          404: {
            description: 'Cart not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          500: {
            description: 'Unexpected error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/cart/{cartId}/items': {
      post: {
        summary: 'Add Item',
        parameters: [
          {
            name: 'cartId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddItemRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Updated cart snapshot',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Cart' } } },
          },
          400: {
            description: 'Validation error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          404: {
            description: 'Cart not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          409: {
            description: 'Cart could not be recovered after Salesforce context expiration',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          500: {
            description: 'Unexpected error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/cart/{cartId}/items/{sku}': {
      delete: {
        summary: 'Remove Item',
        parameters: [
          {
            name: 'cartId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'sku',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Updated cart snapshot',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Cart' } } },
          },
          404: {
            description: 'Cart or item not found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          409: {
            description: 'Cart could not be recovered after Salesforce context expiration',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
          500: {
            description: 'Unexpected error',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
  },
};
