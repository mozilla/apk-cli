# Windows specific support

If you get an error like

You are missing the Info-Zip `zip` and `unzip` programs.

These are a little tougher to install on Windows, but just follow these steps:

1) Download both of these files

* ftp://ftp.info-zip.org/pub/infozip/win32/unz600xn.exe
* ftp://ftp.info-zip.org/pub/infozip/win32/zip300xn.zip

2) Creat the directory C:\Program Files (x86)\Info-ZIP

3) Add `C:\Program Files (x86)\Info-ZIP` to your path via the Control Panel > System and Security > System > Advanced system settings > Environment Variables... > System variables > Path > Edit....

If you need help, check out [Java's instructions on adding a directory to your path](https://www.java.com/en/download/help/path.xml). It is not Java specific and works here too.

4) test that `zip` and `unzip` work by launching `cmd.exe`

    $ zip

    $ unzip

5) Done. You should be able to successfully use `mozilla-apk-cli` now.