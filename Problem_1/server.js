const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json())

const PORT = 9876;
const WINDOW_SIZE = 10;
let window = []

const API_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ5MDIwMTkyLCJpYXQiOjE3NDkwMTk4OTIsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjYxNTExNzNjLWUzZTYtNDkyOS1hOWQ3LTVhYjU3ZDBlOGZmMCIsInN1YiI6ImFuaXNoYmh1amJhbDExQGdtYWlsLmNvbSJ9LCJlbWFpbCI6ImFuaXNoYmh1amJhbDExQGdtYWlsLmNvbSIsIm5hbWUiOiJhbmlzaCBtYW5vaiBiaHVqYmFsIiwicm9sbE5vIjoiNzIyMzIzNTRrIiwiYWNjZXNzQ29kZSI6IktSalVVVSIsImNsaWVudElEIjoiNjE1MTE3M2MtZTNlNi00OTI5LWE5ZDctNWFiNTdkMGU4ZmYwIiwiY2xpZW50U2VjcmV0IjoicENOWGFjSkZHQ0FLZEt0ZCJ9.ylUdn78rbRwn52bDx7eb8HbN7ksssPcKpTMWaGYiVvo'
const API_ENDPOINTS = {
  p: 'http://20.244.56.144/evaluation-service/primes',
  f: 'http://20.244.56.144/evaluation-service/fibo',
  e: 'http://20.244.56.144/evaluation-service/even',
  r: 'http://20.244.56.144/evaluation-service/rand',
};

function calculateAverage(numbers) {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return parseFloat((sum / numbers.length).toFixed(2));
}

app.get('/numbers/:id', async (req, res) => {
  const id = req.params.id.toLowerCase();

  if (!API_ENDPOINTS[id]) {
    return res.status(400).json({ error: 'Invalid number ID. Use p, f, e, or r.' });
  }

  const url = API_ENDPOINTS[id];
  const windowPrevState = [...window];
  let newNumbers = [];

  try {
    const response = await axios.get(url, {
      timeout: 500,
      headers: {
        Authorization: API_TOKEN,
      },
    });

    const fetched = response.data.numbers || [];

    for (const num of fetched) {
      if (!window.includes(num)) {
        if (window.length >= WINDOW_SIZE) {
          window.shift();
        }
        window.push(num);
      }
    }

    newNumbers = fetched;

  } catch (err) {
    console.error(`Error fetching from ${url}:`, err.message);
  }

  const windowCurrState = [...window];

  res.json({
    windowPrevState,
    windowCurrState,
    numbers: newNumbers,
    avg: calculateAverage(window),
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
