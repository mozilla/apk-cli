# Windows specific support

If you get an error like

    C:\Users\IEUser>.\node_modules\.bin\mozilla-apk-cli .\www test.apk
    Unable to unzip C:\users\IEUser\www\package.zip { [Error: Command failed 'zip' is not recognized as an internal or external command,
    operable program or batch file.
    ] killed: false, code: 1, signal: null}
    unzip STDERR:  'zip' is not recognized as an internal or external command, operable program or batch file.
    
    You must have unzip and zip from Info-ZIP installed.

    C:\users\IEUser>

You are missing the Info-Zip `zip` and `unzip` programs.

These are a little tougher to install on Windows, but just follow these steps:

1) Download both of these files

* ftp://ftp.info-zip.org/pub/infozip/win32/unz600xn.exe
* ftp://ftp.info-zip.org/pub/infozip/win32/zip300xn.zip

2) Create the directory C:\Program Files (x86)\Info-ZIP

3) Copy `unz600xn.exe` into `C:\Program Files (x86)\Info-ZIP` and then run it.

4) Extract all files in `zip300xn.zip` into `C:\Program Files (x86)\Info-ZIP` it is okay to overwrite LICENSE and other text files, as they are identical.

5) Add `C:\Program Files (x86)\Info-ZIP` to your path via the Control Panel > System and Security > System > Advanced system settings > Environment Variables... > System variables > Path > Edit....

If you need help, check out [Java's instructions on adding a directory to your path](https://www.java.com/en/download/help/path.xml). It is not Java specific and works here too.

6) Restart Windows.

7) test that `zip` and `unzip` work by launching `cmd.exe`

    C:\Users\IEUser> zip
    UnZip 6.00 of 20 April 2009... (help page output)
    C:\Users\IEUser> unzip
    UnZip 6.00 of 20 April 2009... (help page output)

You should be able to successfully use `mozilla-apk-cli` now.