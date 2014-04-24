/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var path = require('path');
var url = require('url');

var _ = require('underscore');
var fs = require('fs.extra');
var request = require('request');

var fsUtil = require('./fs_util');

/**
 * Objects
 */

function FileLoader (prefix) {
  if (prefix) {
    this.prefix = path.resolve(process.cwd(), prefix);
  } else {
    this.prefix = process.cwd();
  }

}
_.extend(FileLoader.prototype, {
  copy: function(suffix, destFile, cb) {
    var srcFile = path.join(this.prefix, suffix);
    fsUtil.ensureDirectoryExistsFor(destFile);
    fs.copy(srcFile, destFile, cb);
  },

  load: function(suffix, cb) {
    var srcFile = path.resolve(this.prefix, suffix);

    if (cb) {
      fs.readFile(srcFile, cb);
    } else {
      return fs.readFileSync(srcFile, "utf8");
    }
  }
});

function HttpFileLoader (prefix) {
  this.prefix = prefix;
}
HttpFileLoader.prototype = _.extend(new FileLoader(), {

  load: function(suffix, cb) {
    var srcFile = this.prefix + suffix;
    if (cb) {
      request(srcFile, function(error, response, body) {
        if (!error && 200 === response.statusCode) {
          cb(error, body);
        } else {
          if (!error) {
            if (403 === response.statusCode) {
              cb(new Error('Manifest is Forbidden CODE: 403'));
            } else {
              cb(new Error('Unknown error loading manifest CODE:' + response.statusCode));
            }
          } else {
            cb(error);
          }
        }
      });
    } else {
      throw "NOT IMPLEMENTED";
    }

  },

  copy: function(suffix, destFile, cb) {
    var srcFile = url.resolve(this.prefix, suffix);
    fsUtil.ensureDirectoryExistsFor(destFile);
    var r = request(srcFile).pipe(fs.createWriteStream(destFile));
    r.on('finish', cb);
  }

});


module.exports = {
  create: function(prefix) {
    if (/^\w+:\/\//.test(prefix)) {
      return new HttpFileLoader(prefix);
    } else {
      return new FileLoader(prefix);
    }
  },
  stripBom: function(text) {
    var start = 0;
    var bomChars = ['\uFFFE', '\uFEFF'];
    if (typeof text === 'object') {
      text = new Buffer(text, 'utf8').toString('utf8');
    }
    for (var i=0; i < text.length; i++) {
      if (text.charAt && bomChars.indexOf(text.charAt(i)) !== -1) {
        // Skip this char
        start = i + 1;
      } else {
        break;
      }
    }
    return text.substring(start);
  }
};