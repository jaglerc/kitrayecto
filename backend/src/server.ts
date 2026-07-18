import app from "./app.js";

const PORT = Number(process.env.port || 3000);

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});