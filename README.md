# ⚡ BlueprintAI (Compile)

> **Turn messy business input into commit-ready software blueprints in seconds.**  
> *Built for Chaos2Commit 2026*

[![Vite](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-646CFF?logo=vite)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?logo=node.js)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/AI%20Microservice-FastAPI%20%2B%20Python-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![MySQL](https://img.shields.io/badge/Database-MySQL%208.0-4479A1?logo=mysql)](https://www.mysql.com/)
[![Gemini](https://img.shields.io/badge/LLM-Google%20Gemini%202.0%2F3.6%20Flash-4285F4?logo=google)](https://ai.google.dev/)

---
## 👥 Team & Acknowledgements
- **Team Name**: Blueprint_AI
- **Product**: Compile
- **Team**:
- **Dhruv Bhoi-D26CE154 [Leader]**: System Logic & System Architect
- **Jiya Sheth-D26CE174**: AI Integration & UI/UX
- **Kush Parekh-D26CE148**: Frontend & Backend
- **Heet Doshi-D26CE169**: Technical Documentation
- **Mentor**:Prof. Rikita Chokshi, CE,CSPIT,CHARUSAT
- **Competition**: Chaos2Commit 2026
- **License**: MIT

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [The Problem & Solution](#-the-problem--solution)
3. [System Architecture](#-system-architecture)
4. [End-to-End Workflow (Evaluator Flow)](#-end-to-end-workflow-evaluator-flow)
5. [Key Deliverables Generated](#-key-deliverables-generated)
6. [Prerequisites & System Requirements](#-prerequisites--system-requirements)
7. [Step-by-Step Setup Guide](#-step-by-step-setup-guide)
   - [1. Database Setup (MySQL / Docker)](#1-database-setup-mysql--docker)
   - [2. AI Microservice Setup (Python FastAPI)](#2-ai-microservice-setup-python-fastapi)
   - [3. Backend API Setup (Node.js Express)](#3-backend-api-setup-nodejs-express)
   - [4. Frontend Setup (React + Vite)](#4-frontend-setup-react--vite)
8. [Environment Configuration Reference](#-environment-configuration-reference)
9. [Evaluation & Verification Checklist](#-evaluation--verification-checklist)
10. [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 🎯 Project Overview

**BlueprintAI** is an autonomous enterprise solution compiler. It takes vague, unstructured business inputs—such as Standard Operating Procedures (SOPs), meeting transcripts, legacy process documents, or raw problem briefs—and transforms them into high-fidelity, engineering-ready project deliverables in under 45 seconds.

Instead of spending **2 to 4 weeks** in manual requirement gathering, stakeholder discovery, and solution architecture design, BlueprintAI leverages an interactive AI consultant coupled with a multi-stage compilation pipeline to generate:
- Complete **Business Requirements Documents (BRDs)**
- High-Level **Solution Architecture (HLD)** & Tech Stacks
- Step-by-Step **BPMN Process Workflows**
- Normalized **Relational Database Schemas (DDL)**
- Component-Level **UI/UX Wireframes**
- 3-Tier **Effort, Cost Bands & Delivery Timelines**
- Full **Version Ledger, Side-by-Side Diffs & Rollbacks**
- Instant **PDF, Word (.docx), and JSON Exports**

---

## 💡 The Problem & Solution

| The Traditional Chaos (Weeks) | BlueprintAI Solution (Seconds) |
|---|---|
| **Vague Requirements**: Fragmented notes, unstated business rules, and hidden process gaps. | **Autonomous AI Discovery**: Proactively detects context gaps and asks up to 7 targeted clarifying questions. |
| **Siloed Deliverables**: Architecture, BRD, DB design, and estimates written separately over weeks. | **Unified Parallel Compilation**: Synthesizes all 6 engineering artifacts concurrently in ~35–45 seconds. |
| **Stale Documentation**: Scope changes invalidate existing architecture and pricing. | **Modular Section Regeneration & Version Snapshots**: Re-run just the BRD or Architecture; every iteration creates an immutable snapshot with visual diffing. |
| **Unreliable AI Hallucinations**: Generic outputs without validation or fallback. | **Resilient AI Pipeline**: Exponential backoff, multi-model fallback chain (Gemini 2.0/3.6, GPT-4o, Claude 3.5, and local heuristics), zero silent failures. |

---

## 🏗️ System Architecture

```
                                  ┌───────────────────────────────┐
                                  │      User / Evaluator         │
                                  └───────────────┬───────────────┘
                                                  │
                                                  ▼
                        ┌───────────────────────────────────────────────────┐
                        │        Frontend Application (React 19 + Vite)     │
                        │           Port: 5173  (Responsive UI)             │
                        └─────────┬───────────────────────────────▲─────────┘
                                  │                               │
                                  │ REST API Calls / Auth         │ Delivers BRD, HLD,
                                  │ Multi-format Exports (PDF/Doc)│ Schema, Wireframes
                                  ▼                               │
                        ┌─────────────────────────────────────────┴─────────┐
                        │           Backend API (Node.js + Express)         │
                        │                     Port: 5000                    │
                        │  - JWT Authentication & Workspace Isolation       │
                        │  - Multi-LLM Routing & Heuristic Fallbacks        │
                        │  - Version Snapshot & Visual Diff Engine          │
                        └─────────┬───────────────────────────────▲─────────┘
                                  │                               │
             Direct SQL Queries   │                               │ Internal HTTP Bridge
             Connection Pooling   ▼                               ▼
    ┌──────────────────────────────┐              ┌─────────────────────────────────┐
    │     MySQL 8.0 Database       │              │  AI Microservice (Python FastAPI)│
    │         Port: 3306           │              │           Port: 8000            │
    │  - 12 Relational Tables      │              │  - Scikit-learn Classifier      │
    │  - Session & Version Ledger  │              │  - Google Gemini 2.0/3.6 Flash   │
    │  - Deliverables Storage      │              │  - NLP & Heuristic Fallbacks    │
    └──────────────────────────────┘              └─────────────────────────────────┘
```

---

## 🔄 End-to-End Workflow (Evaluator Flow)

When an evaluator reviews the platform, this is the exact flow to experience:

```
[1. Intake Screen]  ───►  [2. AI Discovery Chat]  ───►  [3. Compilation Engine]
 Paste SOP / Brief         Context-aware Q&A             Parallel generation
 Upload PDF/DOCX           5-7 dynamic questions         ~35-45 seconds
        │                           │                           │
        ▼                           ▼                           ▼
[6. Export & Share] ◄───  [5. Version History]   ◄───  [4. Deliverable Hub]
 PDF, Word, JSON           v1.0 vs v2.0 Diff             6 interactive tabs
 Formal client-ready       One-click rollback            Regenerate any section
```

1. **Intake (`/input`)**:
   - The user inputs raw requirements (e.g. *"Smart Citizen E-Governance: Automate public grievance redressal and civic certificate issuance"* or uploads an operational SOP).
   - The client analyzer classifies the domain, industry, complexity, and initial entity candidates.

2. **AI Discovery Q&A (`/discovery/:id`)**:
   - The AI Business Consultant identifies ambiguities and poses up to 7 targeted questions (e.g., SLA requirements, verification roles, integration hooks).
   - The user can answer inline or skip to generate with flagged assumptions.

3. **Compilation Pipeline (`/compile`)**:
   - Backend orchestrates parallel workers across the Python FastAPI engine and LLM providers.
   - Generates all deliverables in parallel with automated validation.

4. **Deliverable Hub (`/result/:id`)**:
   - Evaluator explores 6 interactive tabs:
     - **Tab 1 — Executive BRD**: Scope, objectives, gap analysis, functional & non-functional requirements.
     - **Tab 2 — Architecture (HLD)**: System topology, modular components, tech stack rationale, security controls.
     - **Tab 3 — BPMN Process Flow**: Step-by-step visual workflow with roles, triggers, and decision gates.
     - **Tab 4 — Database Schema**: Relational tables, columns, primary/foreign keys, and SQL types.
     - **Tab 5 — Wireframes**: UI component blueprints and layout specifications.
     - **Tab 6 — Estimates & Roadmap**: 3-tier cost cards (Low/Mid/High) and phased timeline breakdown.

5. **Regeneration & Version Ledger (`/versions/:id`)**:
   - Click **"Regenerate Section"** on any tab (e.g. update BRD).
   - BlueprintAI creates an immutable snapshot (`v2.0`).
   - Evaluator opens **Version History** to inspect side-by-side visual diffs and test instant rollback.

6. **Client-Ready Export (`/export`)**:
   - One-click export to **PDF**, **Microsoft Word (.docx)**, or **JSON**.

---

## 📦 Key Deliverables Generated

```
blueprintAI/
├── 📄 BRD (Business Requirements Document)
│   ├── Executive Objectives & Business Drivers
│   ├── In-Scope & Out-of-Scope Boundaries
│   ├── Gap Analysis (Current vs. Desired State with Impact Ratings)
│   ├── Functional Requirements (FR-1.x with priorities)
│   └── Non-Functional Requirements (NFR-2.x for SLA, Security, Scale)
├── 🏛️ Solution Architecture (HLD)
│   ├── Multi-Tier Component Topology
│   ├── Tech Stack Selection with Justification
│   ├── Data Flow & Integration Points
│   └── Security, Compliance & Governance Controls
├── 🔀 BPMN Process Diagrams
│   ├── Swimlance Roles & Actors
│   ├── Automated vs. Manual Decision Gateways
│   └── SLA Thresholds & Exception Paths
├── 🗄️ Relational Database Schema
│   ├── Normalized 3NF Entity Relationship Structures
│   ├── Data Types, Primary Keys, Foreign Keys, & Constraints
├── 📱 UI/UX Wireframe Specifications
│   ├── Screen Hierarchies & Layout Wireframes
│   └── Form Field Blueprints & Validation Rules
└── 💰 Effort, Cost & Roadmap Planning
    ├── 3-Tier Budget Model (MVP Baseline, Production Target, Enterprise Scale)
    └── Phase-by-Phase Timeline Allocation in Person-Weeks
```

---

## 💻 Prerequisites & System Requirements

Ensure the following tools are installed on your system before proceeding:

| Dependency | Minimum Version | Recommended | Notes |
|---|---|---|---|
| **Node.js** | `v18.x` | `v20.x` or `v22.x` | Required for Frontend & Backend |
| **npm** | `v9.x` | `v10.x` | Bundled with Node.js |
| **Python** | `3.10.x` | `3.10.x` – `3.12.x` | Required for AI microservice |
| **MySQL** | `8.0+` | `8.0` (or Docker) | Relational persistence |
| **Git** | `2.x` | Latest | Version control |

---

## 🚀 Step-by-Step Setup Guide

The application consists of three independent services + one database:
1. **Database**: MySQL 8.0
2. **AI Microservice**: Python FastAPI (Port 8000)
3. **Backend API**: Node.js Express (Port 5000)
4. **Frontend App**: React 19 + Vite (Port 5173)

---

### 1. Database Setup (MySQL / Docker)

You can run MySQL locally (via XAMPP / MySQL Server) or using Docker.

#### Option A: Using Docker (Recommended)
From the root project directory:
```bash
docker-compose up -d
```
*This starts a MySQL 8.0 container on port 3306 with database `compile_db` and user `compile_user`.*

#### Option B: Using Local MySQL / XAMPP
1. Start your local MySQL service on port `3306`.
2. Ensure you have a user with permission to create databases (default: `root` with no password).
3. The database migration script will automatically create `compile_db` and its 12 tables.

---

### 2. AI Microservice Setup (Python FastAPI)

The AI Microservice handles scikit-learn pattern classification, heuristic synthesis, and Google Gemini LLM orchestration.

1. Open a terminal and navigate to the Python API directory:
   ```bash
   cd Compile_AI/compile-ai/api
   ```

2. *(Optional but recommended)* Create and activate a virtual environment:
   ```bash
   # Windows PowerShell
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements_api.txt
   pip install google-genai
   ```

4. Verify or create `.env` in `Compile_AI/compile-ai/api/.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

5. Start the FastAPI microservice:
   ```bash
   python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```
   *The service will start on `http://127.0.0.1:8000`. Test health at `http://127.0.0.1:8000/health`.*

---

### 3. Backend API Setup (Node.js Express)

1. Open a new terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` from the root or create `backend/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=compile-super-secret-jwt-key-2026
   JWT_EXPIRES_IN=10d

   # MySQL Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=compile_db

   # Multi-LLM Provider Configuration
   LLM_PROVIDER=gemini
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-3.6-flash
   FALLBACK_TO_HEURISTICS=true
   ```

4. Initialize the Database Schema (runs migrations):
   ```bash
   npm run db:init
   ```
   *Expected output: `✅ MySQL Database and all 12 tables created successfully!`*

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend will start on `http://localhost:5000`.*

---

### 4. Frontend Setup (React + Vite)

1. Open a new terminal in the project root:
   ```bash
   cd blueprintAI
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The client application will start at `http://localhost:5173`.*

4. Production Build Verification (Optional):
   ```bash
   npm run build
   ```
   *Generates optimized production bundle in `/dist`.*

---

## ⚙️ Environment Configuration Reference

The root `.env.example` provides the full configuration template:

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5000` | Backend Express server port |
| `NODE_ENV` | `development` | Runtime environment mode |
| `JWT_SECRET` | `compile-super-secret-jwt-key-2026` | Token signing secret |
| `DB_HOST` | `localhost` | MySQL hostname |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USER` | `root` | MySQL username |
| `DB_PASSWORD` | *(empty)* | MySQL password |
| `DB_NAME` | `compile_db` | Target database name |
| `LLM_PROVIDER` | `auto` | Active provider: `auto`, `gemini`, `openai`, `anthropic`, `groq`, `deepseek`, `ollama` |
| `GEMINI_API_KEY` | *(empty)* | Google Gemini API key |
| `GEMINI_MODEL` | `gemini-3.6-flash` | Gemini model variant |
| `FALLBACK_TO_HEURISTICS` | `true` | Safe fallback if external LLM APIs fail |

---

## 🧪 Evaluation & Verification Checklist

Evaluators can verify every capability using this quick checklist:

| Check | Action / Route | Expected Result |
|---|---|---|
| **1. System Health** | `GET http://localhost:5000/api/health` | Returns JSON: `status: "online"`, `database: "connected (MySQL)"`, `compileAiModelServer: "active"` |
| **2. Responsive UI** | Resize browser or inspect mobile view (<768px) | Sidebar collapses into drawer, cards wrap to 1-col, zero horizontal overflow |
| **3. Intake & Classification** | Submit problem on `/input` | Instantly classifies industry, complexity, and transitions to Discovery |
| **4. AI Discovery** | Answer or skip questions on `/discovery/:id` | Generates 5–7 relevant questions; answers propagate to compilation |
| **5. Multi-Tab Deliverables** | Inspect `/result/:id` | All 6 tabs load cleanly (BRD, Architecture, BPMN, DB, Wireframes, Estimates) |
| **6. Currency Accuracy** | View Cost Cards on Estimates Tab | Single dollar sign format (`$28,000`, `$45,000`, `$68,000`) without duplication |
| **7. Clean Markdown** | Inspect Scope & Objectives | Rendered as styled typography without raw `#` or `**` characters |
| **8. Modular Regeneration** | Click "Regenerate Section" on BRD tab | Only the BRD re-runs; notification confirms new snapshot created |
| **9. Version History Diff** | Open `/versions/:id` & click "Compare with Current" | Side-by-side modal highlights differences between `v1.0` and `v2.0` |
| **10. Multi-Format Export** | Click "Export" -> PDF / Word / JSON | Instant clean download with formatted corporate headers |

---

## ❓ Troubleshooting & FAQs

### Q1: `uvicorn` fails with `PathNotFound` or directory error
**Fix**: Ensure you run uvicorn from inside the `Compile_AI/compile-ai/api` folder:
```bash
cd "Compile_AI/compile-ai/api"
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### Q2: Backend reports `database: disconnected` on `/api/health`
**Fix**: Ensure MySQL is running on port 3306. If using Docker, run `docker-compose up -d`. If using local MySQL with a password, update `DB_PASSWORD` in `backend/.env`. Then run:
```bash
cd backend
npm run db:init
```

### Q3: AI call fails due to quota or network issues
**Fix**: BlueprintAI features **resilient heuristic fallback** (`FALLBACK_TO_HEURISTICS=true`). The system automatically extracts project context and generates complete deliverables with a fallback notice banner so you can continue testing without external API keys.

---

