import { revalidateFlight } from "../controllers/revalidatFlight.js";
import express from "express";

const revalidateRouter = express.Router();
revalidateRouter.post("/revalidate", revalidateFlight);
export default revalidateRouter;
