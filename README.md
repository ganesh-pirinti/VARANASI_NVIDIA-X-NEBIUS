# VARANASI — Autonomous GPU RunGuard & FinOps Margin Engine

> **Catch failures. Protect compute. Protect margins.**  
> Built for the **Nebius × NVIDIA Global AI Hackathon 2026** — *Track: Coding and Agentic Engineering*

---

## 1. Executive Summary & Problem Statement

Training and serving modern Large Language Models (e.g. NVIDIA Nemotron, Llama 3.1, DeepSeek) on high-end cloud GPUs (such as **NVIDIA H100 SXM5**, **H200**, and **L40S**) is notoriously costly and brittle:
- **Preventable Failures**: Workloads routinely crash minutes or hours into execution due to configuration hazards — such as container `/dev/shm` shared memory exhaustion (triggering PyTorch `Bus error`), CUDA Out Of Memory (OOM) due to unbudgeted KV-cache, NCCL collective operation timeouts, and unpinned CUDA ABI mismatches (e.g. FlashAttention JIT build failures).
- **FinOps Blindspots**: Teams often overprovision compute (e.g., using 8x H100 SXMs for lightweight 8B models) or run suboptimal FP32 execution, inflating compute spend by 50% to 70% without measurable latency or throughput justification.

**VARANASI** addresses both challenges through two tightly coupled modules and a shared audit manifest:
1. **GPU RunGuard**: Deterministic preflight checks for Dockerfiles, dependencies, cluster manifests, and diagnostic logs to detect failure conditions before deployment.
2. **FinOps Engine**: Mathematical GPU workload ($C_{GPU}$) and model inference ($C_{API}$) margin engine with transparent formulas, verified published price sources, and waste detection.
3. **Run & Cost Passport**: A certified, downloadable HTML/JSON compliance report with full audit trail and chain of custody.

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
           |    - Dockerfile & Image Best Practices     |            |    - Deterministic GPU Spend: C_GPU        |
           |    - Dependencies & PyTorch/CUDA Matrix    |            |    - Token Inference Cost: C_API           |
           |    - Cluster Workload Config (/dev/shm)    |            |    - Baseline vs Alternative Comparison    |
           |    - Diagnostic Log Analyzer (CUDA OOM)    |            |    - Verified Published Price Sources      |
           |    - Deterministic VRAM & KV-Cache Sizer   |            |    - Waste Detection (Overprovisioning)    |
           +--------------------------------------------+            +--------------------------------------------+
                                        \                                             /
                                         \                                           /
                                  +-------------------------------------------------------------+
                                  |                   Agentic Diagnostic Core                   |
                                  |                                                             |
                                  |  +------------------------+     +------------------------+  |
                                  |  |  Nebius Token Factory  |     |   Tavily AI Search     |  |
                                  |  |  (NVIDIA Nemotron 70B) |     |  (Technical Evidence)  |  |
                                  |  +------------------------+     +------------------------+  |
                                  +-------------------------------------------------------------+
                                                                 |
                                                                 v
                                  +-------------------------------------------------------------+
                                  |                 Run & Cost Passport                         |
                                  |  - PASS / FAIL / UNKNOWN Status Assurance                   |
                                  |  - Static vs Runtime Test Separation                        |
                                  |  - Unified Patch Diff (Approval & Re-verification State)    |
                                  |  - Downloadable Manifest (Certified HTML & JSON)            |
                                  +-------------------------------------------------------------+
```

---

## 3. Mandatory Hackathon Integrations

### A. Nebius Token Factory & NVIDIA Open-Source Model
- **Endpoint**: OpenAI-compatible `/chat/completions` API via `https://api.tokenfactory.nebius.com/v1/`
- **Model**: `nvidia/Llama-3.1-Nemotron-70B-Instruct-HF` (or `nvidia/Nemotron-3_5-Lightning`)
- **Role in VARANASI**: Contextual root-cause reasoning over sanitized execution traces and cluster manifests.
- **Privacy & Safety Boundary**:
  - The model **never** receives unfiltered raw repositories or environment files.
  - All input traces pass through `src/lib/sanitizer.ts`, which masks Bearer tokens, `sk-...` / `neb-...` keys, and credential pairs.
  - The model proposes explanations and remediation patches, but **never** determines whether a test has passed. PASS/FAIL states remain strictly deterministic.

### B. Tavily Search API
- **Endpoint**: `https://api.tavily.com/search`
- **Role in VARANASI**: Real-time retrieval of official documentation from authoritative sources (`pytorch.org`, `docs.nvidia.com`, `github.com`, `nebius.com`).
- **Evidence Separation**: Retrieved source URLs, titles, and snippets are explicitly separated in the UI from the LLM’s interpretation.

---

## 4. Deterministic Core & Formulas

Critical calculations and verification states are computed mathematically without LLM dependencies.

### GPU Workload Cost Formula
$$C_{\text{GPU}} = \sum (\text{GPU Count} \times \text{Billed Hours} \times \text{Price per GPU-hour}) + C_{\text{storage}} + C_{\text{network}}$$

