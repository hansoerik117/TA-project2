const fs = require('fs').promises;
const dateET = require('../src/dateTimeET');

const regTextRef = 'public/txt/visits.txt';

//@desc home page for visits, shows last visit
//@route GET /visits
//@access public
const visitsHome = async (req, res) => {
	let lastVisitInfo;
	try {
		const data = await fs.readFile(regTextRef, 'utf8');
		let visitList = data.split(';');
		if(visitList.length < 2){
			lastVisitInfo = 'Ühtegi külastust pole veel registreeritud!';
		} else {
			let lastVisit = visitList[visitList.length - 2].split(',');
			lastVisitInfo = 'Viimati registreeriti külastus ' + lastVisit[1] + ', kell ' + lastVisit[2] + ' kui seda tegi ' + lastVisit[0];
		}
	}
	catch (err){
		console.log(err);
		lastVisitInfo = 'Külastuste faili ei õnnestunud lugeda!';
	}
	res.render('visits', {lastVisitInfo: lastVisitInfo});
};

//@desc form for registering a visit
//@route GET /visits/regvisit
//@access public
const regVisit = (req, res) => {
	res.render('regvisit', {notice: ''});
};

//@desc saving a visit
//@route POST /visits/regvisit
//@access public
const regVisitPost = async (req, res) => {
	const name = (req.body.nameInput || '').trim();
	if(name == ''){
		return res.render('regvisit', {notice: 'Nimi on sisestamata!'});
	}
	try {
		const visitInfo = name + ',' + dateET.fullDate(0) + ',' + dateET.fullTime() + ';';
		await fs.appendFile(regTextRef, visitInfo);
		res.render('regvisit', {notice: 'Külastus salvestatud!'});
	}
	catch (err){
		console.log(err);
		res.render('regvisit', {notice: 'Salvestamine ebaõnnestus!'});
	}
};

module.exports = {
	visitsHome,
	regVisit,
	regVisitPost
};
