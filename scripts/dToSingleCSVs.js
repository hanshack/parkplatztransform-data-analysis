'use strict';

module.exports = { toSingleCSVs };
const fs = require('fs');
const Papa = require('papaparse');

const filesWant = {
	// for status map
	Status: ['Schlüssel', 'Name', 'Bezirk'],
	// for barchart
	PP_Durchschnitt: [
		'Schlüssel',
		'Name',
		'Bezirk',
		'PP Durchschnitt',
		'PP Durchschnitt min Konfidenz',
		'PP Durchschnitt max Konfidenz'
	],
	// for map
	PP_Flaeche_Strassenverkehr: [
		'Schlüssel',
		'Name',
		'Bezirk',
		'Anteil der PP Fläche im Straßenraum an Straßenverkehrsfläche in %'
	],
	Vergleich_PP_Gruenflaeche: [
		'Schlüssel',
		'Name',
		'Bezirk',
		'PP Fläche in %',
		'PP Fläche pro Kfz in m²',
		'Grünanlagenflächen in %',
		'Grünanlagenflächen pro Einwohner in m²'
	],
	// chart spielplätze und
	Vergleich_PP_Spielplaetze: [
		'Schlüssel',
		'Name',
		'Bezirk',
		'PP Fläche in %',
		'Spielplatzflächen in %'
	],
	// chart flächennutzung
	Vergleich_PP_Spielplaeze_Gruenflaechen: [
		'Schlüssel',
		'Name',
		'Bezirk',
		'PP Fläche in %',
		'Grünanlagenflächen in %',
		'Spielplatzflächen in %'
	]
};

function toSingleCSVs(mainCallback) {
	let parkingData = Papa.parse(fs.readFileSync('data/out/PLR_analysed.csv', 'utf-8'));
	const headers = parkingData.data[0];
	parkingData.data.splice(0, 1);

	async.forEachOf(
		filesWant,
		function (headersWant, key, callbackEach) {
			const fileName = `PLR_${key}`;
			const headersWantIndex = headersWant.map((h) => {
				return headers.indexOf(h);
			});

			if (parkingData.data[parkingData.data.length - 1].length === 1) {
				parkingData.data.pop();
			}

			const filteredData = parkingData.data.map((row) => {
				return row.filter((d, i) => {
					return headersWantIndex.indexOf(i) !== -1 ? d : false;
				});
			});

			const csvData = {
				fields: headersWant,
				data: filteredData
			};

			let csv = Papa.unparse(csvData, { newline: '\r\n' });
			fs.writeFile(`data/out/${fileName}.csv`, csv, function (err) {
				const updateInfo = {
					annotate: {
						notes: `Letzter Update: ${new Date().toLocaleDateString('de-DE')}`
					}
				};
				fs.writeFile(`data/out/updateInfo.json`, JSON.stringify(updateInfo), function (err) {
					console.log('individual csv files written');
					callbackEach();
				});
			});
		},
		function (err) {
			console.log('all done');
		}
	);
}
