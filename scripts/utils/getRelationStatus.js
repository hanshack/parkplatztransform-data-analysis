'use strict';

module.exports = {
	getRelationStatusLine,
	getRelationStatusPolygon
};

const mapshaper = require('mapshaper');
const lineLength = require('@turf/length').default;
const area = require('@turf/area').default;

function getRelationStatusLine(feature, adminArea, callback) {
	const totalLineLength = lineLength(feature) * 1000;
	const input = {
		'featureLayer.geojson': feature,
		'clipLayer.geojson': adminArea
	};
	const cmd = 'featureLayer.geojson -clip clipLayer.geojson -o format=geojson out.json';

	mapshaper.applyCommands(cmd, input, function (err, output) {
		const cleanGeoJSON = JSON.parse(new TextDecoder('utf-8').decode(output['out.json']));		
		const lineInside = cleanGeoJSON.features ? cleanGeoJSON.features[0].geometry : cleanGeoJSON.geometries ? cleanGeoJSON.geometries[0] : cleanGeoJSON;
		const singleLineLength = lineLength(lineInside) * 1000;
		const lineDifference = totalLineLength - singleLineLength;
		if (lineDifference <= 15) {
			callback('in');
		} else if (singleLineLength <= 15) {
			callback('out');
		} else {
			callback('inout');
		}
	});
}

function getRelationStatusPolygon(feature, adminArea, callback) {
	
	const polgonSize = area(feature.geometry);
	const input = {
		'featureLayer.geojson': feature.geometry,
		'clipLayer.geojson': adminArea
	};
	const cmd = 'featureLayer.geojson -clip clipLayer.geojson -o format=geojson out.json';

	mapshaper.applyCommands(cmd, input, function (err, output) {
		const cleanGeoJSON = JSON.parse(new TextDecoder('utf-8').decode(output['out.json']));
		let polygonInside = false;
		if (
			cleanGeoJSON &&
			cleanGeoJSON.features &&
			cleanGeoJSON.features[0] &&
			cleanGeoJSON.features[0].geometry
		) {
			polygonInside = cleanGeoJSON.features[0].geometry;
		} else if (
			cleanGeoJSON &&
			cleanGeoJSON.geometries &&
			cleanGeoJSON.geometries[0]
    ) {
			polygonInside = cleanGeoJSON.geometries[0];
    } else {
			callback('out');
			return;
		}
		const polygonInsideSize = area(polygonInside);
		const sizeDifference = polgonSize - polygonInsideSize;
		if (sizeDifference <= 10) {
			callback('in');
		} else if (polygonInsideSize <= 10) {
			callback('out');
		} else {
			callback('inout');
		}
	});
}
