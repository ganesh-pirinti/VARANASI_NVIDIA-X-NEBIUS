/**
 * Cloudflare Turnstile Server-Side Verification Helper
 * Validates Turnstile tokens against Cloudflare's official siteverify endpoint.
 * Enforces action, hostname whitelist, timeouts, and fail-closed policies in production.
 */

export interface TurnstileVerificationOptions {
  token?: string | null;
  action?: string;
  clientIp?: string | null;
  idempotencyKey?: string;
  timeoutMs?: number;
}

export interface TurnstileVerificationResult {
  success: boolean;
  status: number;
  error?: string;
  hostname?: string;
  action?: string;
  timestamp?: string;
}

const CLOUDFLARE_SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const DEFAULT_TIMEOUT_MS = 8000;

/**
 * Verifies a client-provided Cloudflare Turnstile response token.
 * 
 * Never bypasses verification when secret key is missing.
 * In production or when unconfigured, fails closed with a sanitized error.
 */
export async function verifyTurnstileToken(
  options: TurnstileVerificationOptions
): Promise<TurnstileVerificationResult> {
  const {
    token,
    action,
    clientIp,
    idempotencyKey,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

  // 1. Enforce token presence
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return {
      success: false,
      status: 400,
      error: "Security verification token is missing. Please complete the verification challenge.",
    };
  }

  // 2. Validate server secret key
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey || secretKey.trim().length === 0) {
    // Fail closed: Never proceed without server-side verification capability
    return {
      success: false,
      status: 503,
      error: "Security verification is not configured on the server. Please contact the administrator.",
    };
  }

  // 3. Dispatch to Cloudflare Siteverify endpoint with bounded timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey.trim());
    formData.append("response", token.trim());
    if (clientIp) {
      formData.append("remoteip", clientIp.trim());
    }
    if (idempotencyKey) {
      formData.append("idempotency_key", idempotencyKey.trim());
    }

    const response = await fetch(CLOUDFLARE_SITEVERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: formData.toString(),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        success: false,
        status: 503,
        error: `Security verification service returned status HTTP ${response.status}.`,
      };
    }

    const data: {
      success: boolean;
      "error-codes"?: string[];
      challenge_ts?: string;
      hostname?: string;
      action?: string;
      cdata?: string;
    } = await response.json();

    // 4. Validate verification success
    if (!data.success) {
      const errorCodes = data["error-codes"] || [];
      let sanitizedMessage = "Security verification failed. Please try again.";

      if (errorCodes.includes("timeout-or-duplicate")) {
        sanitizedMessage = "Security token has expired or has already been used. Please refresh.";
      } else if (errorCodes.includes("invalid-input-response")) {
        sanitizedMessage = "Security token was invalid or malformed.";
      } else if (errorCodes.includes("bad-request")) {
        sanitizedMessage = "Security verification request was malformed.";
      }

      return {
        success: false,
        status: 403,
        error: sanitizedMessage,
      };
    }

    // 5. Enforce action match if action was specified
    if (action && data.action && data.action !== action) {
      return {
        success: false,
        status: 403,
        error: "Security verification action mismatch.",
      };
    }

    // 6. Enforce allowed hostnames if configured
    const allowedHostnamesConfig = process.env.TURNSTILE_ALLOWED_HOSTNAMES;
    if (allowedHostnamesConfig && allowedHostnamesConfig.trim().length > 0) {
      const allowedList = allowedHostnamesConfig
        .split(",")
        .map((h) => h.trim().toLowerCase())
        .filter((h) => h.length > 0);

      const returnedHostname = (data.hostname || "").toLowerCase().trim();
      const isAllowed = allowedList.some((allowed) => {
        if (allowed === "*") return true;
        return returnedHostname === allowed || returnedHostname.endsWith(`.${allowed}`);
      });

      if (!isAllowed) {
        return {
          success: false,
          status: 403,
          error: "Security verification hostname is not authorized.",
        };
      }
    }

    // Verification passed
    return {
      success: true,
      status: 200,
      hostname: data.hostname,
      action: data.action,
      timestamp: data.challenge_ts,
    };
  } catch (err: unknown) {
    const isAbort =
      (err instanceof Error && err.name === "AbortError") ||
      String(err).toLowerCase().includes("abort") ||
      String(err).toLowerCase().includes("timeout");

    if (isAbort) {
      return {
        success: false,
        status: 504,
        error: "Security verification timed out. Please try again.",
      };
    }

    return {
      success: false,
      status: 503,
      error: "Security verification service is temporarily unreachable.",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
