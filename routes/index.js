'use strict';
module.exports = function(express, app, formidable, fs, os, gm, knoxClient, mongoose, io, singleImageModel){

const router = express.Router()

let Socket;
io.on('connection', socket => {
  Socket = socket;
})

  router.get('/', (req, res, next) => {
    res.render('index', {
      host: app.get('host')
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
      /* This is to ensure that regardless of OS we can still have access to tmp directory
          The temp folder acts as a 'holding' area for files before upload is initialize */
      nfile = os.tmpDir() + '/' + fname;
      res.writeHead(200, {'content-type': 'text/plain'});
      res.end();
    })

    newForm.on('end', () => {
      /*once upload done, fs will rename the files*/
      fs.rename(tmpFile, nfile, () => {
        /* Resize the image and pipe upload file to S3 Bucket */
        gm(nfile).resize(300).write(nfile, () => {
          /*upload to S3 bucket*/
          fs.readFile(nfile, (err, buf) => {
            /*Using the knoxClient generated to upload filename*/
            let req = knoxClient.put(fname, {
              'Content-Length': buf.length,
              'Content-Type': 'image/jpeg'
            })
            /*Once S3 response it will trigger req event*/
            req.on('response', res => {
              if(res.statusCode == 200) {
                /*If status 200 appears it means upload is successfully in S3*/
                /*Create a model with initial voting value = 0*/
                let singleImage = new singleImageModel({
                  filename: fname,
                  votes: 0
                }).save();
                /*Using the front-end code of showStatus to display msg with given delay time*/
                Socket.emit('status', {'msg': 'saved!!', 'delay': 3000});
                /* Ensure front-end update accordingly */
                Socket.emit('doUpdate', {});
                /* Using fs to delete file using unlink which is specified in linux user manual*/
                fs.unlink(nfile, () => {
                  console.log('file deleted!!');
                })
              }
            })
            req.end(buf);
          })
        })
      })
    })
  })
router.get('/getimage', (req, res, next) => {
  singleImageModel.find({}, null, {sort: {votes: -1}}).exec((err, result) => {
    res.send(JSON.stringify(result))
  })
})
router.get('/voteup/:id', (req, res, next) => {
  singleImageModel.findByIdAndUpdate(req.params.id, {$inc: {votes: 1}}).exec((err, result) => {
    err? console.log('voting err', err): res.status(200).send({votes: result.votes});
  })
})

app.use('/', router);
}
