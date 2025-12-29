const vision = require('@google-cloud/vision');
const fs = require('fs');
const path = require('path');

// argv:
// [0] node
// [1] ocr.js
// [2] apiKeyPath
// [3...] image paths
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("Usage: node ocr.js <api_key.json> <image1> <image2> ...");
  process.exit(1);
}

const apiKeyPath = args[0];
const imageFiles = args.slice(1);

const client = new vision.ImageAnnotatorClient({
  keyFilename: apiKeyPath
});

const RESULTS_DIR = 'results';

async function extractNameAndIdFromImage(filePath) {
  const [result] = await client.textDetection(filePath);
  const text = result.fullTextAnnotation ? result.fullTextAnnotation.text : "";

  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  let fullName = "";
  let id = "";

  // Step 1: Find the full name
  for (let i = 0; i < lines.length; i++) {
    // Match "Last, First M" or "Last, First Middle"
    if (/^[A-Z][a-zA-Z'’-]+,\s*[A-Z][a-zA-Z'’-]+(?:\s+[A-Z][a-zA-Z'’-]*)?$/.test(lines[i])) {
      fullName = lines[i];
      
      // Step 2: Search all following lines for ID
      for (let j = i + 1; j < lines.length; j++) {
        // Remove hidden characters, spaces, punctuation
        const sanitizedLine = lines[j].replace(/[^\w\d]/g, '');
        const idMatch = sanitizedLine.match(/N\d{6,9}/i); // Case-insensitive
        if (idMatch) {
          id = idMatch[0];
          break;
        }
      }
      break; // stop after first name match
    }
  }

  // Step 3: Split name into parts
  let lastName = "", firstName = "", middleName = "";
  if (fullName) {
    const [last, rest] = fullName.split(',').map(s => s.trim());
    if (rest) {
      const parts = rest.split(/\s+/);
      firstName = parts[0] || "";
      middleName = parts[1] || "";
    }
    lastName = last || "";
  }

  return { lastName, firstName, middleName, id };
}

(async () => {
  const files = imageFiles; // image paths passed from Python

  if (files.length === 0) {
    console.error("No image files provided.");
    process.exit(1);
  }

  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR);
  }

  const results = [["File", "LastName", "FirstName", "MiddleName", "ID"]];

  for (const filePath of files) {
    const { lastName, firstName, middleName, id } = await extractNameAndIdFromImage(filePath);
    
    const fileName = path.basename(filePath);

    console.log(`\n${fileName}`);
    console.log(`Extracted → ${lastName}, ${firstName} ${middleName}`);
    console.log(`ID → ${id || "(none)"}`);

    results.push([fileName, lastName, firstName, middleName, id]);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = path.join(RESULTS_DIR, `results_${timestamp}.csv`);

  fs.writeFileSync(resultsFile, results.map(r => r.join(",")).join("\n"));
  console.log(`\nResults saved to ${resultsFile}`);
})();