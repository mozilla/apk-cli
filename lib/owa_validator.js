var url = require('url');

/**
 * Validates that JSON is a valid manifest
 * From https://developer.mozilla.org/en/OpenWebApps/The_Manifest
 * Code based on https://github.com/mozilla/gecko-dev/blob/628b85da4fce70f814e49650197a69ad955873b5/dom/apps/src/AppsUtils.jsm#L259-L333
 * Only the name property is mandatory.
 */
module.exports = function(manifest) {
  if (manifest.name === undefined)
    return false;

  // launch_path, entry_points launch paths, message hrefs, and activity hrefs can't be absolute
  if (manifest.launch_path && isAbsoluteURI(manifest.launch_path))
    return false;

  // return true if any launch_paths are fully qualified urls
  function checkAbsoluteEntryPoints(entryPoints) {
    if (!entryPoints) {
      return false;
    }
    var valid = false;
    entryPoints.forEach(function(name){
      if (entryPoints[name].launch_path &&
          isAbsoluteURI(entryPoints[name].launch_path)) {
        valid = true;
      }
    });
    return valid;
  }

  if (checkAbsoluteEntryPoints(manifest.entry_points))
    return false;

  var inValid = false;
  if (manifest.locales) {
    Object.keys(manifest.locales).forEach(function(localeName) {
      if (checkAbsoluteEntryPoints(manifest.locales[localeName].entry_points)) {
        inValid = false;
      }
    });
  }

  if (inValid) {
    return false;
  }

  if (manifest.activities) {
    var keys = Object.keys(manifest.activities);
    keys.forEach(function(activityName) {
      var activity = manifest.activities[activityName];
      if (activity.href && isAbsoluteURI(activity.href)) {
        inValid = false;
      }
    });
  }

  if (inValid) {
    return false;
  }

  // |messages| is an array of items, where each item is either a string or
  // a {name: href} object.
  var messages = manifest.messages;
  if (messages) {
    if (!Array.isArray(messages)) {
      return false;
    }
    manifest.messages.forEach(function(item) {
      if (typeof item === "object") {
        var keys = Object.keys(item);
        if (keys.length !== 1) {
          inValid = false;
        }
        if (isAbsoluteURI(item[keys[0]])) {
          inValid = false;
        }
      }
    });
  }

  if (inValid) {
    return false;
  }

  // The 'size' field must be a positive integer.
  if (manifest.size) {
    manifest.size = parseInt(manifest.size, 10);
    if (Number.isNaN(manifest.size) || manifest.size < 0) {
      return false;
    }
  }

  // The 'role' field must be a string.
  if (manifest.role && (typeof manifest.role !== "string")) {
    return false;
  }
  return true;
};

/**
 * Returns true if uri is a fully qualified URL
 */
function isAbsoluteURI(uri) {
  var u = url.parse(uri);
  return typeof u.protocol === 'string' &&
    u.slashes === true &&
    typeof u.host === 'string';
  //return u.path.charAt(0) === '/';
}