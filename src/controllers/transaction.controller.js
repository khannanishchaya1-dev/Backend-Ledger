const ledgerModel = require("../models/ledger.model");
const transactionModel = require("../models/transaction.model");
const emailService = require("../services/email.service");
const accountModel = require("../models/account.model");



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

}

