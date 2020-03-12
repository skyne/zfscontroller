
const express = require('express');
// call express
const app = express(); // define our app using express
const bodyParser = require('body-parser');
var busboy = require('connect-busboy');

const zfsClient = require('./utils/zfsClient');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port = process.env.PORT || 8050; // set our port

app.use(express.static('dist'));
app.use(busboy());
app.get('/', (req, res) => {
  console.log('sending index.html');
  res.sendFile('/dist/index.html');
});
// ROUTES FOR OUR API
// =============================================================================
const router = express.Router(); // get an instance of the express Router

// middleware to use for all requests
router.use((req, res, next) => {
  // do logging
  console.log('App is running');
  next(); // make sure we go to the next routes and don't stop here
});

router.get('/list-snapshots', async (req, res) => {
  const result = await zfsClient.listSnapshots();
  res.json(result);
});

router.post('/restore-snapshot', async (req, res) => {
  const result = await zfsClient.restoreSnapshot(req.body.name);
  res.json(result);
});

router.post('/create-snapshot', async (req, res) => {
  const result = await zfsClient.createSnapshot(req.body.dataset, req.body.name);
  res.json(result);
});

router.post('/remove-snapshot', async (req, res) => {
  const result = await zfsClient.removeSnapshot(req.body.name);
  res.json(result);
});

router.post('/download-snapshot', async (req, res) => {
  const result = await zfsClient.getStream(req.body.name, req.body.reference);
  result.pipe(res);
});

router.post('/upload-snapshot', async (req, res) => {

  console.log(req);
  req.busboy.on('file', function (fieldname, file, filename) {
    console.log("Uploading: " + filename);

    zfsClient.getStream(filename, file).then((recieveStream) => {
      recieveStream.on('close', function () {
        console.log("Upload Finished of " + filename);
        res({});           //where to go next
      });
    })
  });
});

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log(`App listening on ${port}`);
