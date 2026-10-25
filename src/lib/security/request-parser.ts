import { NextRequest, NextResponse } from "next/server";

export interface BoundedJsonResult<T = unknown> {
  success: boolean;
  data?: T;
  status?: 400 | 413;
  error?: string;
}

/**
 * Reads and parses JSON from a NextRequest with strict byte limits.
 * Prevents memory exhaustion attacks from unbounded or chunked requests.
 *
 * @param req NextRequest
 * @param maxBytes Maximum allowable payload size in bytes
 */
export async function readBoundedJson<T = unknown>(
  req: NextRequest | Request,
  maxBytes: number
): Promise<BoundedJsonResult<T>> {
  // 1. Check Content-Length header if present
  const contentLengthHeader = req.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = parseInt(contentLengthHeader, 10);
    if (!isNaN(contentLength) && contentLength > maxBytes) {
      return {
        success: false,
        status: 413,
        error: `Payload size (${Math.round(contentLength / 1024)} KB) exceeds maximum allowed limit of ${Math.round(maxBytes / 1024)} KB.`,
      };
    }
  }

  // 2. Read request body with streaming byte boundary enforcement
  try {
    let rawText = "";

    if (req.body && typeof (req.body as any).getReader === "function") {
      const reader = (req.body as ReadableStream<Uint8Array>).getReader();
      const chunks: Uint8Array[] = [];
      let totalBytes = 0;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            totalBytes += value.byteLength;
            if (totalBytes > maxBytes) {
              await reader.cancel();
              return {
                success: false,
                status: 413,
                error: `Payload exceeds maximum allowed limit of ${Math.round(maxBytes / 1024)} KB.`,
              };
            }
            chunks.push(value);
          }
        }
      } finally {
        reader.releaseLock();
      }

      const totalBuffer = new Uint8Array(totalBytes);
      let offset = 0;
      for (const chunk of chunks) {
        totalBuffer.set(chunk, offset);
        offset += chunk.byteLength;
      }
      rawText = new TextDecoder("utf-8").decode(totalBuffer);
    } else {
      // Fallback for mocked Request objects in test environments
      rawText = await req.text();
      if (Buffer.byteLength(rawText, "utf-8") > maxBytes) {
        return {
          success: false,
          status: 413,
          error: `Payload exceeds maximum allowed limit of ${Math.round(maxBytes / 1024)} KB.`,
        };
      }
    }

    if (!rawText || rawText.trim().length === 0) {
      return {
        success: false,
        status: 400,
        error: "Request body cannot be empty.",
      };
    }

    const data = JSON.parse(rawText) as T;
    return {
      success: true,
      data,
    };
  } catch (err: unknown) {
    return {
      success: false,
      status: 400,
      error: "Malformed JSON request body.",
    };
  }
}
