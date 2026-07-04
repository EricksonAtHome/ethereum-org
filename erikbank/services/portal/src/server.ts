import express from "express";
import path from "path";

const app = express();
const port = Number(process.env.PORT || 8085);
const routerUrl = process.env.PAYMENT_ROUTER_URL || "http://localhost:8082";

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.get("/api/config", (_req, res) => {
  res.json({
    paymentRouterUrl: routerUrl,
    methods: ["erikbank", "ideal", "wero"],
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ service: "portal", language: "typescript", status: "ok" });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(port, () => {
  console.log(`ErikBank portal (TypeScript) listening on http://localhost:${port}`);
});
