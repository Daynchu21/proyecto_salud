const fs = require("fs");
const path = require("path");

const base64 = process.env.GOOGLE_SERVICES_JSON;

if (!base64) {
  console.error(
    "❌ La variable de entorno GOOGLE_SERVICES_JSON no está definida."
  );
  process.exit(1);
}

const outputPath = path.join(
  __dirname,
  "..",
  "android",
  "app",
  "google-services.json"
);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, Buffer.from(base64, "base64"));
