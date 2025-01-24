const fs = require('fs');
const path = require('path');
const localFetch = require('./functions/localFetch').default;
const onlineFetch = require('./functions/onlineFetch').default;
const compare = require('./functions/compare');
const { AppError, FileFormatError, ColumnNotFoundError } = require('./utils/error');

async function processFiles(localFilePath, colName, links, onlineColName, tokenFilePath) {
  let currentTask = 'Validating file format';
  let sheetStatus = [];

  try {
    const buffer = fs.readFileSync(localFilePath);
    const excelMagicNumber = buffer.toString('hex').slice(0, 8);

    const isXLSX = excelMagicNumber === '504b0304'; // XLSX magic number
    const isXLS = excelMagicNumber === 'd0cf11e0'; // XLS magic number

    if (!isXLSX && !isXLS) {
      throw new FileFormatError('Invalid file format. Please upload an Excel file (.xlsx or .xls)');
    }
    if (!fs.existsSync(localFilePath)) {
      throw new AppError('File not found, did it upload correctly?', 404);
    }
    currentTask = 'Fetching local file data';
    const mainData = await localFetch(localFilePath, colName);

    if (!mainData || mainData.length === 0) {
      throw new ColumnNotFoundError(`Column "${colName}" not found in local file`);
    }
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

    if (!output || output.length === 0) {
      throw new AppError('No data retrieved from online sheets', 404);
    }

    output.forEach((response, index) => {
      if (response[0] === 200) {
        sheetStatus.push({ message: `Sheet ${index + 1}: Accepted`, accepted: true });
      } else {
        sheetStatus.push({ message: `Sheet ${index + 1}: Rejected - ${response[1].message}`, accepted: false });
      }
    });

    currentTask = 'Comparing data';
    const stats = await compare(mainData, output, onlineColName, localFilePath);

    const resultFileName = `result_${Date.now()}.xlsx`;
    const resultPath = path.join(__dirname, '../downloads', resultFileName);

    // Ensure the downloads directory exists
    fs.mkdirSync(path.dirname(resultPath), { recursive: true });

    // Save the result file
    fs.writeFileSync(resultPath, fs.readFileSync('FilteredFile.xlsx'));
    
    return { fileUrl: resultFileName, sheetStatus, stats: stats};
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Error during ${currentTask}: ${error.message}`, 500);
  }
}

module.exports = { processFiles };