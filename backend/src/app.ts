import express from 'express';
import cors from 'cors';
import authRouter from "./modules/auth/auth.router.js";
import inspectionTemplatesRouter from "./modules/inspection-templates/inspection-templates.router.js";
import inspectionsRouter from "./modules/inspections/inspections.router.js";
import storageRouter from "./modules/storage/storage.router.js";
import vehiclesRouter from "./modules/vehicles/vehicles.router.js";
import tripsRouter from "./modules/trips/trips.router.js";
import fuelRouter from "./modules/fuel/fuel.router.js";
import tripIncidentsRouter from "./modules/trip-incidents/trip-incidents.router.js";
import accidentsRouter from "./modules/accidents/accidents.router.js";
import consultationsRouter from "./modules/consultations/consultations.router.js";
import supervisorDashboardRouter from "./modules/supervisor-dashboard/supervisor-dashboard.router.js";
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
app.use("/trip-incidents", tripIncidentsRouter);
app.use("/accidents", accidentsRouter);
app.use("/consultations", consultationsRouter);
app.use("/supervisor-dashboard", supervisorDashboardRouter);
export default app;