### Model Inference Token Cost Formula
$$C_{\text{API}} = \frac{\text{Input Tokens} \times \text{Input Rate} + \text{Output Tokens} \times \text{Output Rate}}{1,000,000}$$

### Cost Reduction Delta
$$\Delta C = \text{Baseline Cost} - \text{Alternative Cost}$$
$$\text{Percentage Difference} = \frac{\Delta C}{\text{Baseline Cost}} \times 100\%$$

### Deterministic VRAM & KV-Cache Sizing
- **Weight Memory (GiB)**: $\text{Params (Billions)} \times 10^9 \times \text{Bytes per Param} / 1024^3$
  - FP32: 4 bytes, FP16/BF16: 2 bytes, FP8: 1 byte, INT4: 0.5 bytes.
- **KV Cache Memory (GiB)**: Multi-layer Grouped-Query Attention (GQA) tensor buffer scaled by sequence context length and concurrency batch size.
- **CUDA Runtime Overhead**: 1.6 to 2.2 GiB reserved buffer for CUDA context, NCCL communication buffers, and CUDA graph allocation.

### State Assignment Contract
- **PASS**: The check or test was executed and verified compliant against documented standards.
- **FAIL**: A fatal configuration flaw, missing resource, or runtime failure signature was detected.
- **UNKNOWN**: Input files or logs were omitted. **A test that was not executed is NEVER marked PASS.**

---

## 5. Repository Structure

```
├── .env.example                     # Reference environment variables
├── .gitignore                       # Git exclusions (credentials, node_modules, .next)
├── LICENSE                          # MIT License
├── package.json                     # Next.js 14, React 18, Tailwind, Vitest
├── tsconfig.json                    # Strict TypeScript configuration
├── tailwind.config.ts               # Custom enterprise color palette
├── vitest.config.ts                 # Vitest runner config
├── src/
│   ├── types/                       # TypeScript interfaces
│   │   ├── runguard.ts              # Preflight check types, findings, diffs
│   │   ├── finops.ts                # FinOps cost models & catalog types
│   │   ├── passport.ts              # Run & Cost Passport schema
│   │   └── api.ts                   # Nebius & Tavily request/response schemas
│   ├── lib/
│   │   ├── constants.ts             # Verified GPU catalog & CUDA-PyTorch matrix
│   │   ├── sanitizer.ts             # Secret redaction & log context boundary
│   │   ├── preflight/               # Deterministic validation engines
│   │   │   ├── dockerfile.ts        # NVIDIA container runtime checks
│   │   │   ├── dependencies.ts      # PyTorch, CUDA, Flash-Attn ABI checks
│   │   │   ├── workload-config.ts   # K8s / Slurm / Compose shared memory (/dev/shm)
│   │   │   ├── log-analyzer.ts      # CUDA OOM, NCCL timeout, SIGBUS detection
│   │   │   ├── vram-estimator.ts    # Mathematical VRAM & KV-cache estimator
│   │   │   └── engine.ts            # Aggregates preflight & generates diff patch
│   │   ├── finops/
│   │   │   └── calculator.ts        # Pure deterministic C_GPU & C_API calculator
│   │   ├── nebius/
│   │   │   └── client.ts            # Nebius Token Factory NVIDIA LLM client
│   │   ├── tavily/
│   │   │   └── client.ts            # Tavily technical search client
│   │   ├── passport/
│   │   │   └── generator.ts         # Generates Passport JSON and standalone HTML
│   │   └── fixtures/
│   │       └── demo-workloads.ts    # Built-in judge evaluation fixtures
│   ├── app/
│   │   ├── api/                     # Server-side API endpoints
│   │   │   ├── status/route.ts      # Health & credential check (no leaked secrets)
│   │   │   ├── preflight/route.ts   # Deterministic preflight execution
│   │   │   ├── diagnose/route.ts    # Nebius + Tavily reasoning pipeline
│   │   │   ├── tavily-search/route.ts # Direct Tavily search route
│   │   │   ├── finops/calculate/route.ts # Pure mathematical FinOps calculator
│   │   │   └── passport/route.ts    # Passport exporter (JSON & HTML download)
│   │   ├── globals.css              # Dark theme styling & scrollbars
│   │   ├── layout.tsx               # Root application layout
│   │   └── page.tsx                 # Unified dashboard & tabs controller
│   └── components/
│       ├── Navbar.tsx               # Header, API status indicators, fixture loader
│       ├── tabs/
│       │   ├── DashboardTab.tsx     # Overview dashboard & system status
│       │   ├── RunGuardTab.tsx      # Preflight checks, logs, VRAM gauge
│       │   ├── DiagnoseTab.tsx      # Nebius Nemotron & Tavily citations
│       │   ├── PatchReviewTab.tsx   # Reviewable diff viewer & approval workflow
│       │   ├── FinOpsTab.tsx        # Compute & token cost comparisons
│       │   └── PassportTab.tsx      # Certified Run & Cost Passport
│       └── ui/
│           ├── StatusBadge.tsx      # PASS / FAIL / UNKNOWN badges
│           ├── DiffViewer.tsx       # Unified before/after syntax diff
│           └── CitationCard.tsx     # Live Tavily documentation cards
└── src/__tests__/                   # 23 Unit tests
    ├── finops.test.ts               # GPU & token cost formulas, waste detection
    ├── preflight.test.ts            # Docker, deps, configs, logs, VRAM calculations
    ├── sanitizer.test.ts            # API key & secret redaction
    ├── external-apis.test.ts        # Missing key handling & malformed responses
    └── passport.test.ts             # Passport schema integrity & HTML export
```

