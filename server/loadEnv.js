const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

/** Load server/.env then project root .env (root does not override existing vars). */
function loadEnv() {
  const files = [
    path.join(__dirname, '.env'),
    path.join(__dirname, '..', '.env'),
  ];
  for (const file of files) {
    if (fs.existsSync(file)) {
      dotenv.config({ path: file });
    }
  }
}

module.exports = { loadEnv };
