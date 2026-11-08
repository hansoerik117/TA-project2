const express = require('express');
const multer = require('multer');
const galleryConf = require('../src/galleryConfig');

const router = express.Router();

//multer vahevara: üleslaetud fail pannakse .env failis määratud originaalide kataloogi
const upload = multer({dest: galleryConf.origPath});

//kontrollerid
const {
	galleryPhotoUpload,
	galleryPhotoUploadPost} = require('../controllers/galleryPhotoUploadControllers');

router.route('/').get(galleryPhotoUpload);

//post osa suunatakse läbi vahevara - upload
router.route('/').post(upload.single('photoInput'), galleryPhotoUploadPost);

module.exports = router;
