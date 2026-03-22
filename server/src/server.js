import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import { startExpireReservationsCron } from "./jobs/expireReservations.js";
import { startTicketingCron } from "./jobs/ticketingcorn.js";

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startExpireReservationsCron();
  startTicketingCron();
});
