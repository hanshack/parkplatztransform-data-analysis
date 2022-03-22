'use strict';

module.exports = { downloadData };

const request = require('request');
const fs = require('fs');

function downloadData(mainCallback){

    console.log('downloading data');
    
    request('https://api.xtransform.org/segments/', { json: true }, (err, res, body) => {
      if (err) { return console.log(err); }
      fs.writeFile(
        path.join(dirName,'data/in/parkplatz-transform.json'),
        JSON.stringify(res.body),
        function (err) {
            console.log('Data downloaded !');
            mainCallback();
        })
    });
    
}

