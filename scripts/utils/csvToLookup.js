module.exports = function csvToLookup(csv) {
	const data = {};
	let splitted = csv.replaceAll('\r', '').split('\n');
	const header = splitted[0].split(',');
	header.shift(); // remove id
	splitted.shift();
	splitted.forEach((line) => {
		const lineData = line.split(',');
		const id = Number(lineData[0]);
		data[id] = {};
		header.forEach((h, i) => {
			data[id][h] =
				Number(lineData[i + 1]) || lineData[i + 1] === '0'
					? Number(lineData[i + 1])
					: lineData[i + 1];
		});
	});
	delete data[''];
	return data;
};
