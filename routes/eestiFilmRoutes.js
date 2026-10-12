const express = require('express');
const router = express.Router();

//kontrollerid
const {
	eestifilm,
	inimesed,
	inimesedadd,
	inimesedAddPost,
	filmidadd,
	filmidAddPost,
	ametidadd,
	ametidAddPost,
	seosedadd,
	seosedAddPost} = require('../controllers/eestiFilmControllers');

router.route('/').get(eestifilm);

router.route('/inimesed').get(inimesed);

router.route('/inimesed_add').get(inimesedadd).post(inimesedAddPost);

router.route('/filmid_add').get(filmidadd).post(filmidAddPost);

router.route('/ametid_add').get(ametidadd).post(ametidAddPost);

router.route('/seosed_add').get(seosedadd).post(seosedAddPost);

module.exports = router;
