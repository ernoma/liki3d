var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('junction', { title: 'Hämeenpuisto-Satakunnankatu-risteys' });
});

module.exports = router;
