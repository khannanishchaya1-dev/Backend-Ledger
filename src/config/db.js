const mongoose = require('mongoose');



const connectMongo = ()=>{
mongoose.connect(process.env.MONGO_URL).then(()=>{
  console.log("Mongo Connected");
}).catch((err)=>{
console.log("Error connecting DataBase");
process.exit(1);
})
};

module.exports=connectMongo;