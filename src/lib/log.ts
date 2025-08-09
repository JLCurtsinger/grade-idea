export const logInfo = (msg: string, meta: Record<string, any> = {}) =>
  console.log(JSON.stringify({ level: "info", msg, ...meta }));

export const logWarn = (msg: string, meta: Record<string, any> = {}) =>
  console.log(JSON.stringify({ level: "warn", msg, ...meta }));

export const logError = (msg: string, meta: Record<string, any> = {}) =>
  console.log(JSON.stringify({ level: "error", msg, ...meta }));
