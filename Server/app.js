import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import cookieParser from 'cookie-parser';
import connectDB from './src/config/db.js';
import authRouter from './src/routes/auth.js';
import documentRouter from './src/routes/document.js';

const app=express();
app.use(cookieParser());


app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json())

app.use((req,res,next)=>{
  console.log(req.url,req.method);
  next();
})

app.use('/api/auth',authRouter)
app.use('/api/documents', documentRouter);


connectDB();
const port=process.env.PORT
app.listen(port,()=>{
  console.log(`Server running on http://localhost:${port}`);
})