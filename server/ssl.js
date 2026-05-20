const fs = require('fs');
const path = require('path');

const CERT_DIR = path.join(__dirname, 'certs');
const KEY_FILE = path.join(CERT_DIR, 'dev-key.pem');
const CERT_FILE = path.join(CERT_DIR, 'dev-cert.pem');

function useHttps() {
  return process.env.USE_HTTPS === 'true';
}

function getHttpsOptions() {
  if (!useHttps()) {
    throw new Error('getHttpsOptions called but USE_HTTPS is not enabled');
  }

  if (fs.existsSync(KEY_FILE) && fs.existsSync(CERT_FILE)) {
    return {
      key: fs.readFileSync(KEY_FILE),
      cert: fs.readFileSync(CERT_FILE),
    };
  }

  let selfsigned;
  try {
    selfsigned = require('selfsigned');
  } catch {
    throw new Error('Install dev dependency "selfsigned" for local HTTPS (npm install --prefix server)');
  }

  const attrs = [{ name: 'commonName', value: 'localhost' }];
  const pems = selfsigned.generate(attrs, {
    days: 825,
    keySize: 2048,
    algorithm: 'sha256',
    extensions: [
      {
        name: 'subjectAltName',
        altNames: [
          { type: 2, value: 'localhost' },
          { type: 2, value: '127.0.0.1' },
        ],
      },
    ],
  });

  fs.mkdirSync(CERT_DIR, { recursive: true });
  fs.writeFileSync(KEY_FILE, pems.private);
  fs.writeFileSync(CERT_FILE, pems.cert);
  console.log('Generated dev SSL certificates → server/certs/');

  return { key: pems.private, cert: pems.cert };
}

module.exports = { useHttps, getHttpsOptions };
