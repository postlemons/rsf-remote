const xlsx = require('xlsx');
const { ColumnNotFoundError, AppError } = require('../utils/error');
let uniqueMain = [];
let mainData;

const mainFunction = async (main, secondary, colName, filePath) => {
    try {
        // Verify that 'main' is an array
        if (!Array.isArray(main) || main.length === 0) {
            throw new TypeError("Parameter 'main' must be an array and not empty.");
        }
        if (!Array.isArray(secondary)) {
            throw new TypeError("Parameter 'secondary' must be an array.");
        }
        // Filter out rows with status !== 200
        const filteredSecondary = secondary.filter(
            (row) => row[0] === 200
        );
        // Prepare data for comparison (Main)
        mainData = main[0];
        let MainColumns = mainData.data.map((row) => row[mainData.index]);
        MainColumns.shift();

        // Prepare data for comparison (Secondary)
        let SecondColumns = [];
        for (const sheet of filteredSecondary) {
            for (const row of sheet[1].data) {
                let index = row.data.values[0].map((col) => col.toLowerCase()).indexOf(colName.toLowerCase());
                if (index === -1) continue; // if no match, skip it
                row.data.values.shift();
                SecondColumns.push(...(row.data.values.map((row) => row[index]).filter((row) => row !== undefined)));
            }
        }
        if (!SecondColumns || SecondColumns.length === 0)
            throw new ColumnNotFoundError(`Column "${colName}" not found in online sheets`, 404);
        // Identify unique rows
        uniqueMain = MainColumns.filter(
            (row) => !SecondColumns.includes(row)
        );
        if (uniqueMain.length === 0) {
            throw new AppError('No unique rows found in the main data, please double check the data.', 500);
        }
        const workbook = xlsx.readFile(filePath);
        const localSheetData = [];
        for (const sheetName of workbook.SheetNames) {
            localSheetData.push(...xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
                header: 1,
                raw: false,
                rawNumbers: false,
            }));
        }
        const header = localSheetData[0];
        const numColumns = header.length;
        const newData = localSheetData.filter(row => uniqueMain.includes(row[mainData.index]))
            .map(row => {
                // Ensure each row has the same number of columns as the header
                const newRow = [...row];
                while (newRow.length < numColumns) {
                    newRow.push(undefined);
                }
                return newRow;
            });

        const originalCount = MainColumns.length;
        const filteredCount = newData.length;
        const duplicatesRemoved = originalCount - filteredCount;

        const newSheet = xlsx.utils.aoa_to_sheet([header, ...newData]);

        const newWorkbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(newWorkbook, newSheet, 'FilteredSheet');
        xlsx.writeFile(newWorkbook, 'FilteredFile.xlsx');
        
        return {
            originalCount,
            filteredCount,
            duplicatesRemoved
        };
    } catch (error) {
        throw new Error(`Error during comparison: ${error.message}`);
    }
};

module.exports = mainFunction;