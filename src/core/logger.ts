// winston ロガー初期化 factory（ayasono 全アプリ共通）

import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

/** createLogger のオプション */
export type CreateLoggerOptions = {
  /** 開発環境フラグ（コンソール出力の粒度を切り替える） */
  isDevelopment: boolean;
  /** 全体のログレベル（未指定時は info） */
  logLevel?: string | undefined;
  /** ログファイル出力ディレクトリ（既定: "logs"） */
  logDir?: string | undefined;
  /** 追加トランスポート（例: Discord Webhook 通知） */
  extraTransports?: winston.transport[] | undefined;
};

// ── ログローテーション既定値 ──
/** 1ファイルあたりの最大サイズ */
const LOG_MAX_SIZE = "10m";
/** 全ログの保持期間 */
const LOG_RETENTION = "14d";
/** エラーログの保持期間（障害調査向けに長め） */
const ERROR_LOG_RETENTION = "30d";

/**
 * winston ロガーを生成する。
 * 開発環境では詳細レベルのコンソール、本番では info コンソール（docker logs 向け）を出力し、
 * app / error の日次ローテーションファイルを常時出力する。
 * Discord Webhook 通知などアプリ固有のトランスポートは extraTransports で注入する。
 */
export function createLogger(options: CreateLoggerOptions): winston.Logger {
  const {
    isDevelopment,
    logLevel,
    logDir = "logs",
    extraTransports = [],
  } = options;

  // ファイル出力向けフォーマット（可読文字列 + メタ情報）
  const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
      // 追加メタ情報がある場合のみ末尾に付与
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : "";
      // Error の stack がある場合は改行して追記
      const stackStr = stack ? `\n${stack}` : "";
      return `${timestamp} [${level.toUpperCase()}]: ${message}${metaStr}${stackStr}`;
    }),
  );

  // コンソール向けフォーマット（開発時の可読性重視）
  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      const stackStr = stack ? `\n${stack}` : "";
      return `${timestamp} [${level}]: ${message}${stackStr}`;
    }),
  );

  const transports: winston.transport[] = [];

  // 開発環境では詳細レベルでコンソール出力
  if (isDevelopment) {
    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
        level: logLevel || "debug",
      }),
    );
  }

  // 全ログファイル（日次ローテーション・info以上）
  transports.push(
    new DailyRotateFile({
      filename: `${logDir}/app-%DATE%.log`,
      datePattern: "YYYY-MM-DD",
      maxSize: LOG_MAX_SIZE,
      maxFiles: LOG_RETENTION,
      format: fileFormat,
      level: "info",
    }),
  );

  // エラーログファイル（日次ローテーション・保持期間長め）
  transports.push(
    new DailyRotateFile({
      filename: `${logDir}/error-%DATE%.log`,
      datePattern: "YYYY-MM-DD",
      maxSize: LOG_MAX_SIZE,
      maxFiles: ERROR_LOG_RETENTION,
      format: fileFormat,
      level: "error",
    }),
  );

  // 本番環境でもコンソール出力（docker logs 用）
  if (!isDevelopment) {
    transports.push(
      new winston.transports.Console({
        format: fileFormat,
        level: "info",
      }),
    );
  }

  // アプリ固有の追加トランスポート（Discord Webhook 通知等）
  transports.push(...extraTransports);

  return winston.createLogger({
    level: logLevel || "info",
    transports,
    exitOnError: false,
  });
}
