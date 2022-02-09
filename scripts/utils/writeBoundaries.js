'use strict';

// Script to split a FeatureCollection to indivdual files

const fs = require('fs');
const async = require('async');

const PLR = JSON.parse(fs.readFileSync('../../data/in/planungsraueme.json', 'utf-8'));

async.eachSeries(PLR.features, function (feature, featuresCallback) {
	const adminName = feature.properties.name;
	console.log('adminArea', adminName);
	fs.writeFile(
		`../../data/extra/PLR_grenzen/${adminName}.geojson`,
		JSON.stringify(feature), // , null, 4
		function (err) {
			// when done writing
			featuresCallback();
		}
	);
});
