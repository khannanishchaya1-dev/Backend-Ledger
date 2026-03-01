const ledgerModel = require("../models/ledger.model");
const transactionModel = require("../models/transaction.model");
const emailService = require("../services/email.services");
const accountModel = require("../models/account.model");
const mongoose = require("mongoose");



// Steps to create transaction:
// The 10 Step transfer flow{
//   1.validate request body
//   2.validate indempotency 
//   3.check account status
//   4.Derieve sender balance from ledgerModel
//   5.create transaction with pending status
//   6.create ledger entry for sender with debit type
//   7.create ledger entry for receiver with credit type
//   8.update transaction status to completed
//   9.commit transaction
//   10.send email notification to sender and receiver
// }

async function createTransaction(req,res){

// 1.Validate request body

  const {fromAccount,toAccount,amount,idempotencyKey}= req.body;
  if(!fromAccount || !toAccount || !amount || !idempotencyKey){
    return res.status(400).json({
      message:"From account, to account, amount and idempotency key are required"

  })

}
const fromUserAccount = await accountModel.findById(fromAccount).populate("user");
const toUserAccount = await accountModel.findById(toAccount).populate("user");
if(!toUserAccount || !fromUserAccount){
  return res.status(404).json({
    message:"Any of or both accounts not found"
  })

}

// 2.Validate indempotency
const existingTransaction = await transactionModel.findOne({idempotencyKey});
if(existingTransaction){
if(existingTransaction.status === "COMPLETED"){
  return res.status(200).json({
    message:"Transaction already completed",
    transaction:existingTransaction
})
}else if(existingTransaction.status === "PENDING"){
  return res.status(200).json({
    message:"Transaction is pending",
    transaction:existingTransaction
  })
}else if(existingTransaction.status === "FAILED"){
  return res.status(400).json({
    message:"Transaction failed",
    transaction:existingTransaction
  })
}else if(existingTransaction.status === "CANCELED"){
  return res.status(400).json({
    message:"Transaction canceled",
    transaction:existingTransaction
})

}
}
// 3.Check account status
if(fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE"){
  return res.status(400).json({
    message:"Both accounts should be active for creating transaction"
  })
}

//4.Derieve sender balance from ledgerModel
const balance  = await fromUserAccount.getBalance();
if(balance < amount){
  return res.status(400).json({
    message:`Insufficient balance in sender account. Available balance: ${balance}, Required amount: ${amount}`
  })

}
//5.Create transaction with pending status
try{
const session = await mongoose.startSession();
session.startTransaction();
const [transaction] = await transactionModel.create([{
  fromAccount,
  toAccount,
  amount,
  idempotencyKey,
  status:"PENDING"
}],{session})
const debitLedgerEntry = await ledgerModel.create([{
  account:fromAccount,
  amount,
  transaction:transaction._id,
  type:"DEBIT",
}],{session})

//real time simulation of transaction processing delay
await (() => {
  return new Promise((resolve) => {
    setTimeout(resolve, 10000);
  });
})();

const creditLedgerEntry = await ledgerModel.create([{
account:toAccount,
amount,
transaction:transaction._id,
type:"CREDIT"
}],{session})
const updatedTransaction = await transactionModel.findByIdAndUpdate(transaction._id,{status:"COMPLETED"},{session});
await session.commitTransaction();
await session.endSession();
//10.Send email notification to sender and receiver
emailService.sendTransactionEmail(fromUserAccount.user.email,amount,transaction._id,"DEBIT");
emailService.sendTransactionEmail(toUserAccount.user.email,amount,transaction._id,"CREDIT");
return res.status(201).json({
  message:"Transaction completed successfully",
  transaction:updatedTransaction
})
}catch(error){
  await session.abortTransaction();
  session.endSession();

  return res.status(500).json({
    message: "Transaction failed",
    error: error.message
  });
}


};



async function createInitialFundsTransaction(req,res){
  const {toAccount,amount,idempotencyKey} = req.body;
  console.log(`req.body: ${JSON.stringify(req.body)}`);
  if(!toAccount || !amount || !idempotencyKey){
    return res.status(400).json({
      message:"To account, amount and idempotency key are required"
    })
  }
  const toUserAccount = await accountModel.findById(toAccount).populate("user");
  if(!toUserAccount){
    return res.status(404).json({
      message:"To account not found"
    })
  }
const systemAccount = await accountModel.findOne({user:req.user._id});


  // 2.Validate indempotency
  const existingTransaction = await transactionModel.findOne({idempotencyKey});
  if(existingTransaction){
if(existingTransaction.status === "COMPLETED"){
  return res.status(200).json({
    message:"Transaction already completed",
    transaction:existingTransaction
})
}else if(existingTransaction.status === "PENDING"){
  return res.status(200).json({
    message:"Transaction is pending",
    transaction:existingTransaction
  })
}else if(existingTransaction.status === "FAILED"){
  return res.status(400).json({
    message:"Transaction failed",
    transaction:existingTransaction
  })
}else if(existingTransaction.status === "CANCELED"){
  return res.status(400).json({
    message:"Transaction canceled",
    transaction:existingTransaction
})

}
}
//3.Create transaction with pending status
try{
const session = await mongoose.startSession();
session.startTransaction();
console.log(idempotencyKey)
const [transaction] = await transactionModel.create([{
  fromAccount:systemAccount._id,
  toAccount,
  amount,
  idempotencyKey,
  status:"PENDING"
}],{session})
const creditLedgerEntry = await ledgerModel.create([{
account:toAccount,
amount,
transaction:transaction._id,
type:"CREDIT"
}],{session})

const debitLedgerEntry = await ledgerModel.create([{
  account:systemAccount._id,
  amount,
  transaction:transaction._id,
  type:"DEBIT"
}],{session})
await transactionModel.findByIdAndUpdate(transaction._id,{status:"COMPLETED"},{session});
await transaction.save({session});
await session.commitTransaction();
session.endSession();
//10.Send email notification to receiver
emailService.sendTransactionEmail(toUserAccount.user.email,amount,transaction._id,"CREDIT");
return res.status(201).json({
  message:"Initial funds transaction completed successfully",
  transaction
})
}catch(error){
  await session.abortTransaction();
  session.endSession();

  return res.status(500).json({
    message: "Transaction failed",
    error: error.message
  });
}

};



module.exports = {
  createTransaction,
  createInitialFundsTransaction
}