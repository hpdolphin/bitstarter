#!/usr/bin/env node
/*
 * Automatically grade files for the presence of specified HTML tags/attributes.
 * Uses commander.js and cheerio. Teaches command line application development
 * and basic DOM parsing.
 *
 * References:
 *
 *  + cheerio
 *     - https://github.com/MatthewMueller/cheerio
 *        - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
 *           - http://maxogden.com/scraping-with-node.html
 *
 *            + commander.js
 *               - https://github.com/visionmedia/commander.js
 *                  - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy
 *
 *                   + JSON
 *                      - http://en.wikipedia.org/wiki/JSON
 *                         - https://developer.mozilla.org/en-US/docs/JSON
 *                            - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
 *                            */

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');

var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "http://www.google.com";

var assertFileExists = function(infile){
	var instr = infile.toString();
	if(!fs.existsSync(instr)){
		console.log("%s does not exist. Exiting.", instr);
		process.exit(1);
	}
	return instr;
};

var assertUrlValid = function (url) {
	console.log("check url - %s",url);
}

var cheerioHtmlFile = function(htmlfile, checkUrl) {
	var htmlResult = "";
	if(checkUrl == "")
		htmlResult = cheerio.load(fs.readFileSync(htmlfile));
	else{
		console.log('Fetch html:'+checkUrl+' first');
		rest.get(checkUrl).on('complete',function(result){
			console.log('haha');
			if(result instanceof Error){
				console.log("%s cannot be fetched now, please try agian later.",checkUrl);
				process.exit(1);
			}else{
				console.log(result);
				htmlResult = result;
			}
		});
	}
	return htmlResult;
};

var loadChecks = function(checksfile) {
	return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function (htmlfile, checksfile,checkUrl) {
	$ = cheerioHtmlFile(htmlfile, checkUrl);
	var checks = loadChecks(checksfile).sort();
	var out = {};
	for(var ii in checks){
		var present = $(checks[ii]).length > 0;
		out[checks[ii]] = present;
	}
	return out;
};

var clone = function(fn){
    // Workaround for commander.js issue.
    //     http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var getUrlToBeChecked = function(program){
	var urlIndex = program.rawArgs.indexOf('--url');
	var urlValue = ""; //default empty
	if(urlIndex == -1) urlIndex = program.rawArgs.indexOf('-u');
	if(urlIndex > -1){
		urlValue = program.rawArgs[urlIndex+1];
	}
	return urlValue;
};

if(require.main == module){
	program
		.option('-c, --checks <check_file>','Path to checks.json',clone(assertFileExists),CHECKSFILE_DEFAULT)
		.option('-f, --file <html_file>','Path to index.html',clone(assertFileExists),HTMLFILE_DEFAULT)
		.option('-u, --url <url>','Path to a url',clone(assertUrlValid))
		.parse(process.argv);
	console.log(program);
	console.log('url>'+program.url);
	console.log('file>'+program.file);
	console.log('checks>'+program.checks);
	// get the file either from file input or fetch from remote url
	var checkUrl = getUrlToBeChecked(program);
	var checkJson = checkHtmlFile(program.file,program.checks,checkUrl);
	var outJson = JSON.stringify(checkJson,null,4);
	console.log(outJson);
}else{
	exports.checkHtmlFile = checkHtmlFile;
}

