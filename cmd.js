#!/usr/bin/env node

var path = require('path');
var cheerio = require('cheerio');
var glob = require('glob');
var watch = require('glob-watcher');
var decompress = require('decompress');
var tmp = require('tmp');
tmp.setGracefulCleanup(); // clean up files even if exception occurs
var fs = require('fs-extra');
var argv = require('minimist')(process.argv.slice(2));

var entries = [];

function usage(err) {
  var p;
  if(err) {
    p = console.error;
    p("Error:", err);
    p("");
  } else {
    p = console.log;
  }

  p("Usage: cmd.js dir_to_watch output_dir");

  p("");
  process.exit((err) ? 1 : 0);
}

function fail(err) {
  console.error(err);
  process.exit(1);
}

if(argv._.length < 2) {
  usage("Missing directory name");
}

function isNotebookFile(filepath) {
  var parts = filepath.split('/');
  var i;
  for(i=0; i < parts.length; i++) {
    if(parts[i].match(/^notebook$/i)) {
      return true;
    }
  }
  return false;
}

function parseHtml(filePath) {
  var data = fs.readFileSync(filePath);
  const $ = cheerio.load(data);

  var els = $('.editor').children();
  var i;
  for(i=0; i < els.length; i++) {
    entries += $(els[i]).html();
  }
}

function writeLog() {
  var html = '<!DOCTYPE html>';
  html += '<html lang="en">';
  html += '<head>';
  html +=   '<title>Real Vegan Cheese - Labnotes</title>';
  html +=   '<link href="../benchling.css" rel="stylesheet"/>';
  html +=   '<link href="../main.css" rel="stylesheet"/>';
  html += '</head>';
  html += '<body>';
  for(i=0; i < entries.length; i++) {
    html += entries[i];
  }
  html += '</body>';
  html += '</html>';

  fs.writeFileSync(path.join(labnotesDir, 'index.html'), html);
}

var watchDir = argv._[0];
var outDir = argv._[1];

var labnotesDir = path.join(outDir, 'labnotes');
fs.ensureDirSync(labnotesDir);
var inventoryDir = path.join(outDir, 'inventory');
fs.ensureDirSync(inventoryDir);

function handleZip(zipfilePath) {

  if(!zipfilePath.match(/\.zip$/i)) return;

  tmp.dir({unsafeCleanup: true}, function(err, tmpPath, tmpCleanup) {
    if(err) fail(err);

    console.log("UNZIPPING:", zipfilePath, tmpPath);
    decompress(zipfilePath, tmpPath).then(function(files) {
      var i, curFile, curFileSrc, curFileDst;
      for(i=0; i < files.length; i++) {
        curFile = files[i];
        if(isNotebookFile(curFile.path)) {
          curFileSrc = path.join(tmpPath, curFile.path)
          curFileDst = path.join(labnotesDir, path.basename(curFile.path));
          fs.copySync(curFileSrc, curFileDst);
          if(curFile.path.match(/\.html?$/i)) {
            parseHtml(curFileDst);
          }
        }
      }
      tmpCleanup();
      writeLog();
    }, function(err) {
//      tmpCleanup();

      console.error(err);
    });
  });
}



function waitForFile(zipfilePath, lastSize) {
  lastSize = lastSize || 0;
  var size = fs.statSync(zipfilePath).size;

  console.log("WAITING", size);
  if(size > lastSize) {
    setTimeout(function() {
      waitForFile(zipfilePath, size);
    }, 3000);
    return;
  }
  handleZip(zipfilePath);
}

var watcher = watch([watchDir]);

// watch specified directory for new zip files
watcher.on('add', function(zipfilePath, stat) {
  waitForFile(zipfilePath);
});

