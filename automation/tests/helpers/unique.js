function uniqueId() {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${process.pid}-${rand}`;
}

module.exports = { uniqueId };
