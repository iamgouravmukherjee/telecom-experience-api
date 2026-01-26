export class CartNotFoundError extends Error {
  constructor(public readonly cartId: string) {
    super(`Cart with id ${cartId} was not found`);
    this.name = 'CartNotFoundError';
  }
}

export class SalesforceContextExpiredError extends Error {
  constructor(public readonly contextId: string) {
    super(`Salesforce context ${contextId} has expired`);
    this.name = 'SalesforceContextExpiredError';
  }
}

export class SalesforceContextMissingError extends Error {
  constructor(public readonly contextId: string) {
    super(`Salesforce context ${contextId} is missing`);
    this.name = 'SalesforceContextMissingError';
  }
}

export class CartRecoveryFailedError extends Error {
  constructor(public readonly cartId: string, message?: string) {
    super(message ?? `Cart ${cartId} could not be recovered`);
    this.name = 'CartRecoveryFailedError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
