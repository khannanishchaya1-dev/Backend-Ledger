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
- Balance derived from ledger (not stored)

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
- Postman (API testing)

---

## 📦 Data Model Overview

### Account
- Represents a user or system-owned account
- Does NOT store balance
- Balance is derived from ledger entries

### Transaction
- Represents a transfer intent
- Status-driven lifecycle:
  - `PENDING`
  - `COMPLETED`
  - `FAILED`
  - `CANCELED`
- Enforced idempotency using `idempotencyKey`

### Ledger
- Immutable record of money movement
- Each transaction creates:
  - One **DEBIT** entry
  - One **CREDIT** entry

---

## 🔄 Transaction Flow (Transfer)

1. Validate request
2. Validate idempotency key
3. Verify account status
4. Derive sender balance from ledger
5. Create transaction with `PENDING` status
6. Create **DEBIT** ledger entry (sender)
7. Create **CREDIT** ledger entry (receiver)
8. Mark transaction as `COMPLETED`
9. Commit MongoDB transaction
10. Send email notifications

All steps are executed atomically.

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

---

## 📡 API Endpoints

### Authentication
POST /api/auth/register
POST /api/auth/login

### Accounts
POST /api/accounts/create
GET /api/accounts/fetch-balance/:accountId
GET /api/accounts/get-user-accounts

### Transactions

POST /api/transactions/initial-fund
POST /api/transactions/transfer
