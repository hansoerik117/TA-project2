const express = require('express');
const fs = require('fs').promises;
const bodyparser = require('body-parser');
//.env tuleb lugeda enne ruuterite laadimist, sest kontrollerid kasutavad neid väärtusi
require('dotenv').config();
const dateET = require('./src/dateTimeET');

const textRef = 'public/txt/vanasonad.txt';

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyparser.urlencoded({extended: false}));

app.get('/', (req, res)=>{
	res.render('index', {dayNow: dateET.day(), dateNow: dateET.fullDate(0), timeNow: dateET.fullTime(), picName: 'banner.jpg'});
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

app.listen(5109);
