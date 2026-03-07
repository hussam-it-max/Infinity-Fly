import fetchAirPort from "../controllers/fetchAirport.js";
import express from "express";
const fetchAirportRouter = express.Router();
fetchAirportRouter.get("/fetch-airports", fetchAirPort);
export default fetchAirportRouter;
