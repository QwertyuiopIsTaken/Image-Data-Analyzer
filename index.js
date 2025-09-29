const vision = require('@google-cloud/vision');

const client = new vision.ImageAnnotatorClient({
    keyFilename: 'api_key/spiritual-storm-472203-q8-5702d96bdc21.json'
});

const fs = require('fs');
const path = require('path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Settings
const firstLineStartingWords = ['Name', 'Student'];
const secondLineStartingWords = ['University', 'ID'];
const portionOfPage = 0.15; // Top percent of the page that will be scanned

// Configure CSV output
const csvWriter = createCsvWriter({
  path: 'results.csv',
  header: [
    { id: 'file', title: 'File' },
    { id: 'name', title: 'Name' },
    { id: 'id', title: 'ID' }
  ]
});

// Folder containing your images
const IMAGES_DIR = 'pages';

// Helper: escape user words so they are safe in RegExp
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper: extract text at the top of the page
async function analyzeImage(filePath) {
  const [result] = await client.documentTextDetection(filePath);
  const fullText = result && result.fullTextAnnotation;

  if (!fullText || !fullText.pages || fullText.pages.length === 0) {
    return { name: '', id: '' };
  }

  // Page dimensions
  const pages = fullText.pages;
  const height = pages[0].height || 1; // avoid divide by zero

  // Define "top region"
  const topBoundary = height * portionOfPage;

  let topWords = [];

  // Collect words that fall in that region
  pages[0].blocks.forEach(block => {
    block.paragraphs.forEach(paragraph => {
      paragraph.words.forEach(word => {
        const vertices = (word.boundingBox && word.boundingBox.vertices) || [];
        const yPositions = vertices.map(v => (typeof v.y === 'number' ? v.y : 0));
        const avgY = yPositions.length ? yPositions.reduce((a, b) => a + b, 0) / yPositions.length : 0;

        if (avgY <= topBoundary) {
          const wordText = (word.symbols || []).map(s => s.text).join('');
          topWords.push(wordText);
        }
      });
    });
  });

  // Normalize whitespace
  let topLine = topWords.join(' ').replace(/\s+/g, ' ').trim();

  const firstLinePattern = firstLineStartingWords.map(escapeRegex).join('|');
  const secondLinePattern = secondLineStartingWords.map(escapeRegex).join('\\s*');

  // Regex to find ID
  const idRegex = new RegExp(`(?:${secondLinePattern})[:\\s]*([A-Za-z0-9\\-]+)`, 'i');

  let name = '';
  let id = '';

  // 1) Try to find the ID first
  const idMatch = topLine.match(idRegex);
  if (idMatch && idMatch[1]) {
    id = idMatch[1].trim();
    // remove the full matched substring from the text so it won't be taken as part of the name
    topLine = topLine.replace(idMatch[0], '').trim();
  }

  // 2) Extract the name after "Name:" (or any configured label).
  // Use a more permissive character class for names (commas, apostrophes, dots, hyphens)
  const nameRegex = new RegExp(`${firstLinePattern}[:\\s]+([\\w\\s,.'-]+)`, 'i');
  const nameMatch = topLine.match(nameRegex);
  if (nameMatch && nameMatch[1]) {
    name = nameMatch[1].trim();
  } else {
    // Fallback: if the explicit label didn't match, try a looser fallback.
    // if the line starts with the label text anywhere, take the remainder as name
    const fallbackLabel = new RegExp(`(?:${firstLinePattern})[:\\s]*`, 'i');
    const fallback = fallbackLabel.exec(topLine);
    if (fallback) {
      name = topLine.substring(fallback.index + fallback[0].length).trim();
    } else {
      // Final fallback: take the first 3 tokens (best-effort)
      const toks = topLine.split(' ');
      name = toks.slice(0, Math.min(3, toks.length)).join(' ').trim();
    }
  }

  return {
    name: name || '',
    id: id || ''
  };
}

// Main
(async () => {
  const files = fs.readdirSync(IMAGES_DIR).filter(f =>
    f.toLowerCase().match(/\.(jpg|jpeg|png)$/)
  );

  let records = [];

  for (const file of files) {
    const filePath = path.join(IMAGES_DIR, file);
    console.log(`Analyzing ${file}...`);

    const { name, id } = await analyzeImage(filePath);
    records.push({ file, name, id });
  }

  await csvWriter.writeRecords(records);
  console.log('Done! Results saved to results.csv');
})();
