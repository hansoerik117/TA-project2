const mysql = require('mysql2/promise');
const dbConf = require('../src/dbConfig');

//kas tekst kujul AAAA-KK-PP on päriselt olemas kuupäev
const isRealDate = function(dateString){
	const dateObj = new Date(dateString);
	if(isNaN(dateObj.getTime())){
		return false;
	}
	return dateObj.toISOString().slice(0, 10) === dateString;
};

//@desc home page for Estonian Film section
//@route GET /eestifilm
//@access public
const eestifilm = (req, res) => {
	res.render('eestifilm');
};

//@desc list of people involved in Estonian Film industry
//@route GET /eestifilm/inimesed
//@access public
const inimesed = async (req, res) => {
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
};

//@desc form for adding a person
//@route GET /eestifilm/inimesed_add
//@access public
const inimesedadd = (req, res) => {
	res.render('eestifilmiinimesed_add', {notice: 'Ootan sisestust!'});
};

//@desc saving a person
//@route POST /eestifilm/inimesed_add
//@access public
const inimesedAddPost = async (req, res) => {
	const notice = function(text){
		return res.render('eestifilmiinimesed_add', {notice: text});
	};
	const firstName = (req.body.firstNameInput || '').trim();
	const lastName = (req.body.lastNameInput || '').trim();
	const bornInput = req.body.bornInput || '';
	const deceasedInput = req.body.deceasedInput || '';
	const today = new Date();

	if(firstName == ''){
		return notice('Eesnimi on sisestamata!');
	}
	if(lastName == ''){
		return notice('Perekonnanimi on sisestamata!');
	}
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
};

//@desc form for adding a film
//@route GET /eestifilm/filmid_add
//@access public
const filmidadd = (req, res) => {
	res.render('eestifilmifilmid_add', {notice: 'Ootan sisestust!'});
};

//@desc saving a film
//@route POST /eestifilm/filmid_add
//@access public
const filmidAddPost = async (req, res) => {
	const notice = function(text){
		return res.render('eestifilmifilmid_add', {notice: text});
	};
	const title = (req.body.titleInput || '').trim();
	const year = Number(req.body.yearInput);
	const duration = Number(req.body.durationInput);
	const description = (req.body.descriptionInput || '').trim();
	const thisYear = new Date().getFullYear();

	if(title == ''){
		return notice('Filmi pealkiri on sisestamata!');
	}
	if(title.length > 100){
		return notice('Filmi pealkiri on liiga pikk (lubatud kuni 100 märki)!');
	}
	if(!Number.isInteger(year) || year < 1896 || year > thisYear){
		return notice('Valmimisaasta peab olema aastate 1896 ja ' + thisYear + ' vahel!');
	}
	if(!Number.isInteger(duration) || duration < 1 || duration > 1000){
		return notice('Kestus peab olema täisarv minutites (1 kuni 1000)!');
	}
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
};

//@desc form for adding a profession
//@route GET /eestifilm/ametid_add
//@access public
const ametidadd = (req, res) => {
	res.render('eestifilmiametid_add', {notice: 'Ootan sisestust!'});
};

//@desc saving a profession
//@route POST /eestifilm/ametid_add
//@access public
const ametidAddPost = async (req, res) => {
	const notice = function(text){
		return res.render('eestifilmiametid_add', {notice: text});
	};
	const title = (req.body.titleInput || '').trim();
	const description = (req.body.descriptionInput || '').trim();

	if(title == ''){
		return notice('Ameti nimetus on sisestamata!');
	}
	if(title.length > 50){
		return notice('Ameti nimetus on liiga pikk (lubatud kuni 50 märki)!');
	}
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
};

//abifunktsioon: loeb rippmenüüde jaoks inimesed, filmid ja ametid ning näitab seoste lehte
const seosedLeht = async (res, notice) => {
	let conn;
	try {
		conn = await mysql.createConnection(dbConf);
		const [personList] = await conn.execute('SELECT id, first_name, last_name, born FROM person ORDER BY last_name, first_name');
		const [movieList] = await conn.execute('SELECT id, title, release_year FROM movie ORDER BY title');
		const [professionList] = await conn.execute('SELECT id, title FROM profession ORDER BY title');
		res.render('eestifilmiseosed_add', {notice: notice, personList: personList, movieList: movieList, professionList: professionList});
	}
	catch (err) {
		console.log('Viga andmebaasist lugemisel: ' + err);
		res.render('eestifilmiseosed_add', {notice: 'Andmebaasist lugemine ebaõnnestus!', personList: [], movieList: [], professionList: []});
	}
	finally {
		if(conn){
			await conn.end();
		}
	}
};

//@desc form for linking a person, film and profession
//@route GET /eestifilm/seosed_add
//@access public
const seosedadd = async (req, res) => {
	await seosedLeht(res, 'Ootan sisestust!');
};

//@desc saving a link, if the same link does not exist yet
//@route POST /eestifilm/seosed_add
//@access public
const seosedAddPost = async (req, res) => {
	const personId = Number(req.body.personInput);
	const movieId = Number(req.body.movieInput);
	const professionId = Number(req.body.professionInput);
	const characterName = (req.body.characterInput || '').trim();

	//iga valiku kontroll eraldi
	if(!Number.isInteger(personId) || personId < 1){
		return seosedLeht(res, 'Isik on valimata!');
	}
	if(!Number.isInteger(movieId) || movieId < 1){
		return seosedLeht(res, 'Film on valimata!');
	}
	if(!Number.isInteger(professionId) || professionId < 1){
		return seosedLeht(res, 'Amet on valimata!');
	}
	if(characterName.length > 100){
		return seosedLeht(res, 'Tegelase nimi on liiga pikk (lubatud kuni 100 märki)!');
	}

	let notice;
	let conn;
	try {
		conn = await mysql.createConnection(dbConf);
		//kontrollime, kas täpselt sama seos on juba olemas
		const checkReq = 'SELECT id FROM person_in_movie WHERE person_id = ? AND movie_id = ? AND profession_id = ?';
		const [existing] = await conn.execute(checkReq, [personId, movieId, professionId]);
		if(existing.length > 0){
			notice = 'Selline seos on juba olemas, uuesti ei salvestatud!';
		} else {
			const sqlReq = 'INSERT INTO person_in_movie (person_id, movie_id, profession_id, character_name) VALUES (?,?,?,?)';
			await conn.execute(sqlReq, [personId, movieId, professionId, characterName == '' ? null : characterName]);
			notice = 'Seos salvestati! Ootan uut sisestust!';
		}
	}
	catch (err) {
		console.log('Viga andmebaasiga suhtlemisel: ' + err);
		notice = 'Tekkis viga, seost ei salvestatud!';
	}
	finally {
		if(conn){
			await conn.end();
		}
	}
	await seosedLeht(res, notice);
};

module.exports = {
	eestifilm,
	inimesed,
	inimesedadd,
	inimesedAddPost,
	filmidadd,
	filmidAddPost,
	ametidadd,
	ametidAddPost,
	seosedadd,
	seosedAddPost
};
