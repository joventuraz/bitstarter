#!/usr/bin/env node
/*
Automatically garde files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

  + cheerio
    - https://github.com/MatthewMueller/cheerio
    - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
    - http://maxogden.com/scraping-with-node.html

  + commander.js
    - https://github.com/visionmedia/commander.js
    - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

  + restler
    - https://github.com/danwrong/restler

  + JSON
    - http://en.wikipedia.org/wiki/JSON
    - https://developer.mozilla.org/en-US/docs/JSON
    - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var restler = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "http://google.com";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
	console.log("%s does not exist. Exiting.", instr);
	process.exit(1); 
    }
    return instr;
};

var assertUrlExists = function(response, callback) {
    if(!response || response.statusCode !== 200) {
	console.log("%s is not currently available or does not exist. Exiting.", inurl);
	process.exit(1);
    }
    return callback(true);
}

var cheerioHtmlFile = function(htmlfile, isUrl) {
    if(isUrl) {
	return cheerio.load(htmlfile);
    }
    return cheerio.load(fs.readFileSync(htmlfile));
}

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
}

var checkHtmlFile = function(htmlfile, checksfile, isUrl) {
    $ = cheerioHtmlFile(htmlfile, isUrl);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    return out;
};

var checkHtmlUrl = function(url, checksfile, callback) {
    return getHtmlFromUrl(url, function(response, data) {
	var out = checkHtmlFile(data, program.checks, true);
	return callback(out);
    });
};

var getHtmlFromUrl = function(url, callback) {
    return restler.get(url).on('complete', function(data,response) {
	assertUrlExists(response, function(exists) {
	    return callback(response,data);
	});
    });
}

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url>', 'URL')
        .parse(process.argv);
    var checkJson;
    var outJson;

    if(program.url) {
	checkHtmlUrl(program.url, program.checks, function(out) {
	    outJson = JSON.stringify(out, null, 4);
	    console.log(outJson);
	});
    } else {
	checkJson = checkHtmlFile(program.file, program.checks);
	outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
