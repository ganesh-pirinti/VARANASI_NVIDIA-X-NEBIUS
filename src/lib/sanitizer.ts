export interface SanitizationResult {
  sanitizedText: string;
  redactedCount: number;
  redactedPatterns: string[];
}

const SENSITIVE_PATTERNS: { regex: RegExp; replacement: string; name: string }[] = [
  // OpenAI / Nebius / Tavily / HuggingFace API Keys (e.g. sk-..., neb-..., tvly-..., hf_...)
  {
    regex: /(?:sk|neb|tvly|nvapi|hf|ghp|gho)[-_][A-Za-z0-9_\-]{16,}/g,
    replacement: "[REDACTED_API_KEY]",
    name: "API_KEY_PREFIXED",
  },
  // Authorization: Bearer <token>
  {
    regex: /(Bearer\s+)[A-Za-z0-9_\-\.]{20,}/gi,
    replacement: "$1[REDACTED_BEARER_TOKEN]",
    name: "BEARER_TOKEN",
  },
  // Key-value pairs for secrets in env files or logs (API_KEY=..., SECRET=...)
  {
    regex: /((?:API_KEY|SECRET|PASSWORD|PASS|TOKEN|ACCESS_KEY|PRIVATE_KEY)\s*[:=]\s*)['"]?[A-Za-z0-9_\-\.@#$%^&*!]{8,}['"]?/gi,
    replacement: "$1[REDACTED_SECRET]",
    name: "ENV_SECRET_PAIR",
  },
  // AWS Access Key ID (AKIA...)
  {
    regex: /AKIA[0-9A-Z]{16}/g,
    replacement: "[REDACTED_AWS_KEY]",
    name: "AWS_ACCESS_KEY",
  },
  // Nebius / Cloud project service account tokens
  {
    regex: /"private_key":\s*"-----BEGIN PRIVATE KEY-----[^"]+"/g,
    replacement: '"private_key": "[REDACTED_PRIVATE_KEY]"',
    name: "PRIVATE_KEY_JSON",
  }
];

/**
 * Redacts secrets from any user-supplied text before transmitting to external models or logs
 */
export function sanitizeText(input: string): SanitizationResult {
  if (!input) {
    return { sanitizedText: "", redactedCount: 0, redactedPatterns: [] };
  }

  let text = input;
  let count = 0;
  const matchedNames: Set<string> = new Set();

  for (const pattern of SENSITIVE_PATTERNS) {
    const matches = text.match(pattern.regex);
    if (matches && matches.length > 0) {
      count += matches.length;
      matchedNames.add(pattern.name);
      text = text.replace(pattern.regex, pattern.replacement);
    }
  }

  return {
    sanitizedText: text,
    redactedCount: count,
    redactedPatterns: Array.from(matchedNames),
  };
}

/**
 * Truncates oversized logs safely to keep essential context:
 * - Keep initial environment info (head)
 * - Keep final stack trace and crash point (tail)
 */
export function truncateLogForInference(log: string, maxLines = 150): string {
  if (!log) return "";
  const lines = log.split(/\r?\n/);
  if (lines.length <= maxLines) {
    return sanitizeText(log).sanitizedText;
  }

  const headLines = Math.floor(maxLines * 0.35); // 35% from top
  const tailLines = Math.floor(maxLines * 0.65); // 65% from bottom (stack trace)

  const head = lines.slice(0, headLines);
  const tail = lines.slice(lines.length - tailLines);

  const truncated = [
    ...head,
    `\n... [VARANASI: Truncated ${lines.length - maxLines} lines of intermediate log for minimal context boundary] ...\n`,
    ...tail,
  ].join("\n");

  return sanitizeText(truncated).sanitizedText;
}
