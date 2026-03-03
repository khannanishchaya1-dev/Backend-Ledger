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

async function createTransaction(req, res) {

  let session;

  try {

    const { fromAccount, toAccount, amount, note, mpin } = req.body;
    const idempotencyKey = req.headers["idempotency-key"];

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
      return res.status(400).json({
        message: "From account, to account, amount and idempotency key are required"
      });
    }
const fromUserAccount = await accountModel .findById(fromAccount) .populate({ path: "user", select: "+systemUser" }); 
 const toUserAccount = await accountModel.findOne({ accountNumber: toAccount }).populate("user");
 if(!toUserAccount || !fromUserAccount){ 
  return res.status(404).json({ message:"Any of or both accounts not found" })
 }

 if(mpin!== fromUserAccount.mpin){
  return res.status(400).json({ message:"Invalid MPIN" })
 }


// 2.Validate indempotency 
const existingTransaction = await transactionModel.findOne({idempotencyKey}); 
if(existingTransaction){ 
  if(existingTransaction.status === "COMPLETED"){
     return res.status(200).json({ message:"Transaction already completed", transaction:existingTransaction }) 
    }else if(existingTransaction.status === "PENDING"){
      return res.status(200).json({ message:"Transaction is pending", transaction:existingTransaction }) 
    }else if(existingTransaction.status === "FAILED"){ 
      return res.status(400).json({ message:"Transaction failed", transaction:existingTransaction }) 
    }else if(existingTransaction.status === "CANCELED"){ 
      return res.status(400).json({ message:"Transaction canceled", transaction:existingTransaction }) 
    } 
  }
 if(fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE"){ 
  return res.status(400).json({ message:"Both accounts should be active for creating transaction" }) 
}
if(!fromUserAccount.user.systemUser){ 
  const balance = await fromUserAccount.getBalance(); 
  if(balance < amount){ 
    return res.status(400).json({ message:`Insufficient balance in sender account. Available balance: ${balance}, Required amount: ${amount}` }) 
  } 
}

console.log("All validations passed, proceeding with transaction creation...");
console.log(`Transaction details: ${JSON.stringify(req.body)}`);

    // START SESSION HERE
    session = await mongoose.startSession();
    session.startTransaction();

    // All your logic below remains same...

    const [transaction] = await transactionModel.create([{
      fromAccount: fromUserAccount._id,
      toAccount: toUserAccount._id,
      amount,
      idempotencyKey,
      description: note,
      status: "PENDING"
    }], { session });
   

    await ledgerModel.create([{
      account: fromUserAccount._id,
      amount,
      transaction: transaction._id,
      type: "DEBIT"
    }], { session });

  

    await ledgerModel.create([{
      account: toUserAccount._id,
      amount,
      transaction: transaction._id,
      type: "CREDIT"
    }], { session });

    const updatedTransaction = await transactionModel.findByIdAndUpdate(
      transaction._id,
      { status: "COMPLETED" },
      { new: true, session }
    );

    await session.commitTransaction();
    session.endSession();
    //10.Send email notification to sender and receiver
    await emailService.sendTransactionEmail(fromUserAccount.user.email, amount, transaction._id, "DEBIT");
    await emailService.sendTransactionEmail(toUserAccount.user.email, amount, transaction._id, "CREDIT");

    return res.status(201).json({
      message: "Transaction completed successfully",
      transaction: updatedTransaction
    });

  } catch (error) {

    if (session) {
      await session.abortTransaction();
      session.endSession();
    }

    return res.status(500).json({
      message: "Transaction failed",
      error: error.message
    });
  }
}
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
async function getAllTransactions(req, res) {
  try {
    const user = req.user;

    const accounts = await accountModel.find({ user: user._id });

    if (accounts.length === 0) {
      return res.status(404).json({
        message: "No account found for user",
      });
    }

    const ledgerEntries = await ledgerModel
      .find({
        account: { $in: accounts.map((acc) => acc._id) },
      })
      .populate({
        path: "transaction",
        populate: [
          {
            path: "fromAccount",
            select: "accountNumber type",
          },
          {
            path: "toAccount",
            select: "accountNumber type",
          },
        ],
      });

    // Sort newest first (banking standard)
    const sortedLedgerEntries = ledgerEntries.sort(
      (a, b) => b.transaction.createdAt - a.transaction.createdAt
    );

    return res.status(200).json({
      message: "Transactions retrieved successfully",
      transactions: sortedLedgerEntries,
    });

  } catch (error) {
    return res.status(500).json({
      message: "Failed to retrieve transactions",
      error: error.message,
    });
  }
}

module.exports = {
  createTransaction,
  createInitialFundsTransaction,
  getAllTransactions,
}