const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const dbConf = require('../src/dbConfig');
const galleryConf = require('../src/galleryConfig');

//abifunktsioon lehe näitamiseks koos teatega
const renderPage = (res, notice) => {
	res.render('galleryPhotoUpload', {notice: notice});
};

//abifunktsioon: kustutab faili, kui see on olemas (vigade korral koristamiseks)
const removeFile = async (filePath) => {
	try {
		await fs.unlink(filePath);
	}
	catch (err) {
		//faili polnud, pole midagi kustutada
	}
};

//vesimärgi pilt etteantud laiusega
//kui .env failis antud vesimärgi faili pole, tehakse vesimärk tekstist
const getWatermark = async (width) => {
	let source;
	try {
		await fs.access(galleryConf.watermarkPath);
		source = galleryConf.watermarkPath;
	}
	catch (err) {
		source = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="500" height="80"><text x="490" y="55" font-family="sans-serif" font-size="40" font-weight="bold" text-anchor="end" fill="white" fill-opacity="0.75" stroke="black" stroke-opacity="0.5" stroke-width="1">VP galerii</text></svg>');
	}
	return await sharp(source).resize({width: width, withoutEnlargement: true}).png().toBuffer({resolveWithObject: true});
};

//@desc page for uploading gallery photos
//@route GET /galleryPhotoUpload
//@access public
const galleryPhotoUpload = (req, res) => {
	renderPage(res, 'Ootan fotot!');
};

//@desc saving an uploaded gallery photo
//@route POST /galleryPhotoUpload
//@access public
const galleryPhotoUploadPost = async (req, res) => {
	//sisendite kontroll
	if(!req.file){
		return renderPage(res, 'Pildifail on valimata!');
	}
	if(!req.file.mimetype.startsWith('image/')){
		await removeFile(req.file.path);
		return renderPage(res, 'Valitud fail ei ole pilt!');
	}
	const privacy = Number(req.body.privacyInput);
	if(![1, 2, 3].includes(privacy)){
		await removeFile(req.file.path);
		return renderPage(res, 'Privaatsus on valimata!');
	}
	const altText = (req.body.altInput || '').trim();
	if(altText.length > 256){
		await removeFile(req.file.path);
		return renderPage(res, 'Alternatiivtekst on liiga pikk (lubatud kuni 256 märki)!');
	}

	//genereerime oma failinime
	const fileName = 'vp_' + Date.now() + '.jpg';
	const origFile = path.join(galleryConf.origPath, fileName);
	let conn;
	try {
		await fs.rename(req.file.path, origFile);

		//normaalsuurus: mahub 800 x 600 sisse, proportsioonid säilivad
		//rotate() pöörab foto õiget pidi (telefonifotode EXIF info järgi)
		const {data, info} = await sharp(origFile)
			.rotate()
			.resize({width: 800, height: 600, fit: 'inside', withoutEnlargement: true})
			.toBuffer({resolveWithObject: true});

		//vesimärk alla paremasse nurka, laius 1/5 foto laiusest, servast 10 px kaugusel
		const margin = 10;
		const watermark = await getWatermark(Math.round(info.width / 5));
		let normalPhoto = sharp(data);
		if(watermark.info.width + margin <= info.width && watermark.info.height + margin <= info.height){
			normalPhoto = normalPhoto.composite([{
				input: watermark.data,
				left: info.width - watermark.info.width - margin,
				top: info.height - watermark.info.height - margin
			}]);
		}
		await normalPhoto.jpeg({quality: 90}).toFile(path.join(galleryConf.resizedPath, fileName));

		//pisipilt 100 x 100
		await sharp(origFile).rotate().resize(100, 100).jpeg({quality: 90}).toFile(path.join(galleryConf.thumbPath, fileName));

		//andmebaasi kirje
		const sqlReq = 'INSERT INTO galleryphotos (filename, origname, alttext, privacy, userid) VALUES (?,?,?,?,?)';
		const userId = 1;//ajutine, kuni teeme päris kasutajakontod
		conn = await mysql.createConnection(dbConf);
		const [result] = await conn.execute(sqlReq, [fileName, req.file.originalname, altText == '' ? null : altText, privacy, userId]);
		console.log('Salvestati kirje id: ' + result.insertId);
		renderPage(res, 'Foto laeti üles! Ootan järgmist fotot!');
	}
	catch (err) {
		console.log('Viga foto üleslaadimisel: ' + err);
		await removeFile(req.file.path);
		await removeFile(origFile);
		await removeFile(path.join(galleryConf.resizedPath, fileName));
		await removeFile(path.join(galleryConf.thumbPath, fileName));
		renderPage(res, 'Tekkis viga, fotot ei salvestatud!');
	}
	finally {
		if(conn){
			await conn.end();
		}
	}
};

module.exports = {
	galleryPhotoUpload,
	galleryPhotoUploadPost
};
