function log(message) {
  // eslint-disable-next-line no-console
  console.log(`[ShopEase][${new Date().toISOString()}] ${message}`);
}

module.exports = { log };

