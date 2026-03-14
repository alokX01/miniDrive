const Firebase = require("firebase-admin");

function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const decoded = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
      "base64"
    ).toString("utf8");
    return JSON.parse(decoded);
  }

  // Local development fallback (ignored in git for safety)
  return require("../drive-e30d5-firebase-adminsdk-fbsvc-d2238073c5.json");
}

const serviceAccount = getServiceAccount();
const databaseURL =
  process.env.FIREBASE_DATABASE_URL ||
  "https://drive-e30d5-default-rtdb.firebaseio.com";

if (!Firebase.apps.length) {
  Firebase.initializeApp({
    credential: Firebase.credential.cert(serviceAccount),
    databaseURL,
  });
}

module.exports = Firebase;
