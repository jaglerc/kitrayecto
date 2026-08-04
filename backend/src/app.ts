import express from 'express';
import cors from 'cors';
import authRouter from "./modules/auth/auth.router.js";
import vehiclesRouter from "./modules/vehicles/vehicles.router.js";
const app = express();

app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://kitrayecto.vercel.app'
    ]
}));

app.use(express.json());

app.use("/auth", authRouter);
app.use("/vehicles", vehiclesRouter);
export default app;
