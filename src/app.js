const express = require('express');

const app= express();
const cookieParser = require('cookie-parser');

app.use(cookieParser());

app.use(express.json());
//Routes Required
const authRouter = require('./routes/auth.routes');
const accRouter = require('./routes/accounts.routes');
const transactionRouter = require('./routes/transaction.routes');


//Use routes
app.use("/api/auth",authRouter);
app.use("/api/accounts",accRouter);
app.use("/api/transactions",transactionRouter);
app.get("/", (req, res) => {
  res.status(200).json({
    name: "Ledger-Based Transaction Engine",
    description: "Backend-only financial transaction system using ledger-based accounting.",
    version: "1.0.0",
    status: "running",
    keyConcepts: [
      "Ledger-based accounting (credit/debit)",
      "Atomic transactions using MongoDB sessions",
      "Idempotent APIs",
      "System-controlled funding account",
      "Balance derived from immutable ledger entries"
    ],
    apiEndpoints: {
      auth: [
        "POST /api/auth/register",
        "POST /api/auth/login",
        "POST /api/auth/logout",
        
      ],
      accounts: [
        "POST /api/accounts/create",
        "GET /api/auth/fetch-balance/:accountId",
        "GET /api/auth/get-user-accounts"
      ],
      transactions: [
        "POST /api/transactions/system/initial-funds",
        "POST /api/transactions/transfer"
      ]
    },
    documentation: {
      readme: "See README.md in repository",
      postman: "/postman/ledger-api.postman_collection.json"
    },
    timestamp: new Date().toISOString()
  });
});

















module.exports=app;