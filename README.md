# NAUTILUS Banking System

> **Zero-Trust Multi-Bank Settlement Network & Payment Interface**  
> An educational and production-grade simulated payment architecture featuring an **All Connected Payments Interface (ACPI)**, atomic multi-bank double-ledger settlement, RSA-OAEP asymmetric payload encryption, HMAC-SHA256 request signing, two-factor OTP verification via Brevo, and timed self-expiring QR payment tokens.

---

## Table of Contents
- [1. What the Project Is](#1-what-the-project-is)
- [2. What the Project Does](#2-what-the-project-does)
- [3. Project Detailed Summary](#3-project-detailed-summary)
- [4. What the Project Provides](#4-what-the-project-provides)
- [5. How It Does What It Does (Architecture & Flow)](#5-how-it-does-what-it-does-architecture--flow)
- [6. How It Communicates (Protocols & Networking)](#6-how-it-communicates-protocols--networking)
- [7. How Backend and Frontend Handle Their Work](#7-how-backend-and-frontend-handle-their-work)
- [8. Security Architecture & Cryptography](#8-security-architecture--cryptography)
- [9. Tech Stack](#9-tech-stack)
- [10. File Structure](#10-file-structure)
- [11. Requirements & Prerequisites](#11-requirements--prerequisites)
- [12. Environment Configuration](#12-environment-configuration)
- [13. Database Setup & Schema](#13-database-setup--schema)
- [14. Local Development Guide](#14-local-development-guide)
- [15. API Reference](#15-api-reference)

---

## 1. What the Project Is

**NAUTILUS** is an end-to-end simulated inter-bank settlement ecosystem modeled after modern real-time gross settlement systems (such as UPI / IMPS protocols). 

The platform operates across three independent, isolated banking entities:
- **Common People's Bank (`CPB`)** — Retail ledger network (Routing ID `0x01`)
- **Elses Bank (`EB`)** — Commercial and private account vault (Routing ID `0x02`)
- **SomeBank (`SB`)** — Reserve and institutional settlement branch (Routing ID `0x03`)

At the core sits the **All Connected Payments Interface (ACPI)** — a decentralized payment orchestration engine that acts as the clearing house and communication medium between autonomous bank ledgers.

---

## 2. What the Project Does

- **Inter-Bank Fund Transfers**: Enables instant, zero-loss balance transfers between accounts residing in different banking institutions.
- **Atomic Double-Ledger Settlement**: Ensures strict ACID guarantees — debits the sender's bank ledger and credits the receiver's bank ledger simultaneously in a single transaction; if either fails, the entire transaction rolls back.
- **Identity & Account Provisioning**: Generates unique, collision-resistant 8-digit Bank User IDs (`10000000`–`99999999`) across participating banks with password hashing.
- **Two-Factor Authentication (2FA OTP)**: Enforces Brevo-powered 6-digit transactional email OTP verification for every sign-up and login event.
- **Timed Encrypted QR Transactions**: Generates 2-minute dynamic QR codes embedded with RSA-OAEP encrypted payloads to prevent replay attacks and token harvesting.
- **Simulated Liquidity Faucets**: Allows test funds to be deposited directly or claimed via single-use faucet QR codes (up to $500 per claim, max 10 requests/day, $100M balance cap).
- **Audit & Transaction Ledger**: Maintains an immutable log of every transaction with UUID tracking, sender/receiver metadata, timestamps, and failure diagnostics.
- **Anti-Abuse & Rate Limiting**: Employs client IP sliding-window rate limiters and automatic IP ban mechanisms to thwart brute-force and credential-stuffing attempts.

---

## 3. Project Detailed Summary

```
+---------------------------------------------------------------------------------------+
|                                    NAUTILUS SYSTEM                                    |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|   +--------------------------+                         +--------------------------+   |
|   |    Frontend (Client)     |   HTTPS / JSON / HMAC   |    FastAPI (Backend)     |   |
|   |  - Next.js 15 (App Router| ======================> |  - Auth & OTP Router     |   |
|   |  - React 19 + TypeScript | <====================== |  - Bank & ACPI Routers   |   |
|   |  - Tailwind CSS + UI     |     Encrypted Payload   |  - QR Code Engine (PIL)  |   |
|   |  - node-forge Crypto     |                         |  - SlowAPI Rate Limiter  |   |
|   +--------------------------+                         +--------------------------+   |
|                                                                     ||                |
|                                        +----------------------------++                |
|                                        |                                              |
|                                        v                                              |
|                      +----------------------------------+                             |
|                      |  ACPI Transaction Engine (Core)  |                             |
|                      |  - Cross-Bank Account Validation |                             |
|                      |  - Settlement Dispatcher         |                             |
|                      +----------------------------------+                             |
|                                        ||                                             |
|                                        v                                              |
|                      +----------------------------------+                             |
|                      |      Supabase PostgreSQL DB      |                             |
|                      |  - cpb_database (Table)          |                             |
|                      |  - eb_database  (Table)          |                             |
|                      |  - sb_database  (Table)          |                             |
|                      |  - transactions (Ledger Table)   |                             |
|                      |  - transfer_money (PL/pgSQL RPC) |                             |
|                      +----------------------------------+                             |
|                                                                                       |
+---------------------------------------------------------------------------------------+
```

NAUTILUS is structured into three fundamental operational tiers:
1. **The Client Interface (PSP Layer)**: The user-facing banking console built with Next.js 15, providing balance inspection, fund transfer forms, QR scanners, and faucet claims.
2. **The API & Routing Layer**: FastAPI service providing strict data contracts (Pydantic), signature verification, rate limiting, and JWT session handling.
3. **The ACPI Engine & Bank Ledgers**: The transaction settlement kernel invoking PostgreSQL stored procedures (`transfer_money`) that execute atomic row-level locked transactions.

---

## 4. What the Project Provides

| Feature | Description |
| :--- | :--- |
| **Atomic Cross-Bank Transfers** | Instant money movement between CPB, EB, and SB with zero partial failure risk. |
| **2FA Email OTP Verification** | 6-digit cryptographically generated one-time passwords delivered via Brevo REST API. |
| **RSA-OAEP 2048-bit Encryption** | Asymmetric encryption of sensitive identifiers in transit and within QR payloads. |
| **HMAC-SHA256 Request Signing** | Header-level request body integrity and anti-tampering verification. |
| **Dynamic Timed QR Codes** | 2-minute time-to-live (TTL) scannable QR tokens rendered as Base64 PNGs. |
| **Bank Faucet & QR Claiming** | Sandbox liquidity faucet ($1-$500 per request, max 10/day, $100M cap) with QR token redemption. |
| **Multi-Tenant Bank Ledgers** | Separate database tables per bank (`cpb_database`, `eb_database`, `sb_database`). |
| **Brute-Force & Rate Protection** | Sliding-window IP throttling and auto-banning for unauthorized access attempts. |
| **Immutable Transaction Ledger** | PostgreSQL transaction table recording all transfer states (`pending`, `success`, `failed`). |

---

## 5. How It Does What It Does (Architecture & Flow)

### Inter-Bank Settlement Sequence (ACPI Double-Ledger)

```
[Sender Client]               [FastAPI / ACPI]               [Bank Ledger RPC]               [Receiver Bank]
       |                              |                              |                              |
       | 1. POST /bank/req/sender     |                              |                              |
       |----------------------------->|                              |                              |
       |                              | 2. Validate sender balance   |                              |
       |                              |    & account existence       |                              |
       |                              |                              |                              |
       |                              | 3. Invoke ACPI Engine        |                              |
       |                              |    execute_transfer()        |                              |
       |                              |                              |                              |
       |                              | 4. Call transfer_money() RPC |                              |
       |                              |----------------------------->|                              |
       |                              |                              | 5. SELECT FOR UPDATE (Lock)  |
       |                              |                              |    - Verify Sender Balance   |
       |                              |                              |    - Verify Receiver Cap     |
       |                              |                              | 6. Debit Sender Balance      |
       |                              |                              | 7. Credit Receiver Balance   |
       |                              |                              | 8. Insert Transaction Log    |
       |                              | 9. Returns txn_id & balances |                              |
       |                              |<-----------------------------|                              |
       | 10. HTTP 200 (Success Conf)  |                              |                              |
       |<-----------------------------|                              |                              |
```

1. **Initiation**: The sender's client dispatches a transfer request with `sender_bank_id`, `sender_bank_user_id`, `receiver_bank_id`, `receiver_bank_user_id`, and `amount`.
2. **Pre-Validation**: `BankFunctions` and `ACPITransactionEngine` verify that both sender and receiver accounts exist in their respective bank tables.
3. **Pessimistic Locking & Execution**:
   - Supabase RPC `transfer_money` executes inside a PostgreSQL transaction.
   - `SELECT balance FROM <sender_bank>_database WHERE bank_user_id = $1 FOR UPDATE` locks the sender record against race conditions.
   - Verifies available balance: `v_sender_balance >= p_amount`.
   - `SELECT balance FROM <receiver_bank>_database WHERE bank_user_id = $1 FOR UPDATE` locks the recipient record.
   - Verifies recipient max limit ($100,000,000 cap).
   - Atomically updates balances:
     ```sql
     UPDATE {sender_bank}_database SET balance = balance - p_amount, updated_at = NOW();
     UPDATE {receiver_bank}_database SET balance = balance + p_amount, updated_at = NOW();
     ```
   - Sets transaction record status to `'success'`.
4. **Settlement Confirmation**: ACPI returns the unique `transaction_id`, confirmation status, and updated balances to the caller.

---

## 6. How It Communicates (Protocols & Networking)

```
+------------------+         HTTPS / JSON (Bearer JWT)         +------------------+
|                  | ----------------------------------------> |                  |
|  Next.js Client  |        X-Signature: <HMAC-SHA256>         |  FastAPI Backend |
|  (Vercel Hosted) |        X-Timestamp: <Unix Epoch>          | (Render Hosted)  |
|                  | <---------------------------------------- |                  |
+------------------+             JSON Response                 +------------------+
                                                                     |     ^
                                             HTTPS / REST (v3 API)   |     |
                                          +--------------------------+     | PostgreSQL TCP
                                          v                                v
                                   +--------------+               +------------------+
                                   |  Brevo Email |               |  Supabase Cloud  |
                                   |  (SMTP API)  |               | (Postgres + RPC) |
                                   +--------------+               +------------------+
```

- **Client-to-Backend**: 
  - Standard REST over HTTPS using `fetch` via `Frontend/src/lib/apiClient.ts`.
  - Content-Type: `application/json`.
  - Authentication: `Authorization: Bearer <token>` carrying custom signed JWTs.
  - CORS Middleware: Configured on FastAPI to accept requests from authorized client origins (`https://nautilusbanking.vercel.app`, `localhost:3000`, etc.).
- **Backend-to-Database**:
  - Supabase Python Client connecting to PostgreSQL via PostgREST and remote procedure calls (`supabase.rpc("transfer_money", params)`).
- **Backend-to-Brevo**:
  - Asynchronous HTTP/2 calls via `httpx.AsyncClient` to `https://api.brevo.com/v3/smtp/email` using `api-key` header authorization.

---

## 7. How Backend and Frontend Handle Their Work

### Frontend Responsibilities (`Frontend/`)
- **State & Session Management**: `AuthContext.tsx` handles user sessions, JWT token persistence in `localStorage`, and route protection via `AuthGuard.tsx`.
- **Client-Side Cryptography**: `clientCrypto.ts` uses `node-forge` to encrypt payloads with the public RSA key and create HMAC-SHA256 signatures before transmission.
- **Form Validation & Sanitization**: `sanitizer.ts` strips dangerous characters, tags, and symbols before data leaves the browser.
- **Real-Time Timers**: Manages countdown timers for the 2-minute QR code validity and 60-second OTP resend cooldowns.
- **UI & UX Engine**: Built using Tailwind CSS, Lucide icons, responsive card components, modals, and status badges.

### Backend Responsibilities (`Backend/`)
- **Gateway & Route Protection**: `FastAPI` routes incoming requests through rate limiters (`SlowAPI`) and authentication dependencies (`verify_common`, `verify_protected`).
- **Signature & Security Checking**: `middleware/security.py` parses `X-Signature` and `X-Timestamp` headers to ensure requests have not been tampered with or replayed.
- **Auth & OTP Lifecycle**: `routers/auth_router.py` coordinates password verification (salted SHA-256), OTP generation, database insertion, and Brevo email delivery.
- **QR Lifecycle Management**: `qr_service/QrCodeMaker.py` generates dynamic QR codes (PNG base64), manages an in-memory TTL store, and enforces single-use faucet claims.
- **ACPI Engine Orchestration**: `ACPI/main.py` coordinates multi-bank account discovery, validation, and RPC execution.

---

## 8. Security Architecture & Cryptography

```
                    +-------------------------------------------------+
                    |              SECURITY ARCHITECTURE              |
                    +-------------------------------------------------+
                                             |
        +--------------------+---------------+--------------------+--------------------+
        |                    |                                    |                    |
        v                    v                                    v                    v
+---------------+    +---------------+                    +---------------+    +---------------+
|   RSA-OAEP    |    |  HMAC-SHA256  |                    | 2FA OTP Auth  |    | Rate Limiting |
|   2048-Bit    |    |  Signatures   |                    | (Brevo Email) |    | & IP Banning  |
+---------------+    +---------------+                    +---------------+    +---------------+
| Encrypts QR   |    | Verifies      |                    | 6-digit OTP   |    | 30 req/min    |
| payloads &    |    | payload body  |                    | 5-min TTL     |    | 3-min auto-ban|
| identifiers   |    | integrity     |                    | Max 5 attempts|    | on violation  |
+---------------+    +---------------+                    +---------------+    +---------------+
```

### 1. Asymmetric Encryption (RSA-OAEP 2048-Bit)
- Implemented in `Backend/encryption/encrypt.py` (using `cryptography.hazmat`) and `Frontend/src/features/crypto/clientCrypto.ts` (using `node-forge`).
- Uses SHA-256 for both the digest algorithm and the Optimal Asymmetric Encryption Padding (OAEP) Mask Generation Function (MGF1).
- Keys are loaded per request from environment variables (`PRIVATE_KEY`, `PUBLIC_KEY`) and are never cached globally.

### 2. Request Integrity (HMAC-SHA256)
- Requests can be signed with an HMAC-SHA256 digest computed over `"{timestamp}:{body}"`.
- Verified on the server using constant-time string comparison (`hmac.compare_digest`) to prevent timing side-channel attacks.

### 3. Password Hashing & Salt
- Passwords are salted with an application-specific cryptographic salt and hashed via SHA-256 before storage in database tables.

### 4. Two-Factor Authentication (OTP Pipeline)
- Cryptographically secure 6-digit random code generated via Python `secrets`.
- 5-minute expiration time stored in `otp_codes` table.
- Maximum 5 attempts allowed per OTP before invalidation.
- 60-second cooldown enforced between resend requests.

### 5. Denial-of-Service & Brute-Force Defense
- Per-IP sliding window rate limiting (e.g. 30 requests / 60 seconds).
- Exceeding thresholds automatically records a temporary ban in `ip_blocks` (default: 3 minutes).
- FastAPI rate limiting handled by `SlowAPI` with custom JSON responses.

### 6. Database Concurrency & Isolation
- Row-level locking (`FOR UPDATE`) in PostgreSQL prevents race conditions and balance duplication.
- Database-level check constraints enforce: `balance >= 0 AND balance <= 100000000`.

---

## 9. Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **ASGI Server**: Uvicorn
- **Validation**: Pydantic v2
- **Cryptography**: `cryptography` (Hazmat RSA-OAEP, HMAC, SHA-256)
- **Token Security**: PyJWT
- **Rate Limiting**: SlowAPI (Limiter)
- **Database Client**: Supabase Python SDK (`supabase-py`)
- **HTTP Client**: HTTPX (Async communication with Brevo)
- **QR Generation**: QRCode (PIL / Pillow)

### Frontend
- **Framework**: Next.js 15 (App Router, Server & Client Components)
- **Library**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **Client Cryptography**: `node-forge` (RSA-OAEP & HMAC in browser)
- **QR Rendering**: `qrcode.react`
- **Icons**: Lucide React
- **Utility**: `clsx`, `tailwind-merge`

### Infrastructure & Database
- **Database**: PostgreSQL (Supabase Cloud) with PL/pgSQL Stored Procedures
- **Email Service**: Brevo (formerly Sendinblue) Transactional REST API v3
- **Backend Hosting**: Render (Linux Web Service)
- **Frontend Hosting**: Vercel (Edge Network)

---

## 10. File Structure

```
Banking_System/
├── README.md                           # Comprehensive project documentation
├── render.yaml                         # Render deployment blueprint
├── requirements.txt                    # Root Python dependencies
│
├── Backend/                            # FastAPI Backend Service
│   ├── main.py                         # Application entrypoint & middleware configuration
│   ├── render.yaml                     # Backend-specific Render specification
│   ├── requirements.txt                # Backend Python package requirements
│   │
│   ├── ACPI/                           # All Connected Payments Interface
│   │   └── main.py                     # ACPI transaction engine & settlement coordinator
│   │
│   ├── bank/                           # Bank Domain Logic
│   │   └── bank.py                     # Bank registry, account lookup, transfer execution
│   │
│   ├── db/                             # Database Layer
│   │   ├── __init__.py
│   │   └── client.py                   # Supabase client singleton
│   │
│   ├── encryption/                     # Cryptography Suite
│   │   └── encrypt.py                  # RSA-OAEP keygen, encrypt, decrypt, HMAC signing
│   │
│   ├── middleware/                     # Interceptors & Security Services
│   │   ├── __init__.py
│   │   ├── auth.py                     # JWT extraction & role validation dependencies
│   │   ├── brevo_service.py            # Brevo transactional email & OTP dispatcher
│   │   ├── otp_service.py              # OTP generator, JWT creation/decoding, IP limiter
│   │   ├── rate_limit.py               # SlowAPI limiter instance
│   │   └── security.py                 # Input sanitizer & HMAC header signature verifier
│   │
│   ├── models/                         # Data Contracts & Schemas
│   │   ├── __init__.py
│   │   └── schemas.py                  # Pydantic request/response models & validators
│   │
│   ├── qr_service/                     # QR Code Generator & Cache
│   │   ├── __init__.py
│   │   └── QrCodeMaker.py              # Dynamic QR generator with 2-minute TTL store
│   │
│   ├── routers/                        # API Endpoint Controllers
│   │   ├── __init__.py
│   │   ├── acpi_router.py              # ACPI inter-bank transfer routes
│   │   ├── auth_router.py              # Login, signup, check-email, OTP verification routes
│   │   ├── bank_router.py              # Bank info, balance queries, sender/receiver transfer routes
│   │   ├── email_router.py             # Brevo email testing endpoints
│   │   └── qr_router.py                # QR code creation, refresh, and faucet claim routes
│   │
│   └── sql/                            # Database Schema & Migrations
│       ├── schema.sql                  # PostgreSQL table definitions, indices & transfer_money RPC
│       └── seed.sql                    # Initial seed data for test bank accounts
│
└── Frontend/                           # Next.js 15 Web Application
    ├── next.config.ts                  # Next.js configuration
    ├── package.json                    # Frontend dependencies & build scripts
    ├── postcss.config.mjs              # PostCSS plugin settings
    ├── tailwind.config.ts              # Tailwind CSS theme & token config
    ├── tsconfig.json                   # TypeScript compiler options
    ├── vercel.json                     # Vercel deployment routing config
    │
    └── src/
        ├── app/                        # Next.js App Router Pages
        │   ├── layout.tsx              # Root HTML shell, fonts & AuthProvider wrapper
        │   ├── page.tsx                # Landing page & feature showcase
        │   ├── globals.css             # Global Tailwind directives & custom CSS variables
        │   ├── not-found.tsx           # Custom 404 error page
        │   │
        │   ├── dashboard/              # User banking console
        │   │   └── page.tsx            # Balance, recent transactions, quick actions
        │   │
        │   ├── faucet/                 # Testnet liquidity faucet
        │   │   └── page.tsx            # Deposit request interface
        │   │
        │   ├── login/                  # User authentication
        │   │   └── page.tsx            # Credentials input & OTP challenge step
        │   │
        │   ├── signup/                 # Account registration
        │   │   └── page.tsx            # Bank selection, account creation & OTP verification
        │   │
        │   ├── qr/                     # QR Code Management
        │   │   └── page.tsx            # Timed QR display, auto-refresh, scanner & faucet claimer
        │   │
        │   ├── transfer/               # Fund Transfer Interface
        │   │   └── page.tsx            # Cross-bank money transfer form
        │   │
        │   ├── privacy-policy/         # Legal & compliance
        │   │   └── page.tsx            # DPDP Act 2023 compliance charter
        │   │
        │   └── terms-of-use/           # Terms & conditions
        │       └── page.tsx            # Service terms & sandbox disclaimers
        │
        ├── components/                 # Reusable UI Components
        │   ├── auth/                   # Auth-specific UI elements
        │   ├── layout/                 # Navigation bar, footer, containers
        │   │   ├── Navbar.tsx          # Top navigation bar with active session info
        │   │   └── Footer.tsx          # Footer with system status & legal links
        │   └── ui/                     # Primitives (Button, Card, Input, Badge, Dialog)
        │
        ├── features/                   # Core Business Modules
        │   ├── auth/                   # Authentication logic
        │   │   ├── AuthContext.tsx     # React context provider for user auth state
        │   │   ├── AuthGuard.tsx       # Route protection wrapper component
        │   │   └── types.ts            # User, session & auth TypeScript interfaces
        │   │
        │   ├── bank/                   # Bank API Client
        │   │   └── api.ts              # Typed API methods for bank actions
        │   │
        │   └── crypto/                 # Frontend Cryptography Utilities
        │       ├── clientCrypto.ts     # RSA encryption & HMAC signing via node-forge
        │       ├── sanitizer.ts        # Input sanitization helper
        │       └── serverDecrypt.ts    # Server-side decryption utilities
        │
        └── lib/                        # Global Utilities
            ├── apiClient.ts            # Centralized fetch wrapper with JWT injection
            └── utils.ts                # Class name mergers (`cn` utility)
```

---

## 11. Requirements & Prerequisites

### System Requirements
- **Python**: 3.10 or higher
- **Node.js**: 18.17 or higher (Node 20+ LTS recommended)
- **Package Manager**: `npm`, `yarn`, or `pnpm`
- **Database**: Supabase account (or local PostgreSQL 14+ instance)
- **Transactional Email**: Brevo (Sendinblue) account with verified sender email

---

## 12. Environment Configuration

### Backend Environment Variables
Create a file at `Backend/.env`:

```env
# Server Configuration
PORT=8000
ALLOWED_ORIGINS=https://nautilusbanking.vercel.app,http://localhost:3000

# Supabase Database
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_KEY=<your-supabase-service-role-or-anon-key>

# Brevo Transactional Email Service
BREVO_API_KEY=<your-brevo-v3-api-key>
BREVO_SENDER_EMAIL=no-reply@yourdomain.com
BREVO_SENDER_NAME=NAUTILUS Banking Security

# Cryptographic Keys (RSA 2048-bit PEM strings with \n for newlines)
PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
HMAC_SECRET=your-secure-64-character-hex-hmac-secret

# JWT Secret for Session Tokens
JWT_SECRET=your-jwt-secret-signing-key
```

### Frontend Environment Variables
Create a file at `Frontend/.env.local`:

```env
# Backend API Base URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Cryptographic Public Key for Client-Side Encryption
NEXT_PUBLIC_RSA_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
NEXT_PUBLIC_HMAC_SECRET=your-secure-64-character-hex-hmac-secret
```

---

## 13. Database Setup & Schema

1. Open your **Supabase Dashboard** (or PostgreSQL client).
2. Navigate to the **SQL Editor**.
3. Execute the contents of `Backend/sql/schema.sql`.

This provisions:
- Three bank account tables (`cpb_database`, `eb_database`, `sb_database`) with initial balance constraints.
- The `otp_codes` table for managing one-time passwords with indexing on `(email, bank_id)`.
- The `ip_blocks` table for automated IP ban management.
- The `transactions` ledger table with UUID primary keys.
- The `transfer_money` PL/pgSQL function implementing row-level locking and atomic double-ledger clearance.

4. (Optional) Run `Backend/sql/seed.sql` to populate default test accounts.

---

## 14. Local Development Guide

### 1. Start the Backend API Server

```bash
# Navigate to backend directory
cd Backend

# Create and activate Python virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI with live reload
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API server will start at `http://localhost:8000`.

### 2. Start the Frontend Next.js App

```bash
# Navigate to frontend directory
cd Frontend

# Install npm packages
npm install

# Start Next.js development server
npm run dev
```

The application console will be accessible at `http://localhost:3000`.

---

## 15. API Reference

### Health & Diagnostic
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Confirms API server operational status. |

### Authentication (`/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/check-email` | Public | Checks if an email is registered in the selected bank. |
| `POST` | `/auth/signup` | Public | Registers a new account, generates an 8-digit ID, and sends 2FA OTP. |
| `POST` | `/auth/login` | Public | Validates credentials and dispatches a 6-digit login OTP to user email. |
| `POST` | `/auth/verify-otp` | Public | Verifies OTP code, commits new account (if signup), and returns JWT. |
| `POST` | `/auth/resend-otp` | Public | Resends a fresh OTP code subject to cooldown limits. |

### Banking Operations (`/bank`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/bank` | Public | Returns list of participating banks (`CPB`, `EB`, `SB`). |
| `POST` | `/bank/req` | Protected | Fetches account details and balance for a bank user. |
| `POST` | `/bank/req/sender` | Protected | Initiates inter-bank payment from sender bank through ACPI. |
| `POST` | `/bank/req/receiver` | Protected | Queries receiver bank account details prior to settlement. |
| `POST` | `/bank/userReq` | Authenticated | Faucet deposit request ($1-$500 per request, max 10/day). |
| `POST` | `/bank/request` | Protected | Direct bank execution endpoint called by ACPI. |

### ACPI Settlement (`/ACPI`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/ACPI` | Protected | Executes atomic double-ledger inter-bank transaction settlement. |

### QR Code Engine (`/qr`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/qr/generate` | Authenticated | Generates a 2-minute timed, RSA-encrypted payment QR code. |
| `POST` | `/qr/update` | Authenticated | Refreshes and returns a new 2-minute validity QR token. |
| `POST` | `/qr/faucet/generate` | Authenticated | Creates a claimable faucet QR token for a specified amount. |
| `POST` | `/qr/faucet/claim` | Authenticated | Redeems a scanned faucet QR token and credits user balance. |

### Email Test Service (`/email`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/email/test` | Public | Sends a generic diagnostic email via Brevo. |
| `POST` | `/email/test-otp` | Public | Sends a formatted test OTP template email via Brevo. |

---

## License & Compliance Note
This project is an educational and architectural simulation of a modern distributed banking settlement network. It is not affiliated with the National Payments Corporation of India (NPCI) or the Unified Payments Interface (UPI). All financial values and balances are virtual and simulated. Designed with compliance considerations aligned with the **Digital Personal Data Protection (DPDP) Act 2023**.
