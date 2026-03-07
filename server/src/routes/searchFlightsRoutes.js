import { searchFlight } from "../controllers/searchFlightsController.js";
import express from "express";

const searchFlightsRouter = express.Router();
searchFlightsRouter.get("/search", searchFlight);
export default searchFlightsRouter;
