'use strict';

// Script to get the size of different landuses in  given admin areas

const fs = require('fs');

const async = require('async');
const mapshaper = require('mapshaper');
const Papa = require('papaparse');
const area = require('@turf/area').default;

const DATASETS = ['gruenanlagenbestand', 'spielplaetze', 'strassenraum'];
const ADMINNAME = 'PLR_'; // PLR, BZR
const ADMIN = JSON.parse(fs.readFileSync('../../data/in/planungsraueme.json', 'utf-8'));
// Admin Input needs to be
// a GeoJSON FeatureCollection
// with prop id and name
// and saved as .json
// Planungsräumen (PLR)

function getSize(datasetName, inputData, adminArea, adminName, callback) {
	const input = { 'featureLayer.geojson': inputData, 'clipLayer.geojson': adminArea };
	const cmd = 'featureLayer.geojson -dissolve2 -clip clipLayer.geojson -o format=geojson out.json';

	mapshaper.applyCommands(cmd, input, function (err, output) {
		let cleanGeoJSON = JSON.parse(new TextDecoder('utf-8').decode(output['out.json']));
		if (cleanGeoJSON.type === 'GeometryCollection' && cleanGeoJSON.geometries.length === 1) {
			cleanGeoJSON = cleanGeoJSON.geometries[0];
		}
		fs.mkdirSync(`../../data/extra/${ADMINNAME}${datasetName}/`, { recursive: true });
		fs.writeFile(
			`../../data/extra/${ADMINNAME}${datasetName}/${adminName}.geojson`,
			JSON.stringify(cleanGeoJSON),
			function (err) {
				callback(Math.round(area(cleanGeoJSON)));
			}
		);
	});
}

async.eachSeries(DATASETS, function (datasetName, callbackDataset) {
	let outData = [];

	// for each Admin e.g. each LOR
	async.eachSeries(
		ADMIN.features,
		function (adminArea, callbackAdmin) {
			const adminName = adminArea.properties.name;
			const adminId =
				adminArea.properties.id.substring(0, 1) == '0'
					? adminArea.properties.id.slice(1)
					: adminArea.properties.id;

			const dataset = JSON.parse(
				fs.readFileSync(`../../data/extra/raw/${datasetName}.json`, 'utf-8')
			);

			getSize(datasetName, dataset, adminArea, adminName, function (size) {
				console.log('adminName: ', adminName, ' size: ', size);
				outData.push({ id: adminId, name: adminName, size: size });
				callbackAdmin();
			});
		},
		function (err) {
			let csv = Papa.unparse(outData, { newline: '\r\n' });
			fs.writeFile(`../../data/in/${ADMINNAME}${datasetName}.csv`, csv, function (err) {
				console.log('');
				callbackDataset();
			});
		}
	);
});
