'use strict';

module.exports = { analyseData };

const fs = require('fs');
const glob = require('glob');
const async = require('async');
const Papa = require('papaparse');

const csvToLookup = require('./utils/csvToLookup');

const gruenanlagen = csvToLookup(fs.readFileSync('data/in/PLR_gruenanlagenbestand.csv', 'utf-8'));
const spielplaetze = csvToLookup(fs.readFileSync('data/in/PLR_spielplaetze.csv', 'utf-8'));
const strassenraum = csvToLookup(fs.readFileSync('data/in/PLR_strassenraum.csv', 'utf-8'));
const population = csvToLookup(fs.readFileSync('data/in/PLR_population.csv', 'utf-8'));
const kfz = csvToLookup(fs.readFileSync('data/in/PLR_kfz.csv', 'utf-8'));
const extraInfo = csvToLookup(fs.readFileSync('data/in/PLR_extra.csv', 'utf-8'));

const PARKING_SIZE = 12.5;

function getSumParking(data, opt) {
	const features = data.features;
	let totalParking = 0;
	features
		// is part of Strassenraum?
		.filter((key) => key.properties.isPartOfStrassenraum == opt.isPartOfStrassenraum)
		.forEach((f) => {
			totalParking += f.properties.carCount;
		});
	return totalParking;
}

function getConstrains(data) {
	const features = data.features;
	let totalConstrains = 0;
	features
		.filter((key) => key.properties.constrains)
		.forEach((f) => {
			totalConstrains += f.properties.constrains;
		});
	return totalConstrains;
}

function analyseData(mainCallback) {
	// read all street files from each admin
	glob('data/temp/streets/intersections/*', (err, files) => {
		if (err) return console.warn(err);
		const csvData = [];
		async.eachSeries(
			files,
			function (file, callbackEach) {
				// import data that is intersecting (within and touching the admin boundary)
				const intersection = JSON.parse(fs.readFileSync(file, 'utf-8'));
				// import data that is only withing the admin
				const within = JSON.parse(
					fs.readFileSync(file.replace('intersections', 'within'), 'utf-8')
				);

				// admin data
				const adminId = intersection.properties.id;
				const adminName = intersection.properties.name;
				const adminSize = intersection.properties.size;

				// PP in Strassenraum
				const PPStrassenraumMin = getSumParking(within, { isPartOfStrassenraum: true });
				const PPStrassenraumMax = getSumParking(intersection, { isPartOfStrassenraum: true });
				const PPStrassenraumAvg =
					PPStrassenraumMin + Math.round((PPStrassenraumMax - PPStrassenraumMin) / 2);

				// PP NOT in Strassenraum
				const PPNoneStrassenraumMin = getSumParking(within, { isPartOfStrassenraum: false });
				const PPNoneStrassenraumMax = getSumParking(intersection, { isPartOfStrassenraum: false });
				const PPNoneStrassenraumAvg =
					PPNoneStrassenraumMin + Math.round((PPNoneStrassenraumMax - PPNoneStrassenraumMin) / 2);

				const PPAvg = PPStrassenraumAvg + PPNoneStrassenraumAvg;
				const PPMin = PPStrassenraumMin + PPNoneStrassenraumMin;
				const PPMax = PPStrassenraumMax + PPNoneStrassenraumMax;

				// Constrains
				const PPConstrainsMin = getConstrains(within);
				const PPConstrainsMax = getConstrains(intersection);
				const PPConstrainsAvg =
					PPConstrainsMin + Math.round((PPConstrainsMax - PPConstrainsMin) / 2);

				csvData.push({
					Schlüssel: adminId,
					Name: adminName,
					'Flächengröße in m²': adminSize,
					Bezirk: extraInfo[adminId].bezirk,
					// PARKING Total
					'PP Durchschnitt': PPAvg,
					'PP Durchschnitt min Konfidenz': PPMin,
					'PP Durchschnitt max Konfidenz': PPMax,
					// Parking Data Straßenraum
					'PP Straßenraum Durchschnitt': PPStrassenraumAvg,
					'PP Straßenraum min Konfidenz': PPStrassenraumMin,
					'PP Straßenraum max Konfidenz': PPStrassenraumMax,
					// Parking Data Non Straßenraum
					'PP nicht Straßenraum Durchschnitt': PPNoneStrassenraumAvg,
					'PP nicht Straßenraum min Konfidenz': PPNoneStrassenraumMin,
					'PP nicht Straßenraum max Konfidenz': PPNoneStrassenraumMax,
					// Parkplatz Flaeche
					'PP in m²': PPAvg * PARKING_SIZE,
					'PP Fläche in %': (((PPAvg * PARKING_SIZE) / adminSize) * 100).toFixed(1),
					'PP Fläche pro Einwohner in m²': (
						(PPAvg * PARKING_SIZE) /
						population[adminId].einwohner
					).toFixed(4),
					// Nutzung
					'PP mit Beschränkungen': PPConstrainsAvg,
					// Einwohner
					Einwohner: population[adminId].einwohner,
					'Einwohner Erwachsen': population[adminId]['18_and_older'],
					// Kfz
					Kfz: kfz[adminId]['kfz'],
					Pkw: kfz[adminId]['pkw'],
					'PP pro Kfz': (PPAvg / kfz[adminId]['kfz']).toFixed(1),
					'PP Fläche pro Kfz in m²': ((PPAvg * PARKING_SIZE) / kfz[adminId]['kfz']).toFixed(1),
					// Grünanlagen
					'Grünanlagenflächen in m²': gruenanlagen[adminId].size,
					'Grünanlagenflächen in %': ((gruenanlagen[adminId].size / adminSize) * 100).toFixed(1),
					'Grünanlagenflächen pro Einwohner in m²': (
						gruenanlagen[adminId].size / population[adminId].einwohner
					).toFixed(1),
					// Spielplätze
					'Spielplatzflächen in m²': spielplaetze[adminId].size,
					'Spielplatzflächen in %': ((spielplaetze[adminId].size / adminSize) * 100).toFixed(1),
					// Strassenverkehr
					'Straßenverkehrsfläche in m²': strassenraum[adminId].size,
					'Straßenverkehrsfläche in %': ((strassenraum[adminId].size / adminSize) * 100).toFixed(1),
					'Anteil der PP Fläche im Straßenraum an Straßenverkehrsfläche in %': (
						((PPStrassenraumAvg * PARKING_SIZE) / strassenraum[adminId].size) *
						100
					).toFixed(1)
				});
				callbackEach();
			},
			function (err) {
				let csv = Papa.unparse(csvData, { newline: '\r\n' });
				// write CSV with all data
				fs.writeFile(`data/out/PLR_analysed.csv`, csv, function (err) {
					console.log('data analysed');

					mainCallback();
				});
			}
		);
	});
}
