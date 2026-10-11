const express = require('express');
const fs = require('fs').promises;
const bodyparser = require('body-parser');
const dateET = require('./src/dateTimeET');

const textRef = 'public/txt/vanasonad.txt';
const regTextRef = 'public/txt/visits.txt';

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyparser.urlencoded({extended: false}));

app.get('/', (req, res)=>{
	res.render('index', {dayNow: dateET.day(), dateNow: dateET.fullDate(0), timeNow: dateET.fullTime()});
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

app.get('/regvisit', (req, res)=>{
	res.render('regvisit', {notice: ''});
});

app.post('/regvisit', async (req, res)=>{
	try {
		await fs.appendFile(regTextRef, req.body.nameInput + ';');
		res.render('regvisit', {notice: 'Külastus salvestatud!'});
	}
	catch (err){
		console.log(err);
		res.render('regvisit', {notice: 'Salvestamine ebaõnnestus!'});
	}
});

app.listen(5109);
