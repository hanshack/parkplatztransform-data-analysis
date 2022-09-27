'use strict';

module.exports = { splitData };

const fs = require('fs');
const async = require('async');
const { getRelationStatusLine, getRelationStatusPolygon } = require(path.join(dirName,'scripts/utils/getRelationStatus'));
const intersects = require('@turf/boolean-intersects').default;
const area = require('@turf/area').default;

function csvToObject(csv, colNr) {
	const data = {};
	let splitted = csv.split('\n');
	splitted.shift();
	splitted.forEach((line) => {
		const lineData = line.split(',');
		data[Number(lineData[0])] = Number(lineData[colNr]);
	});
	delete data[''];
	return data;
}

function splitData(mainCallback) {
	// Raw Parkplatz Transform data
	const PTdata = JSON.parse(
		fs.readFileSync(path.join(dirName,'data/temp/parkplatz-transform-prepaired.json'), 'utf-8')
	);
	// Planungsräumen (PLR)
	const PLR = JSON.parse(fs.readFileSync(path.join(dirName,'data/in/planungsraueme.json'), 'utf-8'));
	// The status of the PLR - status=2 means all done
	const adminStatus = fs.readFileSync(path.join(dirName,'data/in/PLR_status.csv'), 'utf-8');
	const adminStatusLookup = csvToObject(adminStatus, 2);

	// create folders
	fs.mkdirSync(path.join(dirName,`data/temp/streets/`), { recursive: true });
	fs.mkdirSync(path.join(dirName,`data/temp/streets/intersections/`), { recursive: true });
	fs.mkdirSync(path.join(dirName,`data/temp/streets/within`), { recursive: true });

	// for each PLR
	async.eachSeries(
		PLR.features,
		function (adminArea, callbackAdmin) {
			const adminName = adminArea.properties.name;
			const adminId =
				adminArea.properties.id.substring(0, 1) == '0'
					? adminArea.properties.id.slice(1)
					: adminArea.properties.id;

			if (adminStatusLookup[adminId] !== 2) {
				callbackAdmin();
				return;
			}

			const featuresIntersecting = {
				type: 'FeatureCollection',
				properties: { name: adminName, id: adminId, size: Math.round(area(adminArea)) },
				features: []
			};
			const featuresWithin = {
				type: 'FeatureCollection',
				properties: { name: adminName, id: adminId, size: Math.round(area(adminArea)) },
				features: []
			};

			// for each feature
			async.eachSeries(
				PTdata.features,
				function (feature, featuresCallback) {

					const featureType = feature.geometry?.type;		
					
					if(!featureType){
						featuresCallback();
						return
					}
					

					// check if feature is intersecting
					if (intersects(adminArea, feature.geometry)) {

						// handle line string
						if (featureType === 'LineString') {
							getRelationStatusLine(feature.geometry, adminArea, function (status) {
								if (status === 'in' || status === 'inout') {
									featuresIntersecting.features.push(feature);
								}
								if (status === 'in') {
									featuresWithin.features.push(feature);
								}
								featuresCallback();
							});
						} else {
							// for Polygons
							getRelationStatusPolygon(feature, adminArea, function (status) {
								if (status === 'in' || status === 'inout') {
									featuresIntersecting.features.push(feature);
								}
								if (status === 'in') {
									featuresWithin.features.push(feature);
								}
								featuresCallback();
							});
						}
					} else {
						// no intersection so ignore						
						featuresCallback();
					}
				},
				function (err) {
					if (featuresIntersecting.features.length !== 0) {
						fs.writeFile(
							path.join(dirName,`data/temp/streets/intersections/${adminName.replace(/\//g, '\u2215')}.json`),
							JSON.stringify(featuresIntersecting, null, 4),
							function (err) {
								// when done writing
								fs.writeFile(
									path.join(dirName,`data/temp/streets/within/${adminName.replace(/\//g, '\u2215')}.json`),
									JSON.stringify(featuresWithin, null, 4),
									function (err) {
										// when done writing
										callbackAdmin();
									}
								);
							}
						);
					} else {
						callbackAdmin();
					}
				}
			);
		},
		function () {
			// all done
			mainCallback();
		}
	);
}
