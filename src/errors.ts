/**
 * Thrown when a cart with a specific id is not found in the in-memory store.
 *
 * Extends Error, named CartNotFoundError
 * Stores cartId as a public readonly property
 * Used in CartService#getCartOrThrow to signal missing carts
 * Imported in global error handler to return 404 with message
 */
export class CartNotFoundError extends Error {
  constructor(public readonly cartId: string) {
    super(`Cart with id ${cartId} was not found`);
    this.name = 'CartNotFoundError';
  }
}


/**
 * Thrown when a Salesforce cart context has expired.
 *
 * Extends Error, named SalesforceContextExpiredError
 * Stores contextId as a public readonly property
 * Used in SalesforceCartClient to signal expired contexts
 * Imported in global error handler to return 400 with message
 */
export class SalesforceContextExpiredError extends Error {
  constructor(public readonly contextId: string) {
    super(`Salesforce context ${contextId} has expired`);
    this.name = 'SalesforceContextExpiredError';
  }
}

/**
 * Thrown when a Salesforce cart context is missing.
 *
 * Extends Error, named SalesforceContextMissingError
 * Stores contextId as a public readonly property
 * Used in SalesforceCartClient to signal missing contexts
 * Imported in global error handler to return 400 with message
 */
export class SalesforceContextMissingError extends Error {
  constructor(public readonly contextId: string) {
    super(`Salesforce context ${contextId} is missing`);
    this.name = 'SalesforceContextMissingError';
  }
}

/**
 * Thrown when a cart recovery operation fails.
 *
 * Extends Error, named CartRecoveryFailedError
 * Stores cartId as a public readonly property
 * Used in CartService to signal recovery failures
 * Imported in global error handler to return 500 with message
 */
export class CartRecoveryFailedError extends Error {
  constructor(public readonly cartId: string, message?: string) {
    super(message ?? `Cart ${cartId} could not be recovered`);
    this.name = 'CartRecoveryFailedError';
  }
}

/**
 * Thrown when input validation fails.
 *
 * Extends Error, named ValidationError
 * Stores validation error message
 * Used in validation functions to signal invalid input
 * Imported in global error handler to return 400 with message
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
