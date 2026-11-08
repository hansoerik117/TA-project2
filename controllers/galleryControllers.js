const mysql = require('mysql2/promise');
const dbConf = require('../src/dbConfig');
const galleryConf = require('../src/galleryConfig');

//@desc photo gallery: all photos with privacy 2 or 3
//@route GET /gallery
//@access public
const gallery = async (req, res) => {
	let photoList = [];
	let conn;
	try {
		conn = await mysql.createConnection(dbConf);
		const sqlReq = 'SELECT filename, alttext, created FROM galleryphotos WHERE privacy >= ? AND deleted IS NULL ORDER BY id DESC';
		const [rows] = await conn.execute(sqlReq, [2]);
		photoList = rows;
	}
	catch (err) {
		console.log('Viga galerii lugemisel: ' + err);
	}
	finally {
		if(conn){
			await conn.end();
		}
	}
	res.render('gallery', {
		photoList: photoList,
		thumbPath: galleryConf.thumbWebPath,
		normalPath: galleryConf.resizedWebPath
	});
};

module.exports = {gallery};
