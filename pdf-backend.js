const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const cors = require('cors');

const app = express();
const upload = multer();
app.use(cors());

// PDF extraction endpoint
app.post('/extract-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const data = await pdfParse(req.file.buffer);
    res.json({ text: data.text });
  } catch (err) {
    res.status(500).json({ error: 'Failed to extract PDF', details: err.message });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`PDF extraction backend running on port ${PORT}`);
});
