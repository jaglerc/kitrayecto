import express from 'express';
import cors from 'cors';
import authRouter from "./modules/auth/auth.router.js";
import inspectionTemplatesRouter from "./modules/inspection-templates/inspection-templates.router.js";
import inspectionsRouter from "./modules/inspections/inspections.router.js";
import storageRouter from "./modules/storage/storage.router.js";
import vehiclesRouter from "./modules/vehicles/vehicles.router.js";
import tripsRouter from "./modules/trips/trips.router.js";
import fuelRouter from "./modules/fuel/fuel.router.js";
const app = express();

app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://kitrayecto.vercel.app'
    ]
}));

app.use(express.json());

app.use("/auth", authRouter);
app.use("/inspection-templates", inspectionTemplatesRouter);
app.use("/inspections", inspectionsRouter);
app.use("/storage", storageRouter);
app.use("/vehicles", vehiclesRouter);
app.use("/trips", tripsRouter);
app.use("/fuel", fuelRouter);
export default app;
