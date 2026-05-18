const { createApp } = require('./app');
const PORT = 3002;
const { app } = createApp();

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
