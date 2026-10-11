const express = require('express');
const fs = require('fs').promises;
const bodyparser = require('body-parser');
//andmebaasi moodul, promise versioon async/await jaoks
const mysql = require('mysql2/promise');
//loeb .env faili ja paneb väärtused process.env alla
require('dotenv').config();
const dateET = require('./src/dateTimeET');

const textRef = 'public/txt/vanasonad.txt';
const regTextRef = 'public/txt/visits.txt';

//andmebaasi ühenduse seaded, väärtused tulevad .env failist
const dbConf = {
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: process.env.DB_NAME
};

//abifunktsioon: kas tekst kujul AAAA-KK-PP on päriselt olemas kuupäev
//näiteks 2023-02-31 ei ole, sest veebruaris pole 31 päeva
const isRealDate = function(dateString){
	const dateObj = new Date(dateString);
	if(isNaN(dateObj.getTime())){
		return false;
	}
	return dateObj.toISOString().slice(0, 10) === dateString;
}

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyparser.urlencoded({extended: false}));

app.get('/', (req, res)=>{
	res.render('index', {dayNow: dateET.day(), dateNow: dateET.fullDate(0), timeNow: dateET.fullTime()});
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

app.get('/regvisit', (req, res)=>{
	res.render('regvisit', {notice: ''});
});

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

//EESTI FILM
app.get('/eestifilm', (req, res)=>{
	res.render('eestifilm');
});

//filmiinimeste nimekiri
app.get('/eestifilm/inimesed', async (req, res)=>{
	let conn;
	try {
		conn = await mysql.createConnection(dbConf);
		const [sqlRes] = await conn.execute('SELECT * FROM person ORDER BY last_name');
		res.render('eestifilmiinimesed', {personList: sqlRes});
	}
	catch (err){
		console.log('Viga andmebaasist lugemisel: ' + err);
		res.render('eestifilmiinimesed', {personList: []});
	}
	finally {
		if(conn){
			await conn.end();
		}
	}
});

//filmiinimese lisamise vorm
app.get('/eestifilm/inimesed_add', (req, res)=>{
	res.render('eestifilmiinimesed_add', {notice: 'Ootan sisestust!'});
});

//filmiinimese salvestamine, iga sisendi kontroll eraldi
app.post('/eestifilm/inimesed_add', async (req, res)=>{
	const notice = function(text){
		return res.render('eestifilmiinimesed_add', {notice: text});
	};
	const firstName = (req.body.firstNameInput || '').trim();
	const lastName = (req.body.lastNameInput || '').trim();
	const bornInput = req.body.bornInput || '';
	const deceasedInput = req.body.deceasedInput || '';
	const today = new Date();

	//eesnimi
	if(firstName == ''){
		return notice('Eesnimi on sisestamata!');
	}
	//perekonnanimi
	if(lastName == ''){
		return notice('Perekonnanimi on sisestamata!');
	}
	//sünnikuupäev
	if(bornInput == ''){
		return notice('Sünnikuupäev on sisestamata!');
	}
	if(!isRealDate(bornInput)){
		return notice('Sünnikuupäev ei ole reaalne kuupäev!');
	}
	const bornDate = new Date(bornInput);
	if(bornDate > today){
		return notice('Sünnikuupäev ei saa olla tulevikus!');
	}
	//surmakuupäev (mittekohustuslik)
	let deceasedDate = null;
	if(deceasedInput != ''){
		if(!isRealDate(deceasedInput)){
			return notice('Surmakuupäev ei ole reaalne kuupäev!');
		}
		const deceasedObj = new Date(deceasedInput);
		if(deceasedObj > today){
			return notice('Surmakuupäev ei saa olla tulevikus!');
		}
		if(deceasedObj < bornDate){
			return notice('Surmakuupäev ei saa olla varasem kui sünnikuupäev!');
		}
		deceasedDate = deceasedInput;
	}

	let conn;
	try {
		conn = await mysql.createConnection(dbConf);
		const sqlReq = 'INSERT INTO person (first_name, last_name, born, deceased) VALUES (?,?,?,?)';
		await conn.execute(sqlReq, [firstName, lastName, bornInput, deceasedDate]);
		notice('Andmed salvestati! Ootan uut sisestust!');
	}
	catch (err) {
		console.log('Viga andmebaasiga suhtlemisel: ' + err);
		notice('Tekkis viga, andmeid ei salvestatud!');
	}
	finally {
		if(conn){
			await conn.end();
		}
	}
});

//UUS: filmi lisamise vorm
app.get('/eestifilm/filmid_add', (req, res)=>{
	res.render('eestifilmifilmid_add', {notice: 'Ootan sisestust!'});
});

//UUS: filmi salvestamine
app.post('/eestifilm/filmid_add', async (req, res)=>{
	const notice = function(text){
		return res.render('eestifilmifilmid_add', {notice: text});
	};
	const title = (req.body.titleInput || '').trim();
	const year = Number(req.body.yearInput);
	const duration = Number(req.body.durationInput);
	const description = (req.body.descriptionInput || '').trim();
	const thisYear = new Date().getFullYear();

	//pealkiri
	if(title == ''){
		return notice('Filmi pealkiri on sisestamata!');
	}
	if(title.length > 100){
		return notice('Filmi pealkiri on liiga pikk (lubatud kuni 100 märki)!');
	}
	//aasta: täisarv, esimesest filmist kuni käesoleva aastani
	if(!Number.isInteger(year) || year < 1896 || year > thisYear){
		return notice('Valmimisaasta peab olema aastate 1896 ja ' + thisYear + ' vahel!');
	}
	//kestus: positiivne täisarv
	if(!Number.isInteger(duration) || duration < 1 || duration > 1000){
		return notice('Kestus peab olema täisarv minutites (1 kuni 1000)!');
	}
	//kirjeldus (mittekohustuslik)
	if(description.length > 1000){
		return notice('Kirjeldus on liiga pikk (lubatud kuni 1000 märki)!');
	}

	let conn;
	try {
		conn = await mysql.createConnection(dbConf);
		const sqlReq = 'INSERT INTO movie (title, release_year, duration_minutes, description) VALUES (?,?,?,?)';
		await conn.execute(sqlReq, [title, year, duration, description == '' ? null : description]);
		notice('Film salvestati! Ootan uut sisestust!');
	}
	catch (err) {
		console.log('Viga andmebaasiga suhtlemisel: ' + err);
		notice('Tekkis viga, andmeid ei salvestatud!');
	}
	finally {
		if(conn){
			await conn.end();
		}
	}
});

//UUS: ameti lisamise vorm
app.get('/eestifilm/ametid_add', (req, res)=>{
	res.render('eestifilmiametid_add', {notice: 'Ootan sisestust!'});
});

//UUS: ameti salvestamine
app.post('/eestifilm/ametid_add', async (req, res)=>{
	const notice = function(text){
		return res.render('eestifilmiametid_add', {notice: text});
	};
	const title = (req.body.titleInput || '').trim();
	const description = (req.body.descriptionInput || '').trim();

	//ameti nimetus
	if(title == ''){
		return notice('Ameti nimetus on sisestamata!');
	}
	if(title.length > 50){
		return notice('Ameti nimetus on liiga pikk (lubatud kuni 50 märki)!');
	}
	//kirjeldus (mittekohustuslik)
	if(description.length > 1000){
		return notice('Kirjeldus on liiga pikk (lubatud kuni 1000 märki)!');
	}

	let conn;
	try {
		conn = await mysql.createConnection(dbConf);
		const sqlReq = 'INSERT INTO profession (title, description) VALUES (?,?)';
		await conn.execute(sqlReq, [title, description == '' ? null : description]);
		notice('Amet salvestati! Ootan uut sisestust!');
	}
	catch (err) {
		console.log('Viga andmebaasiga suhtlemisel: ' + err);
		notice('Tekkis viga, andmeid ei salvestatud!');
	}
	finally {
		if(conn){
			await conn.end();
		}
	}
});

app.listen(5109);
