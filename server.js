const app = require('./src/app');
const dotenv = require('dotenv');
dotenv.config();


const connectMongo = require('./src/config/db');
connectMongo();

app.listen(3000,()=>{
  console.log("Server is running")
})