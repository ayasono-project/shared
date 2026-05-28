// @ayasono/shared/core — 全アプリ共通の基盤コード

export {
  DiscordWebhookTransport,
  type DiscordWebhookTransportOptions,
} from "./discordWebhookTransport";
export {
  BaseError,
  ConfigurationError,
  DatabaseError,
  DiscordApiError,
  NotFoundError,
  PermissionError,
  RateLimitError,
  TimeoutError,
  ValidationError,
} from "./errors/customErrors";
export { type CreateLoggerOptions, createLogger } from "./logger";