---

## 6. Installation & Local Setup

### Prerequisites
- **Node.js**: v18.17+ or v20+ (tested on Node v26.3.1)
- **NPM**: v9+ or v10+

### Step 1: Clone and Install
```bash
git clone https://github.com/your-username/varanasi-gpu-runguard.git
cd varanasi-gpu-runguard
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Nebius Token Factory API Key
NEBIUS_API_KEY=your_actual_nebius_api_key_here
NEBIUS_BASE_URL=https://api.tokenfactory.nebius.com/v1
NEBIUS_MODEL=nvidia/Llama-3.1-Nemotron-70B-Instruct-HF

# Tavily Technical Search API Key
TAVILY_API_KEY=your_actual_tavily_api_key_here
```
> **Honest Fallback Note**: If API keys are omitted, VARANASI will transparently inform you in the UI. The deterministic preflight engine, VRAM sizer, FinOps margin calculator, patch review, and Passport generation remain 100% functional without external keys.

### Step 3: Run Unit Tests
```bash
npm test
```
Runs 23 unit tests across GPU cost calculations, token pricing, preflight checks, VRAM calculations, secret sanitization, and passport generation.

### Step 4: Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 5: Production Build & Run
```bash
npm run build
npm start
```

---

## 7. Demonstration Guide for Hackathon Judges

To evaluate VARANASI without supplying custom cluster files:
1. Click **Load Demo Workload** in the top navigation bar.
2. Select any of the 4 built-in realistic evaluation fixtures:
   - **vLLM 70B: CUDA OOM & Missing Shared Memory (`/dev/shm`)**: Demonstrates PyTorch shared memory exhaustion and VRAM overflow on single H100 with automated Kubernetes remediation patch.
   - **DeepSpeed ZeRO-3: Multi-Node NCCL Communication Timeout**: Demonstrates distributed collective watchdog timeout and network interface tuning.
   - **FlashAttention Build Failure: Missing Ninja**: Demonstrates unpinned dependencies, missing compilers, and architectural compute capability mismatches.
   - **Production Ready: 8x H100 SXM vLLM Multi-GPU Spec**: Compliant reference configuration passing all static and runtime tests.
3. Observe:
   - **GPU RunGuard**: Static checks distinguished from runtime test results, PASS/FAIL/UNKNOWN badges, and VRAM sizing gauges.
   - **Diagnose & Investigate**: NVIDIA Nemotron model reasoning alongside live Tavily search citations.
   - **Patch Review**: Unified diff viewer with explicit human approval step (`Generated -> Approved -> Applied -> Re-verified`).
   - **FinOps Engine**: Baseline vs Nebius Cloud cost comparison with transparent formulas ($\Delta C$) and verified source links.
   - **Run & Cost Passport**: Standalone HTML and JSON export with full audit trail.

---

## 8. Security & Privacy Guarantees

1. **Zero Secret Leakage**: All external API requests execute on the Next.js server runtime. No API keys (`NEBIUS_API_KEY`, `TAVILY_API_KEY`) are ever bundled in client-side JavaScript or returned in API responses.
2. **Deterministic Preflight Isolation**: Deterministic preflight evaluation and FinOps calculations do not send any user code or logs to external LLMs.
3. **Payload Sanitization**: When launching the optional diagnostic investigation, all text is scrubbed using regex pattern matchers that redact API keys, Bearer tokens, and sensitive key-value pairs before calling Nebius Token Factory.
4. **No Arbitrary Code Execution**: Remediation patches are presented as reviewable text diffs. VARANASI never executes arbitrary uploaded scripts or mutates cloud clusters without explicit user approval.

---

## 9. Known Limitations

- **Price Verification**: Reference prices are gathered from published cloud on-demand pricing sheets (Nebius, AWS, NVIDIA DGX Cloud) as of February 2026. Private enterprise volume discounts and spot availability fluctuate.
- **Hardware Telemetry**: Static analysis evaluates declared resource requests and configurations. Real-time dynamic GPU temperature, thermal throttling, and hardware memory bus degradation require live host node agents.
- **LLM Reasoning**: Model suggestions provided by NVIDIA Nemotron are consultative and require human review before production deployment.

---

## 10. License

This project is licensed under the [MIT License](LICENSE).
