const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const compression = require('compression');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { processFiles } = require('./processFiles');
const app = express();
const upload = multer({ dest: 'uploads/' });
require('dotenv').config();
const mongoInit = require('./utils/MongooseListener');
const User = require('./schemas/user');
mongoInit();

// const users = [{ username: 'admin', password: bcrypt.hashSync('password', 10) }]; // Example user

let failedAttempts = {};

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/images', express.static(path.join(__dirname, '../public/images')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(compression());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: { maxAge: 3 * 60 * 60 * 1000 }
}));

const logFailedAttempt = (ip) => {
  const logEntry = `Failed login attempt from IP: ${ip} at ${new Date().toISOString()}\n`;
  fs.appendFile('failed_attempts.log', logEntry, (err) => {
    if (err) console.error('Failed to log attempt:', err);
  });
};

app.get('/', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.render('index');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip;

  if (failedAttempts[ip] && failedAttempts[ip].count >= 5) {
    const timeSinceLastAttempt = Date.now() - failedAttempts[ip].lastAttempt;
    if (timeSinceLastAttempt < 30 * 60 * 1000) { // 30 minutes
      return res.status(403).send('Too many failed attempts. Try again later.');
    } else {
      delete failedAttempts[ip];
    }
  }

  try {
    const user = await User.findOne({ username });
    if (user && await user.comparePassword(password)) {
      req.session.user = user;
      return res.redirect('/');
    } else {
      if (!failedAttempts[ip]) {
        failedAttempts[ip] = { count: 0, lastAttempt: Date.now() };
      }
      failedAttempts[ip].count++;
      failedAttempts[ip].lastAttempt = Date.now();
      logFailedAttempt(ip);
      return res.status(401).send('Invalid username or password.');
    }
  } catch (error) {
    //console.error(error);
    return res.status(500).send('Internal server error.');
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.post('/register', async (req, res) => {
  
  const { username, password } = req.body;
  try {
    const user = new User({ username, password });
    await user.save();
    res.status(201).send('User registered successfully.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error.');
  }
});

app.post('/process', upload.fields([{ name: 'localFile' }, { name: 'token' }]), async (req, res) => {
  if (!req.session.user) {
    return res.status(401).send('Unauthorized');
  }

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
  if (!req.session.user) {
    return res.status(401).send('Unauthorized');
  }

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