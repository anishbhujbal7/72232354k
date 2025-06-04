const express = require("express");
const axios = require("axios");

const app = express();
const PORT = 9876;

const TOKEN =
  "Bearer  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ5MDIwMTkyLCJpYXQiOjE3NDkwMTk4OTIsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjYxNTExNzNjLWUzZTYtNDkyOS1hOWQ3LTVhYjU3ZDBlOGZmMCIsInN1YiI6ImFuaXNoYmh1amJhbDExQGdtYWlsLmNvbSJ9LCJlbWFpbCI6ImFuaXNoYmh1amJhbDExQGdtYWlsLmNvbSIsIm5hbWUiOiJhbmlzaCBtYW5vaiBiaHVqYmFsIiwicm9sbE5vIjoiNzIyMzIzNTRrIiwiYWNjZXNzQ29kZSI6IktSalVVVSIsImNsaWVudElEIjoiNjE1MTE3M2MtZTNlNi00OTI5LWE5ZDctNWFiNTdkMGU4ZmYwIiwiY2xpZW50U2VjcmV0IjoicENOWGFjSkZHQ0FLZEt0ZCJ9.ylUdn78rbRwn52bDx7eb8HbN7ksssPcKpTMWaGYiVvo";

const BASE_URL = "http://20.244.56.144/evaluation-service/stocks";

const fetchStockPrices = async (ticker, minutes) => {
  const url = `${BASE_URL}`;
  const res = await axios.get(url, {
    headers: { Authorization: TOKEN },
  });
  return res.data;
};

app.get("/stocks/:ticker", async (req, res) => {
  const { ticker } = req.params;
  const { minutes, aggregation } = req.query;

  try {
    const data = await fetchStockPrices(ticker, minutes);
    const prices = data.map((entry) => entry.price);
    const average =
      aggregation === "average"
        ? prices.reduce((a, b) => a + b, 0) / prices.length
        : null;

    res.json({
      averageStockPrice: average,
      priceHistory: data,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stock data" });
  }
});

const calculateCorrelation = (x, y) => {
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b) / n;
  const meanY = y.reduce((a, b) => a + b) / n;

  const cov =
    x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0) / (n - 1);
  const stdX = Math.sqrt(
    x.reduce((sum, xi) => sum + (xi - meanX) ** 2, 0) / (n - 1)
  );
  const stdY = Math.sqrt(
    y.reduce((sum, yi) => sum + (yi - meanY) ** 2, 0) / (n - 1)
  );

  return cov / (stdX * stdY);
};

app.get("/stockcorrelation", async (req, res) => {
  const { minutes, ticker } = req.query;
  const [ticker1, ticker2] = ticker.split(",");

  try {
    const [data1, data2] = await Promise.all([
      fetchStockPrices(ticker1, minutes),
      fetchStockPrices(ticker2, minutes),
    ]);

    const map1 = new Map(data1.map((d) => [d.lastUpdatedAt, d.price]));
    const prices1 = [];
    const prices2 = [];

    for (let entry of data2) {
      const price1 = map1.get(entry.lastUpdatedAt);
      if (price1 !== undefined) {
        prices1.push(price1);
        prices2.push(entry.price);
      }
    }

    const correlation = calculateCorrelation(prices1, prices2);

    res.json({
      correlation,
      stocks: {
        [ticker1]: {
          averagePrice: prices1.reduce((a, b) => a + b, 0) / prices1.length,
          priceHistory: data1,
        },
        [ticker2]: {
          averagePrice: prices2.reduce((a, b) => a + b, 0) / prices2.length,
          priceHistory: data2,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch correlation data" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
