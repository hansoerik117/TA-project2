const express = require('express');
const router = express.Router();

//kontrollerid
const {
	visitsHome,
	regVisit,
	regVisitPost} = require('../controllers/visitsControllers');

//'/' = /visits (külastuste avaleht, näitab viimast külastust)
router.route('/').get(visitsHome);

//'/regvisit' = /visits/regvisit (ainus alamleht)
router.route('/regvisit').get(regVisit).post(regVisitPost);

module.exports = router;
