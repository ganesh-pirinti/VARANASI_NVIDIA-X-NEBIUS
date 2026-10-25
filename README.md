# VARANASI — Autonomous GPU RunGuard & FinOps Margin Engine

> **Catch failures. Protect compute. Protect margins.**  
> Built for the **Nebius × NVIDIA Global AI Hackathon 2026** — *Track: Coding and Agentic Engineering*  
> **GitHub Repository:** [https://github.com/ganesh-pirinti/VARANASI_NVIDIA-X-NEBIUS](https://github.com/ganesh-pirinti/VARANASI_NVIDIA-X-NEBIUS)  
> **Production Deployment:** [https://varanasi-nvidia-x-nebius.vercel.app](https://varanasi-nvidia-x-nebius.vercel.app)

---

## 1. Executive Summary & Problem Statement

Training and serving modern Large Language Models (such as **NVIDIA Nemotron 70B**, **Llama 3.1**, and **DeepSeek**) on high-performance cloud GPUs (**NVIDIA H100 SXM5**, **H200**, **L40S**, and **Blackwell B200**) is notoriously costly and operationally brittle:
- **Preventable Failures**: AI workloads routinely crash minutes or hours into execution due to silent configuration hazards — including container `/dev/shm` shared memory exhaustion (triggering PyTorch `Bus error: SIGBUS`), CUDA Out Of Memory (OOM) due to unbudgeted KV-cache, NCCL collective operation watchdog timeouts, and unpinned CUDA ABI mismatches (e.g. FlashAttention JIT build failures).
- **FinOps Blindspots**: Engineering teams frequently overprovision compute (e.g., deploying 8x H100 SXMs for lightweight 8B models) or run unoptimized FP32 execution, inflating compute spend by 50% to 70% without measurable latency or throughput justification.

**VARANASI** addresses both challenges through deterministic engineering first, agentic AI assistance second, and independently verified results always:
1. **GPU RunGuard**: Deterministic preflight checks for Dockerfiles, dependencies, cluster manifests, and diagnostic logs to detect failure conditions before deployment. Features real-time VRAM/KV-cache mathematical estimation and hardware architecture constraint validation (Hopper/Ada native FP8 vs Ampere limitations).
2. **AI Fix & Closed-Loop Verification**: Reviewable unified `.patch` generator with a strict lifecycle (`GENERATED -> APPROVED -> APPLIED -> RE_VERIFIED`) that re-runs the deterministic validator against working buffers without arbitrary code execution.
3. **FinOps Margin Engine**: Audited workload cost calculations ($C_{GPU}$) and model inference ($C_{API}$) grounded in authoritative published pricing pages ([nebius.com/prices](https://nebius.com/prices)). Transparently distinguishes On-Demand vs Preemptible and GPU-hour vs Instance-hour units.
4. **Run & Cost Passport**: A certified, cryptographically sealed compliance manifest featuring SHA-256 integrity hashing, full chain-of-custody audit logs, and downloadable standalone HTML/JSON exports.

---

## 2. High-Level Architecture

```
                                  +-------------------------------------------------------------+
                                  |                 VARANASI Web Application                     |
                                  |              (Next.js 14 App Router / React)                 |
                                  +-------------------------------------------------------------+
                                         /                                           \
                                        /                                             \
           +--------------------------------------------+            +--------------------------------------------+
           |               GPU RunGuard                 |            |               FinOps Engine                |
           |    - Dockerfile & NVIDIA Container Runtime |            |    - Deterministic GPU Spend: C_GPU        |
           |    - Dependencies & PyTorch/CUDA Matrix    |            |    - Token Inference Cost: C_API           |
           |    - Cluster Workload Config (/dev/shm)    |            |    - Baseline vs Alternative Comparison    |
           |    - Diagnostic Log Analyzer (CUDA OOM)    |            |    - Verified Published Price Sources      |
           |    - Mathematical VRAM & KV-Cache Sizer    |            |    - On-Demand vs Preemptible Spot         |
           |    - Hardware FP8 Feasibility Checker      |            |    - Empirical Telemetry vs Estimates      |
           +--------------------------------------------+            +--------------------------------------------+
                                        \                                             /
                                         \                                           /
                                  +-------------------------------------------------------------+
                                  |                 Honest Agentic Diagnostic Core              |
                                  |                                                             |
                                  |  +------------------------+     +------------------------+  |
                                  |  |  Nebius Token Factory  |     |   Tavily AI Search     |  |
                                  |  |  (NVIDIA Nemotron 30B) |     |  (Technical Evidence)  |  |
                                  |  +------------------------+     +------------------------+  |
                                  |  - verifyInference Probe        - Throttling-Aware 429   |
                                  |  - Input Sanitization Boundary  - Stale Timestamp Policy |
                                  +-------------------------------------------------------------+
                                                                 |
                                                                 v
                                  +-------------------------------------------------------------+
                                  |               Run & Cost Passport (SHA-256)                 |
                                  |  - PASS / FAIL / UNKNOWN Status Assurance                   |
                                  |  - Static vs Runtime Test Separation                        |
                                  |  - Closed-Loop Patch Re-Verification Verification           |
                                  |  - Cryptographic SHA-256 Integrity Seal                     |
                                  |  - Standalone Certified HTML & JSON Exports                 |
                                  +-------------------------------------------------------------+
```

---

## 3. Enterprise Design System & Visual Identity

VARANASI implements a clean, premium enterprise aesthetic inspired by NVIDIA and modern infrastructure engineering:

### Core Color Foundations
- **Primary Background**: Warm Cream `#F7F5EF` (`--bg-app`)
- **Secondary Background**: Soft Muted Cream `#F0EEE6` (`--bg-secondary`)
- **Card Surface**: Crisp White Card `#FFFDF8` (`--bg-card`)
- **Standard Border**: Muted Sand `#E4E1D7` (`--border-standard`)
- **Subtle Divider**: Light Sand `#ECE9E0` (`--border-subtle`)
- **Border Hover**: Warm Neutral `#D5D1C5` (`--border-hover`)

### NVIDIA Green Compute Accents
- **Signature NVIDIA Green**: `#76B900` (`--nvidia-green`) — Primary CTA buttons, VRAM capacity gauges, active tabs
- **NVIDIA Hover**: `#659F00` (`--nvidia-hover`) — Interactive button hover states
- **NVIDIA Light Surface**: `#EFF6E4` (`--nvidia-surface`) — High-contrast status badges, verified tags
- **NVIDIA Dark Accent**: `#294500` (`--nvidia-dark`) — High-readability badge labels and heading accents

### Typography & Hierarchy
- **Font Stack**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`
- **High-Contrast Text**: Charcoal `#242820` (`--text-primary`)
- **Secondary Text**: Muted Charcoal `#64685F` (`--text-secondary`)
- **Muted Labels**: Soft Grey `#878C82` (`--text-muted`)
- **Tabular Numerals**: Monospace numerals for financial calculations, VRAM allocations, and timestamps.
- **Accessibility**: Built-in support for `@media (prefers-reduced-motion: reduce)` and responsive overflow guards.

---

## 4. Honest API Connectivity & Status Lifecycle

VARANASI enforces strict truthfulness regarding cloud API connectivity:

### Status State Machine
- `CHECKING`: Initial probe in-flight. Displayed during initial cold starts and manual refreshes.
- `NOT_CONFIGURED`: The required API key is confirmed absent or blank on the server.
- `CONFIGURED`: The key is present on the server, but live connectivity has not yet been verified.
- `CONNECTED`: Confirmed active connection verified via a live network request within the valid cache window.
- `STALE`: A previously verified connection whose timestamp is older than the cache TTL or where intermittent throttling occurred while a historical timestamp exists in `localStorage`.
- `RATE_LIMITED`: The external API returned HTTP 429 without a prior verified session.
- `DEGRADED`: The service is partially responsive but experiencing high latency or rate limits.
- `FAILED`: An actual network error, authentication rejection (HTTP 401/403), or 5xx error occurred.
- `UNKNOWN`: The status could not be conclusively determined.

### Catalogue Reachability vs Real Inference Probe (`verifyInference`)
- Standard health checks call `GET /models` to verify token factory catalogue reachability.
- Passing `verifyInference=true` sends an active 1-token generation probe to `/chat/completions` using `nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B`, confirming actual generation capability and quota.
- Base URL is strictly pinned to official Nebius Token Factory: `https://api.tokenfactory.nebius.com/v1`.

---

## 5. Deterministic Engineering Core & Formulas

All mission-critical calculations run deterministically in TypeScript without LLM dependency.

### GPU Workload Spend Formula ($C_{GPU}$)
- **GPU-hour unit**:
  $$C_{\text{GPU}} = \sum (\text{GPU Count} \times \text{Billed Hours} \times \text{Price per GPU-hour}) + C_{\text{storage}} + C_{\text{network}}$$
- **Instance-hour unit** (e.g. 8-GPU AWS instances):
  $$C_{\text{GPU}} = \sum (\text{Instance Count} \times \text{Billed Hours} \times \text{Price per Instance-hour}) + C_{\text{storage}} + C_{\text{network}}$$

### Model Inference Token Cost Formula ($C_{API}$)
$$C_{\text{API}} = \frac{\text{Input Tokens} \times \text{Input Rate} + \text{Output Tokens} \times \text{Output Rate}}{1,000,000}$$

### Margin Delta ($\Delta C$)
$$\Delta C = \text{Baseline Cost} - \text{Alternative Cost}$$
$$\text{Percentage Difference} = \frac{\Delta C}{\text{Baseline Cost}} \times 100\%$$

### Audited Official Nebius Cloud Rates ([nebius.com/prices](https://nebius.com/prices))
- **NVIDIA H100 SXM5 80GB**: On-Demand `$4.50`/GPU-hr | Dynamic Spot from `$0.79`/GPU-hr
- **NVIDIA H200 SXM 141GB**: On-Demand `$5.40`/GPU-hr | Dynamic Spot from `$0.79`/GPU-hr
- **NVIDIA L40S 48GB**: On-Demand `$1.55`/GPU-hr (Intel) / `$1.82` (AMD) | Preemptible `$0.74`/GPU-hr (Intel) / `$0.90` (AMD)
- **Unconfirmed Rates (A100, Blackwell B200 on-demand)**: Marked `UNKNOWN` and require user overrides.
- **Verification Guarantee**: Savings are marked `VERIFIED_PUBLISHED` only when both baseline and candidate rates match authoritative published sources. Never claim cost savings based on unverified prices or unmeasured workload performance.

### Deterministic VRAM Allocation Model
- **Weight Memory (GiB)**:
  $$\text{VRAM}_{\text{weight}} = \frac{\text{Params} \times 10^9 \times \text{BytesPerWeight}}{1024^3 \times N_{\text{GPU}}}$$
  *(FP32: 4B, FP16/BF16: 2B, FP8: 1B, INT4: 0.5B)*
- **KV-Cache Memory (GiB)**:
  $$\text{VRAM}_{\text{KV}} = \frac{2 \times \text{Layers} \times \text{Dim}_{\text{KV}} \times \text{BytesPerElement} \times \text{SeqLen} \times \text{BatchSize}}{1024^3 \times N_{\text{GPU}}}$$
  *(Grouped-Query Attention scaling factor $\sim 0.25$ for 70B+ architectures)*
- **CUDA & Runtime Overhead**: 1.6 GiB (single GPU) or 2.2 GiB (multi-GPU with NCCL communicator rings).
- **Architecture Constraints**: Native FP8 Tensor Cores are strictly validated: supported on Hopper (H100/H200), Ada Lovelace (L40S), and Blackwell (B200); flagged as unsupported on Ampere (A100).

---

## 6. Closed-Loop AI Fix Workflow

VARANASI eliminates silent mutations and arbitrary code execution through an auditable closed-loop verification pipeline:

```
[Flaw Detected] ──> [Deterministic Patch Generated] ──> [Explicit Human Approval]
                          │                                      │
                          ▼                                      ▼
             [Unified .patch Download]             [Applied to In-Memory Buffer]
                                                                 │
                                                                 ▼
                                                  [Deterministic Re-Verification]
                                                                 │
                                                                 ▼
                                                    [Status: RE_VERIFIED (Pass)]
```

1. **GENERATED**: Deterministic rules construct a minimal unified diff for configuration errors (e.g. adding `shm_size: '16gb'`, `ipc: 'host'`, or NVIDIA runtime environment variables).
2. **APPROVED**: User inspects the exact diff and explicitly clicks "Approve Patch".
3. **APPLIED**: Patch is applied strictly to the client-side in-memory configuration buffer. Zero arbitrary code execution or unprompted host file mutation.
4. **RE_VERIFIED**: The deterministic validator re-evaluates the patched buffer to ensure the targeted flaw is resolved without regressions (`isRemediated: true`).
5. **Exportable Asset**: Both the complete patched configuration file and the standalone unified `.patch` file can be downloaded.

---

## 7. Run & Cost Passport with SHA-256 Integrity

The **Run & Cost Passport** provides an enterprise-ready audit manifest for cloud AI workloads:
- **Cryptographic Seal**: Calculates a deterministic **SHA-256** hash across the canonical passport payload (identity, environment, deterministic check count, and FinOps metrics).
- **Chain of Custody**: Every step records actor attribution (`SYSTEM_DETERMINISTIC`, `NEBIUS_NVIDIA_LLM`, `TAVILY_SEARCH`, `USER_APPROVAL`) and ISO-8601 timestamps.
- **Dual Export Formats**:
  - **Standalone Certified HTML**: Self-contained HTML report with embedded styles, SHA-256 seal, and verification stamps.
  - **Structured JSON Schema**: Machine-readable payload for CI/CD pipelines and compliance archives.

---

## 8. Cloudflare Turnstile Verification & Security Guardrails

To protect expensive GPU model inference and third-party search quotas from automated scraping, credential abuse, and denial-of-wallet attacks, VARANASI implements defense-in-depth security guardrails:

```
[Client Interaction] -> [Turnstile Widget] -> [Acquire Token]
                                                      |
                                                      v
[POST /api/diagnose | /api/tavily-search] -> [Zod Schema Validation]
                                                      |
                                                      v
                                        [Server-Side Rate Limiter] (Sliding Window / Upstash)
                                                      |
                                                      v
                                     [Cloudflare Siteverify Endpoint]
                                       - Bounded 8s Abort Timeout
                                       - Fail-Closed Policy (503)
                                       - Action Binding (varanasi_*)
                                       - Hostname Whitelist Verification
                                                      |
                                            +---------+---------+
                                            | (Pass)            | (Fail / Bypass)
                                            v                   v
                               [Nebius & Tavily Clients]   [HTTP 400 / 403 / 429 / 503]
```

### Protected vs Deterministic Endpoints
- **Protected Endpoints** (Require Cloudflare Turnstile token + Rate Limiting):
  - `POST /api/diagnose`: Guarded before executing Nebius NVIDIA Nemotron inference and Tavily search.
  - `POST /api/tavily-search`: Guarded before executing live technical searches against Tavily.
- **Deterministic & Local Endpoints** (Zero third-party quota risk; run locally):
  - `GET /api/status`: Lightweight token factory model reachability and Tavily key/usage checks; never executes searches or consumes search credits during polling.
  - `POST /api/preflight`: 100% deterministic local AST parsing and static rule checks for Dockerfiles and cluster configs.
  - `POST /api/finops/calculate`: 100% deterministic financial math and pricing comparisons.
  - `POST /api/passport`: Deterministic SHA-256 seal compilation and manifest assembly.

### Security Architecture Highlights
1. **Fail-Closed Verification**: In production, if `TURNSTILE_SECRET_KEY` is not configured on the server, protected routes immediately reject requests with HTTP 503 and never proceed to call Nebius or Tavily.
2. **Action Binding**: Verifies that tokens acquired for diagnosis (`action: "varanasi_diagnose"`) cannot be replayed for search (`action: "varanasi_search"`).
3. **Hostname Whitelisting**: Through `TURNSTILE_ALLOWED_HOSTNAMES`, ensures tokens originated strictly from authorized deployment domains (e.g. `varanasi-nvidia-x-nebius.vercel.app`, `localhost`), rejecting stolen or foreign tokens.
4. **Bounded Abort Timeout**: All siteverify requests feature an 8-second timeout via `AbortController`, preventing upstream hangs.
5. **Zero Secret Leakage**: Server secrets (`TURNSTILE_SECRET_KEY`, `NEBIUS_API_KEY`, `TAVILY_API_KEY`) are strictly confined to server-side routes and never exposed to the client bundle or logs.
6. **Multi-Tier Rate Limiting**:
   - `/api/diagnose`: 10 requests / minute per IP.
   - `/api/tavily-search`: 15 requests / minute per IP.
   - In-memory sliding window fallback with clean integration hooks for distributed Upstash Redis / Vercel KV (`UPSTASH_REDIS_REST_URL`).

### Official Cloudflare Testing Keys
For local development, staging, or automated CI/CD runs without solving interactive CAPTCHAs, Cloudflare provides official dummy keys:
- **Always Passes**:
  - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: `1x00000000000000000000AA`
  - `TURNSTILE_SECRET_KEY`: `1x0000000000000000000000000000000AA`
- **Always Blocks**:
  - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: `2x00000000000000000000AB`
  - `TURNSTILE_SECRET_KEY`: `2x0000000000000000000000000000000AA`

---

## 9. Test Suite & Verification Results

VARANASI is backed by 72 automated unit tests across 8 test suites covering deterministic logic, security guardrails, resilient JSON parsing, prompt injection defense, and external provider isolation:

```bash
npm test
```

### Verified Test Suites:
- `src/__tests__/preflight.test.ts` (13 tests): Dockerfile checks, PyTorch/CUDA compatibility, `/dev/shm` shared memory checks, CUDA OOM log parsing, VRAM estimation, 5MB body size limits, and route validation.
- `src/__tests__/finops.test.ts` (12 tests): GPU cost formulas, instance-hour conversion, On-Demand vs Preemptible rates, token pricing, waste detection, numeric bounds, and API route validation.
- `src/__tests__/turnstile.test.ts` (10 tests): Cloudflare siteverify validation, fail-closed policy on missing secrets, hostname whitelisting, action binding, token expiration/reuse handling, bounded timeouts, and upstream network error recovery.
- `src/__tests__/protected-routes.test.ts` (10 tests): Route-level token enforcement on `/api/diagnose` and `/api/tavily-search`, verifying that Nebius and Tavily are never invoked on unverified requests, and server-side rate-limit thresholds.
- `src/__tests__/status.test.ts` (9 tests): Status state machine, cold starts, client timestamps, `verifyInference` probe, and decoupling search execution from status polling.
- `src/__tests__/external-apis.test.ts` (7 tests): Handling missing keys, network timeouts, conversational markdown JSON extraction, untrusted log isolation within security boundary tags, and explicit Tavily 429 rate limit errors.
- `src/__tests__/sanitizer.test.ts` (6 tests): Secret masking for Bearer tokens, `sk-...` / `neb-...` keys, credential pairs, Cloudflare keys, JWTs, and database URIs.
- `src/__tests__/passport.test.ts` (5 tests): Passport schema assembly, audit trail recording, secret exclusion, SHA-256 integrity hash verification, standalone HTML export, and API route validation.

---

## 10. Quickstart & Deployment

### Local Development
```bash
# 1. Clone repository
git clone https://github.com/ganesh-pirinti/VARANASI_NVIDIA-X-NEBIUS.git
cd VARANASI_NVIDIA-X-NEBIUS

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Set NEBIUS_API_KEY, TAVILY_API_KEY, NEXT_PUBLIC_TURNSTILE_SITE_KEY, and TURNSTILE_SECRET_KEY

# 4. Run test suite (all 72 tests must pass)
npm test

# 5. Start development server
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Deploy to Vercel
```bash
vercel --prod --yes
```

---

## 11. License

Licensed under the [MIT License](LICENSE). Built for the Nebius × NVIDIA Global AI Hackathon 2026.
