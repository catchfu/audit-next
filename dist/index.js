import express from "express";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { buildRouter } from "./routes.js";
const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(buildRouter());
app.listen(config.port, () => {
    logger.info({ port: config.port }, "server_started");
});
