import { Router } from "express";

import { AuthMiddleware } from "../../middleware/authmiddleware.js";
import { StorageController } from "./storage.controller.js";

const router = Router();

router.post(
    "/upload-url",
    AuthMiddleware,
    StorageController.createUploadUrl
);

router.post(
    "/confirm-upload",
    AuthMiddleware,
    StorageController.confirmUpload
);

export default router;
