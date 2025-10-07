import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({ message: "Smart Stock API is healthy 🚀" });
});

export default router;
