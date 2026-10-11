const dateFormattedET = function(opt){
	let timeNow = new Date();
	let monthNamesET = ['jaanuar', 'veebruar', 'märts', 'aprill', 'mai', 'juuni', 'juuli', 'august', 'september', 'oktoober', 'november', 'detsember'];
	if(opt == 1){
		monthNamesET = ['näärikuu', 'küünlakuu', 'paastukuu', 'jürikuu', 'lehekuu', 'jaanikuu', 'heinakuu', 'lõikuskuu', 'mihklikuu', 'viinakuu', 'talvekuu', 'jõulukuu'];
	}
	return timeNow.getDate() + '. ' + monthNamesET[timeNow.getMonth()] + ' ' + timeNow.getFullYear();
}

const addLeadZero = function(numValue){
	if(numValue < 10){
		numValue = '0' + numValue;
	}
	return numValue;
}

const timeFormattedET = function(){
	let timeNow = new Date();
	return timeNow.getHours() + ':' + addLeadZero(timeNow.getMinutes()) + ':' + addLeadZero(timeNow.getSeconds());
}

const weekdayET = function(){
	const weekdayNamesET = ['pühapäev', 'esmaspäev', 'teisipäev', 'kolmapäev', 'neljapäev', 'reede', 'laupäev'];
	return weekdayNamesET[new Date().getDay()];
}

module.exports = {fullDate: dateFormattedET, fullTime: timeFormattedET, day: weekdayET};
