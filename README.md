# Ledger-Based Transaction Engine

A **pure backend**, ledger-driven financial transaction system inspired by how real banking systems manage money internally.  
Balances are **never stored directly** — they are derived from immutable **CREDIT / DEBIT ledger entries**, ensuring correctness, auditability, and safety.

This project intentionally focuses on **backend correctness and system design**, without a frontend.

---

## 🔑 Core Concepts

- Ledger-based accounting (double-entry style)
- Atomic money transfers using MongoDB transactions
- Idempotent APIs to safely handle retries
- System-controlled funding account
- Balance derived from ledger (never stored)

---

## 🏗 Architecture Overview
Client (Postman / API Consumer)
↓
Authentication (JWT)
↓
Transaction Service
↓
Ledger Engine
↓
MongoDB (Transactions + Sessions)

The system is **UI-agnostic** and designed as a reusable backend service.

---

## ⚙️ Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- MongoDB Transactions (Sessions)
- JWT Authentication
- Aggregation Pipelines
- Postman (API Testing)

---

## 📦 Data Model Overview

### Account
- Represents a user-owned or system-owned account
- Does **not** store balance
- Balance is always derived from ledger entries

### Transaction
- Represents a transfer intent
- Status-driven lifecycle:
  - `PENDING`
  - `COMPLETED`
  - `FAILED`
  - `CANCELED`
- Enforces idempotency using `idempotencyKey`

### Ledger
- Immutable record of money movement
- Each transaction creates:
  - One **DEBIT** entry
  - One **CREDIT** entry

---

## 🔄 Transaction Flow (Transfer)

1. Validate request body
2. Validate idempotency key
3. Verify account status
4. Derive sender balance from ledger
5. Create transaction with `PENDING` status
6. Create **DEBIT** ledger entry (sender)
7. Create **CREDIT** ledger entry (receiver)
8. Update transaction status to `COMPLETED`
9. Commit MongoDB transaction
10. Send email notifications

All steps are executed **atomically**.

---

## 🔁 Idempotency Design

- Each transaction request includes an `idempotencyKey`
- Repeated requests with the same key return the same result
- Prevents duplicate transfers during retries or network failures

This design is inspired by **Stripe-style idempotent APIs**.

---

## 🔐 System Account Design

Initial funding does not originate from a user account.

Instead, the system uses a **dedicated system account**:

- Acts as the source for initial deposits
- Ensures every ledger entry has a valid debit and credit
- Mirrors real-world banking clearing accounts

This avoids `null` ledger entries and preserves accounting integrity.

---

## 📡 API Endpoints

### 📬 Postman Collection  
Public Postman collection to explore and test all APIs:

🔗 **Postman Collection**  
https://www.postman.com/khannanishchaya1-9321013/workspace/backend-ledger/collection/49447750-e739dd06-e728-470c-9b0c-1988b242d96c?action=share&creator=49447750

---

### Authentication
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout

---

### Accounts
POST /api/accounts/create
GET /api/accounts/fetch-balance/:accountId
GET /api/accounts/get-user-accounts

---

### Transactions
POST /api/transactions/system/initial-funds
POST /api/transactions/transfer

---

## 🧪 API Testing

- All APIs are testable via the provided Postman collection
- Environment variables are used for base URL and authentication tokens
- Saved example responses demonstrate expected behavior

---

## 🚫 Why Balance Is Not Stored

Storing balance directly can lead to:
- Race conditions
- Data corruption
- Inconsistent state under concurrency

This system derives balance from the ledger to guarantee:
- Accuracy
- Auditability
- Strong consistency

---

## 🎯 Project Goals

- Demonstrate real-world backend system design
- Model bank-grade financial transaction flows
- Focus on correctness and safety over UI
- Build retry-safe, idempotent APIs

---

## 🧠 Interview Talking Points

This project enables discussion on:
- How banks calculate balances
- Why ledgers are safer than balance columns
- How idempotency prevents double spending
- How MongoDB transactions ensure atomicity
- Why system accounts are required in financial systems

---

## 📌 Notes

- This is a **backend-only project by design**
- A frontend can be built independently on top of these APIs
- Emphasis is placed on correctness, reliability, and auditability