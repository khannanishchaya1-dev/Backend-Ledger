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
const fromUserAccount = await accountModel.findById(fromAccount);

const toUserAccount = await accountModel.findById(toAccount);
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
const session = await mongoose.startSession();
session.startTransaction();
const [transaction] = await transactionModel.create([{
  fromAccount,
  toAccount,
  amount,
  idempotencyKey,
  status:"PENDING"
}],{session})
const debitLedgerEntry = await ledgerModel.create({
  account:fromAccount,
  amount,
  transaction:transaction._id,
  type:"DEBIT",
},{session})
const creditLedgerEntry = await ledgerModel.create({
account:toAccount,
amount,
transaction:transaction._id,
type:"CREDIT"
},{session})
transaction.status = "COMPLETED";
await transaction.save({session});
await session.commitTransaction();
await session.endSession();
//10.Send email notification to sender and receiver
emailService.sendEmail({
  to:fromUserAccount.user.email,
  subject:"Transaction Alert: Amount Debited",
  text:`An amount of ${amount} has been debited from your account. Transaction ID: ${transaction._id}`
})
emailService.sendEmail({
  to:toUserAccount.user.email,
  subject:"Transaction Alert: Amount Credited",
  text:`An amount of ${amount} has been credited to your account. Transaction ID: ${transaction._id}`
})
return res.status(201).json({
  message:"Transaction completed successfully",
  transaction
})
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
transaction.status = "COMPLETED";
await transaction.save({session});
await session.commitTransaction();
session.endSession();
//10.Send email notification to receiver

console.log(`To user email: ${toUserAccount.user.email}`)
console.log(`Amount: ${amount}, Transaction ID: ${transaction._id}`);
emailService.sendEmail({
  to:toUserAccount.user.email,
  subject:"Initial Funds Alert: Amount Credited",
  text:`An amount of ${amount} has been credited to your account. Transaction ID: ${transaction._id}`,
  html:`<p>An amount of <strong>${amount}</strong> has been credited to your account. Transaction ID: <strong>${transaction._id}</strong></p>`
})
return res.status(201).json({
  message:"Initial funds transaction completed successfully",
  transaction
})
};



module.exports = {
  createTransaction,
  createInitialFundsTransaction
}