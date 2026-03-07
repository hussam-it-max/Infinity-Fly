import redis from "../uitles/Redis.js";
export const cancelPendingBooking = async (req, res) => {
  const { pendingOrderId } = req.body;

  if (!pendingOrderId) {
    return res.status(400).json({ message: "pendingOrderId is required" });
  }

  const cachedData = await redis.get(`pending_order:${pendingOrderId}`);

  if (!cachedData) {
    return res.status(404).json({ message: "Session already expired" });
  }

  const { order } = JSON.parse(cachedData);

  // OPTIONAL: log it for monitoring
  console.log(
    "User cancelled pending booking. PNR will auto-expire:",
    order.associatedRecords?.[0]?.reference,
  );

  // 🧹 Remove temporary hold in your system
  await redis.del(`pending_order:${pendingOrderId}`);

  return res.status(200).json({
    message: "Booking cancelled. Seats will be released automatically.",
  });
};
