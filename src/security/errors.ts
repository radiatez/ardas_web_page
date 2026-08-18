export class SecurityBoundaryError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
  ) {
    super(code);
    this.name = "SecurityBoundaryError";
  }
}

export class AuthenticationRequiredError extends SecurityBoundaryError {
  constructor() {
    super("authentication_required", 401);
  }
}

export class MfaRequiredError extends SecurityBoundaryError {
  constructor() {
    super("mfa_required", 403);
  }
}

export class PermissionDeniedError extends SecurityBoundaryError {
  constructor() {
    super("permission_denied", 403);
  }
}

export class ResourceNotFoundError extends SecurityBoundaryError {
  constructor() {
    super("resource_not_found", 404);
  }
}

export class InvalidSecurityInputError extends SecurityBoundaryError {
  constructor(code = "invalid_input") {
    super(code, 400);
  }
}

export class RequestTooLargeError extends SecurityBoundaryError {
  constructor() {
    super("request_too_large", 413);
  }
}

export class RateLimitExceededError extends SecurityBoundaryError {
  constructor(public readonly retryAfterSeconds: number) {
    super("rate_limit_exceeded", 429);
  }
}
