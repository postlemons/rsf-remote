const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const localFetch = require('./functions/localFetch').default;
const onlineFetch = require('./functions/onlineFetch').default;
const compare = require('./functions/compare');

async function processFiles(localFilePath, colName, links, onlineColName, tokenFilePath) {
  let currentTask = 'Fetching local file data';
  let sheetStatus = [];

  try {
    const mainData = await localFetch(localFilePath, colName);

    currentTask = 'Extracting sheet IDs from links';
    // Regular expression to extract sheet ID from Google Sheets URL
    const sheetIdRegex = /\/d\/([a-zA-Z0-9-_]+)/;

    // Extract sheet IDs from the links
    const sheetIds = links.map(link => {
      const match = link.match(sheetIdRegex);
      return match ? match[1] : null;
    }).filter(id => id !== null);

    currentTask = 'Fetching online sheets data';
    const output = await onlineFetch(tokenFilePath, sheetIds);

    output.forEach((response, index) => {
      if (response[0] === 200) {
        sheetStatus.push({ message: `Sheet ${index + 1}: Accepted`, accepted: true });
      } else {
        sheetStatus.push({ message: `Sheet ${index + 1}: Rejected - ${response[1].message}`, accepted: false });
      }
    });

    currentTask = 'Comparing data';
    await compare(mainData, output, onlineColName, localFilePath);

    const resultFileName = `result_${Date.now()}.xlsx`;
    const resultPath = path.join(__dirname, 'downloads', resultFileName);

    // Ensure the downloads directory exists
    fs.mkdirSync(path.dirname(resultPath), { recursive: true });

    // Save the result file
    fs.writeFileSync(resultPath, fs.readFileSync('FilteredFile.xlsx'));

    return { fileUrl: resultFileName, currentTask, sheetStatus };
  } catch (error) {
    throw new Error(`Error during processing: ${error.message}`);
  }
}

module.exports = { processFiles };