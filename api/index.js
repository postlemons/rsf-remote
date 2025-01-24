const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const compression = require('compression');
const { processFiles } = require('./processFiles');
const app = express();
const upload = multer({ dest: 'uploads/' });

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/images', express.static(path.join(__dirname, '../public/images')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(compression());

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/process', upload.fields([{ name: 'localFile' }, { name: 'token' }]), async (req, res) => {
  const { colName, links, onlineColName } = req.body;
  const localFile = req.files.localFile[0];
  const tokenFile = req.files.token[0];
  const linksArray = links.split(',');

  try {
    const result = await processFiles(localFile.path, colName, linksArray, onlineColName, tokenFile.path);

    // deletion of uploaded files after the process completion
   
      fs.unlink(localFile.path, (err) => {
        if (err) console.error(`Failed to delete ${localFile.path}:`, err);
      });
      fs.unlink(tokenFile.path, (err) => {
        if (err) console.error(`Failed to delete ${tokenFile.path}:`, err);
      });

    // Schedule deletion of converted file after 10 minutes
    setTimeout(() => {
      const resultFilePath = path.join(__dirname, '../downloads', result.fileUrl);
      fs.unlink(resultFilePath, (err) => {
        if (err) console.error(`Failed to delete ${resultFilePath}:`, err);
      });
    }, 10 * 60 * 1000);

    res.json({ success: true, fileUrl: `/downloads/${result.fileUrl}`, stats: result.stats, sheetStatus: result.sheetStatus });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, stack: error.stack });
    console.log(error.stack);
    fs.unlink(localFile.path, (err) => {
      if (err) console.error(`Failed to delete ${localFile.path}:`, err);
    });
    fs.unlink(tokenFile.path, (err) => {
      if (err) console.error(`Failed to delete ${tokenFile.path}:`, err);
    });
  }
});

app.get('/downloads/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../downloads', req.params.filename);
  res.download(filePath, (err) => {
    if (err) {
      res.status(404).send('File not found');
    }
  });
});

// Handle 404 errors
app.use((req, res, next) => {
  res.status(404).render('404');
});

// Handle other errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});