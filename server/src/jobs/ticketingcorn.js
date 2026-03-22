import corn from "node-cron";
import pool from "../db/index.js";
import amadeusServices from "../services/amadeusServices.js";
export function startTicketingCron() {
    corn.schedule("*/10 * * * *", async () => {
        try {
            const result = await pool.query(`SELECT * FROM BOOKINGS WHERE status='PAID'`);
            for(const row of result.rows){
                await pool.query('UPDATE BOOKINGS SET STATUS = "CONFIRMED" WHERE id = $1',[row.id]);
            }

        }
        catch(error){
            console.log("Confirming bookings:", error);
        }
       
    });
}