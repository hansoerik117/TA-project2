const express = require('express');
const fs = require('fs').promises;
const bodyparser = require('body-parser');
const mysql = require('mysql2/promise');
//.env tuleb lugeda enne ruuterite laadimist, sest kontrollerid kasutavad neid väärtusi
require('dotenv').config();
const dateET = require('./src/dateTimeET');
const dbConf = require('./src/dbConfig');
const galleryConf = require('./src/galleryConfig');

const textRef = 'public/txt/vanasonad.txt';

//kuupäev kujul 8.11.2026
const formatDate = function(dateValue){
	const d = new Date(dateValue);
	return d.getDate() + '.' + (d.getMonth() + 1) + '.' + d.getFullYear();
};

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public', {redirect: false}));
app.use(bodyparser.urlencoded({extended: true}));

//avaleht koos uusima avaliku fotoga
app.get('/', async (req, res)=>{
	//kui avalikku fotot pole, näidatakse vana pilti
	let photo = null;;
	let conn;
	try {
		conn = await mysql.createConnection(dbConf);
		const sqlReq = 'SELECT filename, alttext, created FROM galleryphotos WHERE id=(SELECT MAX(id) FROM galleryphotos WHERE privacy=? AND deleted IS NULL)';
		const [rows] = await conn.execute(sqlReq, [3]);
		if(rows.length > 0){
			let altText = rows[0].alttext;
			if(!altText || altText.trim() == ''){
				altText = 'Uusim avalik foto, üles laetud ' + formatDate(rows[0].created);
			}
			photo = {src: galleryConf.resizedWebPath + rows[0].filename, alt: altText};
		}
	}
	catch (err) {
		console.log('Viga uusima foto lugemisel: ' + err);
	}
	finally {
		if(conn){
			await conn.end();
		}
	}
	res.render('index', {dayNow: dateET.day(), dateNow: dateET.fullDate(0), timeNow: dateET.fullTime(), photo: photo});
});

app.get('/tlu', (req, res)=>{
	res.render('tlu');
});

app.get('/vanasona', async (req, res)=>{
	try {
		const data = await fs.readFile(textRef, 'utf8');
		let folkWisdom = data.split(';');
		res.render('vanasona', {wisdom: folkWisdom[Math.round(Math.random() * (folkWisdom.length - 1))]});
	}
	catch (err) {
		console.log(err);
		res.render('vanasona', {wisdom: 'Ei leidnud ühtegi vanasõna!'});
	}
});

//Eesti filmi marsruudid
const eestiFilmRouter = require('./routes/eestiFilmRoutes');
app.use('/eestifilm', eestiFilmRouter);

//külastuste marsruudid
const visitsRouter = require('./routes/visitsRoutes');
app.use('/visits', visitsRouter);

//galeriipiltide üleslaadimine
const galleryPhotoUploadRouter = require('./routes/galleryPhotoUploadRoutes');
app.use('/galleryPhotoUpload', galleryPhotoUploadRouter);

//fotogalerii
const galleryRouter = require('./routes/galleryRoutes');
app.use('/gallery', galleryRouter);

app.listen(5109);
