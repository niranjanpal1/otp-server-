const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Video/audio er jonno proper MIME type set korchi
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.webm')) res.set('Content-Type', 'video/webm');
    if (filePath.endsWith('.mp4')) res.set('Content-Type', 'video/mp4');
    if (filePath.endsWith('.mkv')) res.set('Content-Type', 'video/x-matroska');
    if (filePath.endsWith('.mp3')) res.set('Content-Type', 'audio/mpeg');
    if (filePath.endsWith('.wav')) res.set('Content-Type', 'audio/wav');
  }
}));

const DB_FILE = 'data.json';
const UPLOAD_VIDEO = 'uploads/videos';
const UPLOAD_AUDIO = 'uploads/audio';

fs.mkdirSync(UPLOAD_VIDEO, { recursive: true });
fs.mkdirSync(UPLOAD_AUDIO, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '[]');

const readDB = () => JSON.parse(fs.readFileSync(DB_FILE));
const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = file.mimetype.startsWith('video')? UPLOAD_VIDEO : UPLOAD_AUDIO;
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Special character remove kore clean filename banachhi
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, Date.now() + '_' + cleanName);
  }
});
const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => {
  const db = readDB();
  const { filename, originalname, mimetype, size } = req.file;
  const type = mimetype.startsWith('video')? 'video' : 'audio';
  const newItem = {
    id: Date.now(),
    filename,
    originalname,
    type,
    size,
    upload_date: new Date().toISOString()
  };
  db.unshift(newItem);
  writeDB(db);
  res.json({ message: 'Uploaded!', id: newItem.id });
});

app.get('/files', (req, res) => {
  res.json(readDB());
});

app.delete('/delete/:id', (req, res) => {
  let db = readDB();
  const id = parseInt(req.params.id);
  const item = db.find(i => i.id === id);
  if (item) {
    const filepath = `uploads/${item.type}s/${item.filename}`;
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    db = db.filter(i => i.id!== id);
    writeDB(db);
  }
  res.json({ message: 'Deleted' });
});

// Render er jonno PORT fix
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
