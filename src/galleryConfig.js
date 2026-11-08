const path = require('path');

//kontrollime, et .env failis on kõik vajalikud kataloogid olemas
const requiredVars = ['UPLOAD_ORIGINAL_PATH', 'UPLOAD_RESIZED_PATH', 'UPLOAD_THUMBNAIL_PATH'];
requiredVars.forEach(function(name){
	if(!process.env[name]){
		throw new Error('.env failist puudub ' + name);
	}
});

//teeb kettal olevast kataloogist veebiaadressi, näiteks ./public/gallery/normal/ -> /gallery/normal/
const toWebPath = function(dirPath){
	return '/' + path.relative('public', dirPath).split(path.sep).join('/') + '/';
};

module.exports = {
	origPath: process.env.UPLOAD_ORIGINAL_PATH,
	resizedPath: process.env.UPLOAD_RESIZED_PATH,
	thumbPath: process.env.UPLOAD_THUMBNAIL_PATH,
	watermarkPath: process.env.WATERMARK_PATH,
	resizedWebPath: toWebPath(process.env.UPLOAD_RESIZED_PATH),
	thumbWebPath: toWebPath(process.env.UPLOAD_THUMBNAIL_PATH)
};
