// Notchset operation 2.0.0 · https://notchset.dev/changelog
/*
 * The one shape a failed operation takes (installs to lib/notchset/op-error.ts with any piece that reads it).
 *
 * An adapter throws whatever its transport throws (a fetch TypeError, a Response, its own { code, message }); the
 * UI only ever reads an OpError, made by toOpError. The code decides what the person is offered: a retryable error
 * keeps Retry, a validation error with a field puts its line on that field, and a permission or conflict error
 * drops Retry for Edit or Reload, since trying the same thing again can't help.
 */

export type OpErrorCode = "network" | "timeout" | "validation" | "permission" | "conflict" | "unavailable" | "unknown";

export type OpError = {
  code: OpErrorCode;
  /** One plain sentence the person reads: what went wrong, and that their work is kept when it is. */
  message: string;
  /** The field a validation error belongs to: its line goes under that field, not in the banner. */
  field?: string | undefined;
  /** False when the same request can't succeed again (validation, permission, conflict): Retry is not offered. */
  retryable: boolean;
  /** The HTTP status, when there was one. */
  status?: number | undefined;
  /** A request id or trace to quote to support; printed in the diagnostic line. */
  detail?: string | undefined;
};

const CODES: readonly OpErrorCode[] = ["network", "timeout", "validation", "permission", "conflict", "unavailable", "unknown"];

/** The words each code says when the backend gave none. */
export const OP_ERROR_WORDS: Record<OpErrorCode, string> = {
  network: "The connection dropped. Everything you typed is still here.",
  timeout: "The server didn't answer in time. Everything you typed is still here.",
  validation: "Something here needs a change before it can be saved.",
  permission: "Your role can't make this change.",
  conflict: "Someone changed this since you opened it. Reload to see their version.",
  unavailable: "The server is unavailable right now. Nothing you saved is lost.",
  unknown: "Something went wrong on our side. Nothing you saved is lost.",
};

const RETRYABLE: Record<OpErrorCode, boolean> = { network: true, timeout: true, validation: false, permission: false, conflict: false, unavailable: true, unknown: true };

/** An OpError with the code's own words and retry rule, overridden by what you pass. */
export function opError(code: OpErrorCode, message?: string, extra?: Partial<Omit<OpError, "code" | "message">>): OpError {
  return { code, message: message || OP_ERROR_WORDS[code], retryable: RETRYABLE[code], ...extra };
}

/** Thrown by an adapter to fail with a typed error; toOpError reads it back unchanged. */
export class OpFailure extends Error {
  readonly op: OpError;
  constructor(op: OpError) {
    super(op.message);
    this.name = "OpFailure";
    this.op = op;
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

/** The code an HTTP status means. */
export function codeOfStatus(status: number): OpErrorCode {
  if (status === 400 || status === 422) return "validation";
  if (status === 401 || status === 403) return "permission";
  if (status === 409 || status === 412) return "conflict";
  if (status === 408 || status === 504) return "timeout";
  if (status === 429 || status === 502 || status === 503) return "unavailable";
  return "unknown";
}

/**
 * Anything an adapter or fetch threw, as an OpError: an OpFailure or an OpError-shaped object as it is; an abort
 * from a timeout as timeout; a failed fetch (or being offline) as network; a Response or an error carrying a
 * status by that status; an adapter's own { code, message, field } with an unknown code as unknown, keeping its
 * words.
 */
export function toOpError(e: unknown): OpError {
  if (e instanceof OpFailure) return e.op;
  if (isRecord(e) && typeof e.code === "string" && (CODES as readonly string[]).includes(e.code) && typeof e.message === "string") {
    const code = e.code as OpErrorCode;
    return {
      ...opError(code, e.message),
      ...(typeof e.retryable === "boolean" ? { retryable: e.retryable } : {}),
      ...(typeof e.field === "string" ? { field: e.field } : {}),
      ...(typeof e.status === "number" ? { status: e.status } : {}),
      ...(typeof e.detail === "string" ? { detail: e.detail } : {}),
    };
  }
  const name = isRecord(e) && typeof e.name === "string" ? e.name : "";
  if (name === "TimeoutError") return opError("timeout");
  if (name === "AbortError") return opError("timeout", "The request was stopped before it finished. Everything you typed is still here.");
  const status = isRecord(e) && typeof e.status === "number" && e.status >= 400 ? e.status : undefined;
  if (status !== undefined) {
    const code = codeOfStatus(status);
    const said = isRecord(e) && typeof e.message === "string" && e.message && !/^(request failed|http )/i.test(e.message) ? e.message : undefined;
    const field = isRecord(e) && typeof e.field === "string" ? e.field : undefined;
    const detail = isRecord(e) && typeof e.detail === "string" ? e.detail : isRecord(e) && typeof e.requestId === "string" ? e.requestId : undefined;
    return opError(code, said ?? (status === 401 ? "Your session ended. Sign in again, then try again." : undefined), { status, ...(status === 401 ? { retryable: true } : {}), ...(field ? { field } : {}), ...(detail ? { detail } : {}) });
  }
  if (typeof navigator !== "undefined" && navigator.onLine === false) return opError("network", "You're offline. Everything you typed is still here.");
  if (e instanceof TypeError && /fetch|network|load failed/i.test(e.message)) return opError("network");
  const message = typeof e === "string" ? e : e instanceof Error ? e.message : isRecord(e) && typeof e.message === "string" ? e.message : "";
  const field = isRecord(e) && typeof e.field === "string" ? e.field : undefined;
  return opError(field ? "validation" : "unknown", message || undefined, field ? { field } : undefined);
}

/** The diagnostic line a person can quote to support: "503 · unavailable · 10:42 · req 7f3a91". */
export function opErrorLine(e: OpError, at: Date = new Date()): string {
  const time = `${String(at.getHours()).padStart(2, "0")}:${String(at.getMinutes()).padStart(2, "0")}`;
  return [e.status, e.code, time, e.detail && `req ${e.detail}`].filter(Boolean).join(" · ");
}
