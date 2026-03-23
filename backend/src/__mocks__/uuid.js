// Minimal Jest mock to provide a `v4` generator for tests using Node's crypto
const { randomUUID } = require('crypto');
module.exports = { v4: () => randomUUID() };
