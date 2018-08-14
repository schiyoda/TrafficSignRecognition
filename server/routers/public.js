const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const os = require('os');

module.exports = (app) => {

  app.use(bodyParser.urlencoded({
    extended: true,
    limit: '10mb',
  }));
  app.use(bodyParser.json({
    limit: '10mb',
  }));
  // Setup static public directory
  app.use(express.static(path.join(__dirname, '..', '..', 'public')));

  // Setup the upload mechanism
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, os.tmpdir()),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  });

  const upload = multer({ storage });
  app.upload = upload;
};