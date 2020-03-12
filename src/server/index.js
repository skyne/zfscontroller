
const express = require('express');
// call express
const app = express(); // define our app using express
const bodyParser = require('body-parser');
const os = require('os');

const zfsClient = require('./utils/zfsClient');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port = process.env.PORT || 8050; // set our port

app.use(express.static('dist'));
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
// test http methods
// ----------------------------------------------------
router.route('/test')
  .get((req, res) => {
    res.json({ username: os.userInfo().username });
  })
  .post(bodyParser.json(), (req, res) => {
    res.json(req.body);
  })
  .put(bodyParser.json(), (req, res) => {
    res.json(req.body);
  })
  .delete(bodyParser.json(), (req, res) => {
    res.json(req.body);
  });

router.get('/list-snapshots', async (req, res) => {
  const result = await zfsClient.listSnapshots();
  res.json(result);
});

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log(`App listening on ${port}`);
