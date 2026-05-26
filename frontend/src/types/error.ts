export interface ErrorResponse {
  status: number;
  message: string;
  timestamp: string;
}

export class AppApiError extends Error {
  status?: number;
  timestamp?: string;
  network: boolean;

  constructor(message: string, options: { status?: number; timestamp?: string; network?: boolean } = {}) {
    super(message);
    this.name = 'AppApiError';
    this.status = options.status;
    this.timestamp = options.timestamp;
    this.network = options.network ?? false;
  }
}
