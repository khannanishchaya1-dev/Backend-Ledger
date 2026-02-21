const express = require('express');

const app= express();
const cookieParser = require('cookie-parser');

app.use(cookieParser());

app.use(express.json());
//Routes Required
const authRouter = require('./routes/auth.routes');
const accRouter = require('./routes/accounts.routes');


//Use routes
app.use("/api/auth",authRouter);
app.use("/api/accounts",accRouter);

















module.exports=app;