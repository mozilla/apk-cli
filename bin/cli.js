#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
"use strict";

var exec = require('child_process').exec;
var fs = require('fs.extra');
var os = require('os');
var path = require('path');
var url = require('url');

var optimist = require('optimist');
var homeDir = require('path-extra').homedir;
var request = require('request');

var argv = optimist
  .usage('Usage: $0 {OPTIONS} manifestOrPackagedApp testable.apk\n\n' +
    'Hosted App:\t\t$0 {OPTIONS} http://example.com/manifest.webapp ' +
    'testable.apk\n' +
    'Packaged App Zip:\t$0 {OPTIONS} package.zip testable.apk\n' +
    'Packaged App Dir:\t$0 {OPTIONS} ./www testable.apk\n\n' +
    '$0 can accept either a manifest url, a zip file, or a directory ' +
    'which contains the source code for a packaged app.\n\n' +
    'Typical usage will not require any OPTIONS.')
  .wrap(80)
  .option('overrideManifest', {
    desc: "Treat this manifest url as the canoncial url while creating the apk"
  })
  .option('endpoint', {
    desc: "The URL for the APK Factory Service",
    default: "https://controller-review.apk.firefox.com"
  })
  .option('help', {
    alias: "?",
    desc: "Display this message",
    boolean: true
  })
  .check(function(argv) {
    if (argv.help) {
      throw "";
    } else if (argv._.length < 2) {
      throw "";
    }

    if (! argv.overrideManifest) {
      // This will get overriden server side
      argv.overrideManifest = 'http://example.com';
    }

    argv.manifestOrPackage = argv._[0];
    argv.output = argv._[1];
  })
  .argv;

// Queen Anne
// 5:45

var fileLoader = require('../lib/file_loader');
var owaDownloader = require('../lib/owa_downloader');

// Hosted apps
var manifestUrl;
var loaderDirname;

var fileStat;
try {
  fileStat = fs.statSync(argv.manifestOrPackage);
} catch (e) {}

// Hosted Apps
if (/^\w+:\/\//.test(argv.manifestOrPackage)) {
  // manifest is used for owaDownloader
  manifestUrl = argv.manifestOrPackage;
  loaderDirname = manifestUrl;
  var loader = fileLoader.create(loaderDirname);

  // TODO AOK refactor and remove app Build Dir
  var appBuildDir = '';
  owaDownloader(manifestUrl, argv.overrideManifest, loader, appBuildDir, owaCb);

  function owaCb(err, manifest, appType, zip) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    if ( !! argv.overrideManifest) {
      manifestUrl = argv.overrideManifest;
    }
    cliClient(manifestUrl, manifest, zip, argv, cliClientCb);
  }
  // Packaged app zip file
} else if (fileStat && fileStat.isFile()) {
  var zipFileLocation = path.resolve(argv.manifestOrPackage);
  ensureOverrideManifest();
  buildPackagedApp(zipFileLocation);
  // Packaged app, directory of files
} else if (fileStat && fileStat.isDirectory()) {
  var packageDir = argv.manifestOrPackage;
  var manifestFile = path.resolve(packageDir, 'manifest.webapp');
  fs.readFile(manifestFile, {
    encoding: 'utf8'
  }, function(err, data) {
    if (err) {
      console.error('Unable to read manifest file, expected ' +
        manifestFile);
      console.error(err);
      process.exit(1);
    }
    var manifest;
    try {
      // Validate that manifest exists...
      manifest = JSON.parse(data);
    } catch (e) {
      console.error('Unable to parse JSON from the manifest file ' +
        data);
      console.error(err);
      process.exit(1);
    }
    ensureOverrideManifest();
    var zipFile = path.resolve(packageDir, 'package.zip');
    if (fs.existsSync(zipFile)) {
      console.error('package.zip already exists, unable to create ' +
        'packaged app. ' + zipFile);
      process.exit(1);
    }
    var zipCmd = 'zip -r package.zip .';
    exec(zipCmd, {
      cwd: packageDir
    }, function(err, stdout, stderr) {
      if (err) {
        console.error('Unable to unzip ' + zipFile, err);
        if (stdout) console.error('unzip STDOUT: ' + stdout);
        if (stderr) console.error('unzip STDERR: ' + stderr);
        console.error('You must have unzip and zip from Info-ZIP installed.');
        process.exit(1);
      }
      buildPackagedApp(zipFile, function() {
        fs.removeSync(zipFile);
      });
    });
  });

} else {
  console.error('Unable to find hosted or packaged app, sorry');
  process.exit(1);
  //loaderDirname = path.dirname(path.resolve(process.cwd(), manifestUrl));
}

