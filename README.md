# APK CLI

A Command Line Interface for generating Android native apps from open webapps.

These are mainly for testing and not for distribution.
Use the APK Factory Service for distributable .apk files.

## Getting started

This tool requires [NodeJS](http://nodejs.org), [zip, and unzip](http://www.info-zip.org/).

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

**Note:** Do not upload this .apk into the Google Play store. Do not distribute this as a released Android app through your own website. You're users will not be able to get updates to your app.

## Installation problems?

If you are using **Windows** and get errors, [check out these Windows notes](./docs/WINDOWS.md).

## Installing the .apk

Now that you have a .apk file, you need to install it on your Android device.

There are two main ways:

1) Setup `adb` and install to your device

    adb install test.apk

If adb is setup correctly, the app should now appear in your list of installed apps. To push an updated .apk, you must un-install before running this command a second time.

2) Request it from a web browser

    python -m SimpleHTTPServer

Figure out your IP Address and point your Android's browser at http://192.168.0.13:8000/test.apk or whatever

## Relaunching the .apk

1) Find out your package name

    adb lolcat

Kill you app and then make it run. Look for:

    I/ActivityManager(  612): START u0 {act=android.intent.action.MAIN cat=[android.intent.category.LAUNCHER] flg=0x10200000 cmp=com.firefox.cli.apk.packagedozten.p3ea7a6153641373b9751d2e48430c43f/org.mozilla.android.synthapk.LauncherActivity} from pid 913 

From this we can wee the packag ename is `com.firefox.cli.apk.packagedozten.p3ea7a6153641373b9751d2e48430c43f`

    $ adb shell
    # am start -a android.intent.action.MAIN -n com.firefox.cli.apk.packagedozten.p3ea7a6153641373b9751d2e48430c43f/org.mozilla.android.synthapk.LauncherActivity

Which is

    # am start -a android.intent.action.MAIN -n ${PACKAGE_NAME}/org.mozilla.android.synthapk.LauncherActivity