// src/core/discordWebhookTransport.ts
import TransportStream from "winston-transport";
var DISCORD_EMBED_DESCRIPTION_MAX_LENGTH = 4096;
var DISCORD_EMBED_COLOR_ERROR = 15158332;
var DiscordWebhookTransport = class extends TransportStream {
  webhookUrl;
  getTitle;
  constructor(webhookUrl, options) {
    super({ level: "error" });
    this.webhookUrl = webhookUrl;
    this.getTitle = options.getTitle;
  }
  /**
   * ログイベントを受け取り Discord Webhook へ Embed 形式で送信する。
   */
  log(info, callback) {
    setImmediate(() => this.emit("logged", info));
    const description = this.buildDescription(info);
    const payload = {
      embeds: [
        {
          // タイトルは送信時に解決（i18n はアプリ側に委譲）
          title: this.getTitle(),
          description,
          color: DISCORD_EMBED_COLOR_ERROR,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      ]
    };
    fetch(this.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch((err) => {
      process.stderr.write(
        `[DiscordWebhookTransport] Failed to send webhook: ${String(err)}
`
      );
    });
    callback();
  }
  /**
   * Discord Embed の description 文字列を組み立てる。
   * message と stack を連結し、Discord の制限を超える場合は末尾をトリミングする。
   */
  buildDescription(info) {
    const message = typeof info.message === "string" ? info.message : String(info.message ?? "");
    const stack = typeof info.stack === "string" ? info.stack : void 0;
    const stackStr = stack ? `
\`\`\`
${stack}
\`\`\`` : "";
    const full = `**${message}**${stackStr}`;
    if (full.length <= DISCORD_EMBED_DESCRIPTION_MAX_LENGTH) {
      return full;
    }
    return full.slice(0, DISCORD_EMBED_DESCRIPTION_MAX_LENGTH - 3) + "...";
  }
};

// src/core/errors/customErrors.ts
var BaseError = class extends Error {
  // エラー種別名（ログ/分岐用）
  name;
  // 運用系エラーか（プロセス継続可否の判断に使用）
  isOperational;
  // HTTP相当ステータス（必要時のみ）
  statusCode;
  // Embed応答時のタイトル上書き
  embedTitle;
  /**
   * 遅延翻訳用の i18n キー
   * 設定されている場合、interactionErrorHandler が interaction.locale で翻訳する
   */
  messageKey;
  /** 遅延翻訳用の補間パラメータ */
  messageParams;
  constructor(name, message, isOperational = true, statusCode, embedTitle) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = name;
    this.isOperational = isOperational;
    this.statusCode = statusCode;
    this.embedTitle = embedTitle;
    Error.captureStackTrace(this);
  }
};
var ValidationError = class _ValidationError extends BaseError {
  constructor(message, embedTitle) {
    super("ValidationError", message, true, 400, embedTitle);
  }
  /**
   * 翻訳キーから ValidationError を生成する（遅延翻訳パターン）
   * interactionErrorHandler が interaction.locale で翻訳するため、
   * throw 時点で言語が固定されない
   * @param messageKey i18n 翻訳キー
   * @param messageParams 補間パラメータ
   * @param embedTitle Embed タイトル上書き
   * @returns 遅延翻訳用の ValidationError
   */
  static fromKey(messageKey, messageParams, embedTitle) {
    const err = new _ValidationError(messageKey, embedTitle);
    err.messageKey = messageKey;
    err.messageParams = messageParams;
    return err;
  }
};
var ConfigurationError = class extends BaseError {
  constructor(message, embedTitle) {
    super("ConfigurationError", message, true, 500, embedTitle);
  }
};
var DatabaseError = class extends BaseError {
  constructor(message, isOperational = true, embedTitle) {
    super("DatabaseError", message, isOperational, 500, embedTitle);
  }
};
var DiscordApiError = class extends BaseError {
  constructor(message, statusCode, embedTitle) {
    super("DiscordApiError", message, true, statusCode || 500, embedTitle);
  }
};
var PermissionError = class extends BaseError {
  constructor(message, embedTitle) {
    super("PermissionError", message, true, 403, embedTitle);
  }
};
var NotFoundError = class extends BaseError {
  constructor(resource, embedTitle) {
    super("NotFoundError", `${resource} not found`, true, 404, embedTitle);
  }
};
var TimeoutError = class extends BaseError {
  constructor(message, embedTitle) {
    super("TimeoutError", message, true, 408, embedTitle);
  }
};
var RateLimitError = class extends BaseError {
  constructor(message, embedTitle) {
    super("RateLimitError", message, true, 429, embedTitle);
  }
};

// src/core/logger.ts
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
var LOG_MAX_SIZE = "10m";
var LOG_RETENTION = "14d";
var ERROR_LOG_RETENTION = "30d";
function createLogger(options) {
  const {
    isDevelopment,
    logLevel,
    logDir = "logs",
    extraTransports = []
  } = options;
  const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : "";
      const stackStr = stack ? `
${stack}` : "";
      return `${timestamp} [${level.toUpperCase()}]: ${message}${metaStr}${stackStr}`;
    })
  );
  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      const stackStr = stack ? `
${stack}` : "";
      return `${timestamp} [${level}]: ${message}${stackStr}`;
    })
  );
  const transports = [];
  if (isDevelopment) {
    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
        level: logLevel || "debug"
      })
    );
  }
  transports.push(
    new DailyRotateFile({
      filename: `${logDir}/app-%DATE%.log`,
      datePattern: "YYYY-MM-DD",
      maxSize: LOG_MAX_SIZE,
      maxFiles: LOG_RETENTION,
      format: fileFormat,
      level: "info"
    })
  );
  transports.push(
    new DailyRotateFile({
      filename: `${logDir}/error-%DATE%.log`,
      datePattern: "YYYY-MM-DD",
      maxSize: LOG_MAX_SIZE,
      maxFiles: ERROR_LOG_RETENTION,
      format: fileFormat,
      level: "error"
    })
  );
  if (!isDevelopment) {
    transports.push(
      new winston.transports.Console({
        format: fileFormat,
        level: "info"
      })
    );
  }
  transports.push(...extraTransports);
  return winston.createLogger({
    level: logLevel || "info",
    transports,
    exitOnError: false
  });
}
export {
  BaseError,
  ConfigurationError,
  DatabaseError,
  DiscordApiError,
  DiscordWebhookTransport,
  NotFoundError,
  PermissionError,
  RateLimitError,
  TimeoutError,
  ValidationError,
  createLogger
};
