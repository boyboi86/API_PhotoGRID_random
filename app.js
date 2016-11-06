const express = require('express');
const path = require('path');
const app = express();
const router = require('./routes');
const config = require('./config');
const knox = require('knox');


app.set('views', path.join(__dirname, 'views'));
/* Set engine to look for extension html, then set 'view engine' to html */
app.engine('html', require('hogan-express'));
app.set('view engine', 'html');

app.use(express.static(path.join(__dirname, 'public')));
/*Set some global variables to make work slightly easier */
app.set('port', process.env.PORT || 3000);
app.set('host', config.host);
let knoxClient = knox.createClient({
  key: config.S3AccessKey,
  secret: config.S3Secret,
  bucket: config.S3Bucket
})

let port = app.get('port');

app.use('/', router);

/* 2 layers of transport, if socket long polling stop, app can fall back to http*/
const server = require('http').createServer(app);
const io = require('socket.io')(server);

server.listen(port, err => {
  err? console.log('err connecting to server', err): console.log(`server connect to ${port}`);
});

module.exports = app;