function ensureOverrideManifest() {
    // Make app unique manifest url, if none provided Bug#1001062 Comment#14
    if (-1 === argv.manifestOrPackage.indexOf('://')) {
      if (!argv.overrideManifest) {
        argv.overrideManifest = fakeManifestUrl(manifest.name);
        console.log('setting --overrideManifest to ' + argv.overrideManifest);
      }
    }
}

function buildPackagedApp(zipFileLocation, cb) {
  if (false === fs.existsSync(zipFileLocation)) {
    console.error('Unable to read ' + zipFileLocation);
    process.exit(1);
  }
  var extractDir = path.join(os.tmpdir(), 'apk-cli');
  try {
    fs.removeSync(extractDir);
  } catch (e) {}
  fs.mkdirRecursiveSync(extractDir);
  var unzipCmd = 'unzip "' + zipFileLocation + '"';
  exec(unzipCmd, {
    cwd: extractDir
  }, function(err, stdout, stderr) {
    if (err) {
      console.error('Unable to unzip ' + zipFileLocation, err);
      if (stdout) console.error('unzip STDOUT: ' + stdout);
      if (stderr) console.error('unzip STDERR: ' + stderr);
      console.error('You must have unzip and zip from Info-ZIP installed.');
      try {
        fs.removeSync(extractDir);
      } catch (e) {}
      process.exit(1);
    }
    var manifestFile = path.join(extractDir, 'manifest.webapp');
    fs.readFile(manifestFile, {
      encoding: 'utf8'
    }, function(err, data) {

      if (err) {
        console.error('Unable to read manifest.webapp from the zip file');
        console.error(err);
        try {
          fs.removeSync(extractDir);
        } catch (e) {}
        process.exit(1);
      }
      try {
        var manifest = JSON.parse(data);
        // Make mini-manifest
        manifest.package_path = url.resolve(argv.overrideManifest, 'package.zip');
        manifest.size = fileStat.size;
        fs.readFile(zipFileLocation, {
          encoding: 'binary'
        }, function(err, zip) {
          try {
            fs.removeSync(extractDir);
          } catch (e) {}
          if (err) {
            console.error('Unable to read ' + zipFileLocation);
            console.error(err);

            process.exit(1);
          }
          var encodedZip = new Buffer(zip, 'binary').toString('base64');
          cliClient(argv.overrideManifest, manifest, encodedZip,
            argv, cliClientCb);
          if ( !! cb) cb();
        });

      } catch (e) {
        console.error('Unable to read manifest.webapp as JSON');
        if (e.stack) {
          console.log(e.stack);
        } else {
          console.log(e);
        }
        console.error(data);
        try {
          fs.removeSync(extractDir);
        } catch (e) {}
        process.exit(1);
      }

    });
  });
}

function cliClient(manifestUrl, manifest, zip, argv, cb) {
  console.log('Building with', argv.endpoint);
  var body = JSON.stringify({
    manifestUrl: manifestUrl,
    manifest: manifest,
    packageZip: zip
  });
  request({
    url: argv.endpoint + '/cli_build',
    method: 'POST',
    body: body,
    headers: {
      "Content-Type": "application/json"
    }
  }, function(err, res, body) {
    if (503 === res.statusCode) {
      cb('Server is too busy, try again later.');
    } else if (err || 200 !== res.statusCode) {
      cb(err || 'Generator response status code was ' + res.statusCode);
    } else {
      var data = JSON.parse(body);
      if ('okay' === data.status) {
        cb(null, new Buffer(data.apk, 'base64').toString('binary'));
      } else {
        cb('Error in generator - ' + body);
      }
    }
  });
}

function cliClientCb(err, apk) {

  var output;
  if (!err) {
    if (argv.output) {
      output = path.resolve(process.cwd(), argv.output);
      fs.writeFile(output, apk, {
        encoding: 'binary'
      }, function(err) {
        if (err) {
          console.log(err);
          process.exit(1);
        }
        console.log('APK file is available at ' + argv.output);
        process.exit(0);
      });
    }
  } else {
    console.error(err);
    process.exit(1);
  }

}

function fakeManifestUrl(appName) {
  var home = homeDir();
  var parts;
  if (home.indexOf('/') === -1) {
    parts = home.split('\\');
  } else {
    parts = home.split('/');
  }
  var username = parts[parts.length - 1].toLowerCase();
  var escAppName = appName.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
  return 'https://' + escAppName + username + '.apk.cli.firefox.com/manifest.webapp';
}
