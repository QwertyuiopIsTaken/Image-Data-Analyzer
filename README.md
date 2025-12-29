# Image-Data-Analyzer

A Python GUI application that uses the **Google Cloud Vision API** to extract text data from images (jpg, jpeg, png) and export it into CSV files.
It supports batch processing and automatically extracts details such as names and IDs from scanned images.

This program requires you to have a Google API key to access Cloud Vision.

## Installation

1. Install [Node.js](https://nodejs.org/)
2. Create an API key on console.cloud.google.com.
	1. Look for "API Library" on the search bar
	2. Search "Cloud Vision API" and press Enable
	3. Next look for "Service accounts" on the search bar
	4. Press "Create Service Account" on the top
	5. Give your service account a name and press Done
	6. Under the Actions column, press the three dots and press "Manage keys"
	7. Press Add key and create new key.
3. Install Node.js dependencies:
```bash
cd backend
npm install
```
4. Run the GUI
```bash
python frontend/gui.py
```

## Instructions

1. Select your API key:
	- Go to **API** in the top menu and press **Select API**
2. Import image files:
	- Go to **Files** in the top menu and press **Import**
3. Export CSV:
	- Press **Export to CSV file** to extract details from all images
	- The CSV will be saved in the `results/` folder
4. Clear the batch:
	- Press **Clear** to reset imported images