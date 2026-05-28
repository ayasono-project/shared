// tests/core/logger.test.ts
// createLogger が options に応じてトランスポート構成・ログレベル・フォーマット関数を
// 正しく組み立てるかを検証する。winston / winston-daily-rotate-file をモックして内部を観測する。

describe("createLogger", () => {
  const loadAndCreate = async (
    isDevelopment: boolean,
    logLevel?: string,
    extraCount = 0,
  ) => {
    vi.resetModules();

    const consoleTransportMock = vi.fn();
    const dailyRotateMock = vi.fn();
    const createLoggerMock = vi.fn((options) => ({ ...options }));

    const winstonMock = {
      createLogger: createLoggerMock,
      format: {
        combine: vi.fn((...parts) => ({ type: "combine", parts })),
        timestamp: vi.fn((opts) => ({ type: "timestamp", opts })),
        printf: vi.fn((fn) => ({ type: "printf", fn })),
        colorize: vi.fn(() => ({ type: "colorize" })),
      },
      transports: {
        Console: consoleTransportMock,
      },
    };

    vi.doMock("winston", () => ({ __esModule: true, default: winstonMock }));
    vi.doMock("winston-daily-rotate-file", () => ({
      __esModule: true,
      default: dailyRotateMock,
    }));

    const { createLogger } = await import("../../src/core/logger");
    const extraTransports = Array.from({ length: extraCount }, (_, i) => ({
      extra: i,
    }));
    const result = createLogger({
      isDevelopment,
      logLevel,
      extraTransports: extraTransports as never,
    });

    return {
      result,
      winstonMock,
      createLoggerMock,
      consoleTransportMock,
      dailyRotateMock,
    };
  };

  it("development では Console + DailyRotateFile×2 の計3トランスポートと指定 logLevel が設定されること", async () => {
    const { result, createLoggerMock, consoleTransportMock, dailyRotateMock } =
      await loadAndCreate(true, "debug");

    expect(dailyRotateMock).toHaveBeenCalledTimes(2);
    expect(consoleTransportMock).toHaveBeenCalledTimes(1);
    expect(consoleTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({ level: "debug" }),
    );

    const args = createLoggerMock.mock.calls[0][0];
    expect(args.level).toBe("debug");
    expect(args.exitOnError).toBe(false);
    expect(args.transports).toHaveLength(3);
    expect(result.transports).toHaveLength(3);
  });

  it("非 development では info レベルのコンソールと計3トランスポートが設定されること", async () => {
    const { createLoggerMock, consoleTransportMock, dailyRotateMock } =
      await loadAndCreate(false);

    expect(dailyRotateMock).toHaveBeenCalledTimes(2);
    expect(consoleTransportMock).toHaveBeenCalledTimes(1);
    expect(consoleTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({ level: "info" }),
    );

    const args = createLoggerMock.mock.calls[0][0];
    expect(args.level).toBe("info");
    expect(args.transports).toHaveLength(3);
  });

  it("logLevel 未指定の development ではコンソールに debug が適用されること", async () => {
    const { consoleTransportMock } = await loadAndCreate(true);

    expect(consoleTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({ level: "debug" }),
    );
  });

  it("extraTransports が末尾に追加されること", async () => {
    const { createLoggerMock } = await loadAndCreate(false, undefined, 2);

    const args = createLoggerMock.mock.calls[0][0];
    expect(args.transports).toHaveLength(5);
  });

  it("ファイル用 printf がメタフィールドと stack を正しくフォーマットすること", async () => {
    const { winstonMock } = await loadAndCreate(true, "debug");

    const printfCalls = winstonMock.format.printf.mock.calls;
    const filePrintf = printfCalls[0]?.[0] as (entry: {
      timestamp: string;
      level: string;
      message: string;
      stack?: string;
      [key: string]: unknown;
    }) => string;

    expect(
      filePrintf({
        timestamp: "2026-02-21 00:00:00",
        level: "info",
        message: "hello",
      }),
    ).toBe("2026-02-21 00:00:00 [INFO]: hello");
    expect(
      filePrintf({
        timestamp: "2026-02-21 00:00:00",
        level: "error",
        message: "boom",
        stack: "STACK_TRACE",
        guildId: "g1",
      }),
    ).toBe('2026-02-21 00:00:00 [ERROR]: boom{"guildId":"g1"}\nSTACK_TRACE');
  });

  it("コンソール用 printf が stack の有無でフォーマットを切り替えること", async () => {
    const { winstonMock } = await loadAndCreate(true, "debug");

    const printfCalls = winstonMock.format.printf.mock.calls;
    const consolePrintf = printfCalls[1]?.[0] as (entry: {
      timestamp: string;
      level: string;
      message: string;
      stack?: string;
    }) => string;

    expect(
      consolePrintf({
        timestamp: "2026-02-21 00:00:00",
        level: "info",
        message: "hello",
      }),
    ).toBe("2026-02-21 00:00:00 [info]: hello");
    expect(
      consolePrintf({
        timestamp: "2026-02-21 00:00:00",
        level: "error",
        message: "boom",
        stack: "STACK_TRACE",
      }),
    ).toBe("2026-02-21 00:00:00 [error]: boom\nSTACK_TRACE");
  });
});
