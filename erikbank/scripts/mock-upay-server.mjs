import http from "http";
import crypto from "crypto";

const port = Number(process.env.PORT || 8090);

function md5Upper(input) {
  return crypto.createHash("md5").update(input).digest("hex").toUpperCase();
}

function sign(data, secret) {
  const keys = Object.keys(data)
    .filter((k) => k !== "signature" && data[k] !== "")
    .sort();
  const query = keys.map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(data[k])}`).join("&");
  const decoded = decodeURIComponent(query.replace(/\+/g, " "));
  return md5Upper(`${decoded}&appsecret=${secret}`);
}

const TRC_ADDRESS = "TYY8rKMvdC91K7XJ9DqPq9K8gGpB9hN8fL";
const ERC_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
const orders = new Map();

const server = http.createServer(async (req, res) => {
  if (req.method !== "POST") {
    res.writeHead(405);
    res.end("method not allowed");
    return;
  }

  const body = await new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => resolve(raw));
  });

  const params = Object.fromEntries(new URLSearchParams(body));
  const path = req.url?.split("?")[0];

  if (path === "/api/pay/exchange_rate") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ code: 1, msg: "ok", data: 7.18 }));
    return;
  }

  if (path === "/api/pay/unifiedorder") {
    const chain = Number(params.chain_type || 1);
    const payUsdt = Number(params.pay_money || "49.99");
    const address = chain === 2 ? ERC_ADDRESS : TRC_ADDRESS;
    const orderSn = params.order_sn;
    orders.set(orderSn, { created: Date.now(), payUsdt, address, chain });

    const data = {
      appid: params.appid,
      order_sn: orderSn,
      pay_usdt: payUsdt,
      address,
      img: `http://localhost:${port}/upload/qrcode/demo.png`,
      chain_type: chain,
      exchange_rate: 1,
      time_out: Math.floor(Date.now() / 1000) + 1800,
    };
    data.signature = sign(data, "ed696eb5bba1f7460585cc6975e6cf9bf24903dd");

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ code: 1, msg: "ok", data }));
    return;
  }

  if (path === "/api/pay/search") {
    const order = orders.get(params.order_sn);
    const age = order ? Date.now() - order.created : 0;
    const status = age > 12000 ? 1 : 0;
    const data = {
      appid: params.appid,
      pay_usdt: order?.payUsdt || 49.99,
      pay_money: "367.82",
      order_sn: params.order_sn,
      attach: "",
      status,
    };
    if (status === 1) data.success_time = Math.floor(Date.now() / 1000);
    data.signature = sign(data, "ed696eb5bba1f7460585cc6975e6cf9bf24903dd");

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ code: 1, msg: "ok", data }));
    return;
  }

  res.writeHead(404);
  res.end("not found");
});

server.listen(port, () => {
  console.log(`Mock UPay listening on http://localhost:${port}`);
});
