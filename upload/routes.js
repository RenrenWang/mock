import Router from "@koa/router";
import { upload, download, preview, getAllFiles } from "./file-controller.js";
export const router = new Router();

router.post("/api/upload", upload());
router.get("/api/download/:key", download());
router.get("/api/preview/:key", preview());
router.get("/api/files", getAllFiles());
