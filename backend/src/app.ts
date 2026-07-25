import express from 'express';
import authRouter from '../src/modules/auth/auth.router.js';
const app = express();

app.use(express.json());

app.use("/auth", authRouter);
export default app;