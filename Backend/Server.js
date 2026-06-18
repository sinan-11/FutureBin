import express from 'express'
import dotenv from 'dotenv'
import connectDB from './src/config/db.js';

dotenv.config();
connectDB();

const app=express();
app.use(express.json());

app.get('/',(req,res)=>{
    res.send("Future Bin API running");

})

const PORT=process.env.PORT||5001;

app.listen(PORT,()=>{
    console.log(`Server Running on ${PORT}`)
})