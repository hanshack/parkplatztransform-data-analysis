'use strict';

module.exports = { prepairData };

// script adds follwing properties to each feature:
// feature.properties.lineLength
// feature.properties.carCount
// feature.properties.carsPerLength
// feature.properties.constrains
// feature.properties.isPartOfStrassenraum

const fs = require('fs');
const getLineLength = require('@turf/length').default;
const { getRelationStatusPolygon } = require(path.join(dirName,'scripts/utils/getRelationStatus'));

function countCarByMeter(segment) {
	return segment.length_in_meters && segment.parking_allowed && segment.car_count === null;
}

function hasConstrains(segment) {
	return (
		segment.time_constraint === true ||
		segment.user_restriction === true ||
		segment.duration_constraint === true
	);
}

function polygonHasCarCount(segment) {
	return segment.parking_allowed && segment.car_count;
}

const PARKING_LENGTH_DIAGONAL = 5.2;
const PARKING_LENGTH_PERPENDICULAR = 5.2 / 2;

function prepairData(mainCallback) {
	console.log('1. Prepair data ...');

		// Raw Parkplatz Transform data
	let PTdata = JSON.parse(fs.readFileSync(path.join(dirName,'data/in/parkplatz-transform.json'), 'utf-8'));
	if (PTdata.features && PTdata.features.type === 'FeatureCollection') {
		// this fixes the current bug of the raw data from the app
		PTdata = PTdata.features[0];
	}

	const strassenraum = JSON.parse(fs.readFileSync(path.join(dirName,'data/in/strassenraum.json'), 'utf-8'));

	let counter = 0;
	async.eachSeries(
		PTdata.features,
		function (feature, callbackEach) {
			counter++;
			const subsegments = feature.properties.subsegments;
			let carCountLine = 0;
			let constrainsCount = 0;
			// should be either LineString or Polygon
			const geomType = feature.geometry?.type;
		
			if (geomType === 'LineString') {
				subsegments.forEach((segment) => {
					let carsSegement = 0;
					// there is no car count but we have meters
					if (countCarByMeter(segment)) {
						// perpendicular parking |||||
						if (segment.alignment === 'perpendicular') {
							carsSegement = Math.round(segment.length_in_meters / PARKING_LENGTH_PERPENDICULAR);
						}
						// diagonal parking ---
						else {
							carsSegement = Math.round(segment.length_in_meters / PARKING_LENGTH_DIAGONAL);
						}
					}
					// there is a car count
					else if (segment.car_count && !isNaN(Number(segment.car_count)) && segment.parking_allowed) {
						carsSegement = Number(segment.car_count);
					}

					carCountLine += carsSegement;
					// check if there are any constrains
					if (hasConstrains(segment)) {
						constrainsCount += carsSegement;
					}
				});

				const lineLength = getLineLength(feature.geometry) * 1000;
				feature.properties.lineLength = lineLength;
				feature.properties.carCount = carCountLine;
				feature.properties.carsPerLength = carCountLine / lineLength;
				feature.properties.constrains = constrainsCount;
				feature.properties.isPartOfStrassenraum = true;
				callbackEach();
			} else if (geomType === 'Polygon') {
				let carCountPolygon = 0;
				subsegments.forEach((segment) => {
					let carsSegement = 0;
					if (polygonHasCarCount(segment)) {
						carsSegement = segment.car_count;
					}
					if (hasConstrains(segment)) {
						constrainsCount += carsSegement;
					}
					carCountPolygon += carsSegement;
				});
				feature.properties.carCount = carCountPolygon;
				feature.properties.constrains = constrainsCount;
				feature.properties.isPartOfStrassenraum = false;
				console.log('getting polygon rel status',counter,"/", PTdata.features.length);
				
				getRelationStatusPolygon(feature, strassenraum, function (status) {
					feature.properties.isPartOfStrassenraum = status === 'in' ? true : false;
					callbackEach();
				});
				
			} else {
				console.log('Unknown geom type or no geom!: ', geomType);
				callbackEach();
			}
		},
		function (err) {
			// finally write a geojson with all streets
			fs.writeFile(
				path.join(dirName,`data/temp/parkplatz-transform-prepaired.json`),
				JSON.stringify(PTdata), // , null, 4
				function (err) {
					console.log('Data prepaired !');
					mainCallback();
				}
			);
		}
	);
}
