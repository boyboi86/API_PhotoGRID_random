'use strict';
const express = require('express');
const router = express.Router();
const config = require('../config');
const fs = require('fs');
const os = require('os');
const formidable = require('formidable');

  router.get('/', (req, res, next) => {
    res.render('index', {
      host: config.host
    });
  });
/*To match index.html with an ajax post method, formidable is a low level package*/
  router.post('/upload', (req, res, next) => {
/*This function generateFilename randomly generates 14 alphanumeric charset
  and string date as name thereby guarantee unqiue identifier*/
    const generateFilename = filename => {
      let ext_regex = /(?:\.([^.]+))?$/;
      let ext = ext_regex.exec(filename)[1];
      let date = new Date().getTime();
      let charBank = "abcdefghijklmnopqrstuvwxyz";
      let fstring = '';
      for(let i = 0; i < 15; i++){
        fstring += charBank[parseInt(Math.random()*26)];
      }
      return (fstring += date + '.' + ext);
    }


    let tmpFile, nfile, fname;
    let newForm = new formidable.IncomingForm();
    newForm.keepExtensions = true;
    newForm.parse(req, (err, fields, files) => {
      tmpFile = files.upload.path;
      fname = generateFilename(files.upload.name);
      /* This is to ensure that regardless of OS we can still have access to tmp directory*/
      nfile = os.tmpDir() + '/' + fname;
      res.writeHead(200, {'content-type': 'text/plain'});
      res.end();
    })

    newForm.on('end', () => {
      /*once upload done, fs will rename the files*/
      fs.rename(tmpFile, nfile, () => {

      })
    })
  })


module.exports = router;
