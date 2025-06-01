import express, { Request, Response } from "express";

const app = express();
app.use(express.json());

app.post("/run", (req: Request, res: Response) => {
  console.log("⏱️ DebugAgent received payload:", req.body);
  // TODO: real diagnostics logic
  res.json({ status: "ok", report: { diagnostics: "stub" } });
});

const PORT = process.env.PORT ?? 3002;
app.listen(PORT, () => console.log(`🔍 DebugAgent listening on port ${PORT}`)); 