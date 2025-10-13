const vision = require('@google-cloud/vision');
const fs = require('fs');
const path = require('path');

const client = new vision.ImageAnnotatorClient({
  keyFilename: 'api_key/(enter api key here).json'
});

const IMAGES_DIR = 'pages';
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
  const files = fs.readdirSync(IMAGES_DIR).filter(f =>
    f.toLowerCase().match(/\.(jpg|jpeg|png)$/)
  );

  const results = [["File", "LastName", "FirstName", "MiddleName", "ID"]];

  for (const file of files) {
    const filePath = path.join(IMAGES_DIR, file);
    const { lastName, firstName, middleName, id } = await extractNameAndIdFromImage(filePath);
    console.log(`\n🖼️ ${file}`);
    console.log(`Extracted → ${lastName}, ${firstName} ${middleName}`);
    console.log(`ID → ${id || "(none)"}`);
    results.push([file, lastName, firstName, middleName, id]);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = path.join(RESULTS_DIR, `results_${timestamp}.csv`);

  fs.writeFileSync(resultsFile, results.map(r => r.join(",")).join("\n"));
  console.log(`\n✅ Results saved to ${resultsFile}`);
})();