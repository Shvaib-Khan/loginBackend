export const RATE_LIMITER_WINDOW_MS = Number(
  process.env.RATE_LIMITER_WINDOW_MS ?? 60 * 1000,
);
export const RATE_LIMITER_MAX_ATTEMPTS = Number(
  process.env.RATE_LIMITER_MAX_ATTEMPTS ?? 5,
);
export const LOGIN_ATTEMPT_RETENTION_DAYS = Number(
  process.env.LOGIN_ATTEMPT_RETENTION_DAYS ?? 90,
);
export const LOGIN_ATTEMPT_CLEANUP_SCHEDULE =
  process.env.LOGIN_ATTEMPT_CLEANUP_SCHEDULE ?? "0 2 * * *";
export const LOGIN_ATTEMPT_CLEANUP_TIMEZONE =
  process.env.LOGIN_ATTEMPT_CLEANUP_TIMEZONE ?? "UTC";

export const DB_RETRY_DELAY_SECONDS = Number(
  process.env.DB_RETRY_DELAY_SECONDS ?? 3,
);
export const DEFAULT_PORT = Number(process.env.PORT ?? 3000);

export const APP_PORT = process.env.PORT
  ? Number(process.env.PORT)
  : DEFAULT_PORT;
