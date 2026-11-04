import "dotenv/config";

import app from "./app.js";
import { startStorageCleanup } from "./modules/storage/storage-cleanup.js";

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
    startStorageCleanup();
});
