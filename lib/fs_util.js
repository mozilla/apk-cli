/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
var path = require('path');

var fs = require('fs.extra');

exports.ensureDirectoryExistsFor = function(filename) {
  var dirname = path.dirname(filename);
  if (fs.existsSync(dirname)) {
    return;
  }

  fs.mkdirRecursiveSync(dirname);
};