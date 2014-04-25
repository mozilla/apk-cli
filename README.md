# APK CLI

A Command Line Interface for generating Android native apps from open webapps.

These are mainly for testing and not for distribution.
Use the APK Factory Service for distributable .apk files.

## Getting started

This tool requires [NodeJS](http://nodejs.org), zip, and unzip.

    npm install mozilla-apk-cli

You will now have `mozilla-apk-cli` installed in `node_modules/.bin`.

(You can do `npm install -g mozilla-apk-cli` to install this command system wide)

## Usage


    Usage: ./node_modules/.bin/mozilla-apk-cli {OPTIONS} manifestOrPackagedApp testable.apk

    Hosted App:             mozilla-apk-cli {OPTIONS} http://example.com/manifest.webapp testable.apk
    Packaged App Zip:       mozilla-apk-cli {OPTIONS} package.zip testable.apk
    Packaged App Dir:       mozilla-apk-cli {OPTIONS} ./www testable.apk

    mozilla-apk-cli can accept either a manifest url, a zip file, or a directory which contains the source code for a packaged app.

    Typical usage will not require any OPTIONS.

    Options:
      --overrideManifest  Treat this manifest url as the canoncial url while
                      creating the apk                                          
      --endpoint          The URL for the APK Factory Service
                          [default: "https://controller-review.apk.firefox.com"]
      --help, -?          Display this message                                      
      --config-files      Comma seperate file paths

