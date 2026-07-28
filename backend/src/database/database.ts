import { Pool } from "pg";
import dotenv from "dotenv"

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error("No se encuentra la variable de entorno para la base de datos");
}


export const pool = new Pool({
    connectionString: databaseUrl,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});

pool.on("connect", () => {
    console.log("Nueva conexión establecida con PostgreSQL");
});

pool.on("error", (error) => {
    console.error("Error inesperado en PostgreSQL:", error);
});