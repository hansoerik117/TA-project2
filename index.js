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

//ÜLESANNE 1: leht eelmisest kodutööst
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

app.get('/regvisit', (req, res)=>{
	res.render('regvisit', {notice: ''});
});

//ÜLESANNE 2: salvestame nime, kuupäeva ja kellaaja komadega eraldatult
app.post('/regvisit', async (req, res)=>{
	try {
		const visitInfo = req.body.nameInput + ',' + dateET.fullDate(0) + ',' + dateET.fullTime() + ';';
		await fs.appendFile(regTextRef, visitInfo);
		res.render('regvisit', {notice: 'Külastus salvestatud!'});
	}
	catch (err){
		console.log(err);
		res.render('regvisit', {notice: 'Salvestamine ebaõnnestus!'});
	}
});

//ÜLESANNE 3: viimane külastus
app.get('/lastvisit', async (req, res)=>{
	try {
		const data = await fs.readFile(regTextRef, 'utf8');
		let visitList = data.split(';');
		if(visitList.length < 2){
			res.render('lastvisit', {lastVisitInfo: 'Ühtegi külastust pole veel registreeritud!'});
		} else {
			let lastVisit = visitList[visitList.length - 2].split(',');
			let lastVisitInfo = 'Viimati registreeriti külastus ' + lastVisit[1] + ', kell ' + lastVisit[2] + ' kui seda tegi ' + lastVisit[0];
			res.render('lastvisit', {lastVisitInfo: lastVisitInfo});
		}
	}
	catch (err){
		console.log(err);
		res.render('lastvisit', {lastVisitInfo: 'Külastuste faili ei õnnestunud lugeda!'});
	}
});

app.listen(5109);
