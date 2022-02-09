async = require('async');

const { prepairData } = require('./scripts/aPrepairData');
const { splitData } = require('./scripts/bSplitData');
const { analyseData } = require('./scripts/cAnalyseData');
const { toSingleCSVs } = require('./scripts/dToSingleCSVs');

// run these functions in order
async.waterfall(
	[
		prepairData, // 1
		splitData, // 2
		analyseData, // 3
		toSingleCSVs // 4
	],
	function (err, result) {
		console.log('aaaaall done');
	}
);
