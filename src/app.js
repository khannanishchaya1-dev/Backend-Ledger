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
app.get("/",(req,res)=>{
  res.send("Welcome to the Ledger API");
});

















module.exports=app;