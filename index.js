async = require('async');
path = require("path");
dirName = __dirname;

const { downloadData } = require('./scripts/aaDownloadData');
const { prepairData } = require('./scripts/aPrepairData');
const { splitData } = require('./scripts/bSplitData');
const { analyseData } = require('./scripts/cAnalyseData');
const { toSingleCSVs } = require('./scripts/dToSingleCSVs');


// run these functions in order
async.waterfall(
	[
		// downloadData,
		prepairData, // 1
		splitData, // 2
		analyseData, // 3
		toSingleCSVs // 4
	],
	function (err, result) {
		console.log('aaaaall done');
	}
);
