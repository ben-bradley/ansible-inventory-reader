'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _fs = require('fs');

var dedupeChildren = function dedupeChildren(children, child) {
  var dupe = false;

  children = children.map(function (_child) {
    if (_child.host === child.host) {
      dupe = true;
      Object.assign(_child.vars, child.vars);
    }
    return _child;
  });

  if (!dupe) children.push(child);

  return children;
};

var assignVars = function assignVars(vars) {
  return vars.reduce(function (_vars, v) {
    var parts = v.split(/\ *\=\ */);

    _vars[parts[0]] = parts[1];
    return _vars;
  }, {});
};

var assignHostVars = function assignHostVars(host) {
  var parts = host.split(/\s+/),
      hostname = parts.shift();

  return { host: hostname, vars: assignVars(parts) };
};

var expandLetterRanges = function expandLetterRanges(range) {
  var _range = _slicedToArray(range, 3);

  var match = _range[0];
  var start = _range[1];
  var end = _range[2];
  var input = range.input;
  var result = [];

  var startNum = start.charCodeAt(),
      endNum = end.charCodeAt(),
      curr = startNum - 1;

  while (curr++ < endNum) result.push(input.replace(match, String.fromCharCode(curr)));

  return result;
};

var expandNumberRanges = function expandNumberRanges(range) {
  var _range2 = _slicedToArray(range, 3);

  var match = _range2[0];
  var start = _range2[1];
  var end = _range2[2];
  var input = range.input;
  var result = [];

  start = Number(start);
  end = Number(end);

  var curr = start - 1;

  while (curr++ < end) result.push(input.replace(match, curr));

  return result;
};

var expandRanges = function expandRanges() {
  var _arguments = arguments;
  var _again = true;

  _function: while (_again) {
    _again = false;
    var children = _arguments.length <= 0 || _arguments[0] === undefined ? [] : _arguments[0];

    var expanded = children.reduce(function (_children, child) {
      // identify the type of expansions to preform
      var noRanges = !child.match(/\[.+?\]/),
          letterRanges = child.match(/\[(\w)\:(\w)\]/),
          numberRanges = child.match(/\[(\d+?)\:(\d+?)\]/);

      if (noRanges) _children.push(child);else if (numberRanges) _children = _children.concat(expandNumberRanges(numberRanges));else if (letterRanges) _children = _children.concat(expandLetterRanges(letterRanges));

      return _children;
    }, []);

    // check to see if there are any other ranges in the children
    var done = expanded.reduce(function (_done, child) {
      return !child.match(/\[.+?\]/) ? _done : false;
    }, true);

    // if there are still ranges, run it through again
    if (!done) {
      _arguments = [expanded];
      _again = true;
      children = expanded = done = undefined;
      continue _function;
    }

    return expanded;
  }
};

var Inventory = function Inventory(filepath) {
  var encoding = arguments.length <= 1 || arguments[1] === undefined ? 'utf8' : arguments[1];

  if (!filepath || typeof filepath !== 'string') throw new Error('Filepath required to be a string.');

  var groups = (0, _fs.readFileSync)(filepath, encoding) // read the file into a groups object
  .trim() // remove leading/trailing whitespace
  .split(/\n\s*\n/) // split into groups on empty lines
  .map(function (_group) {
    return _group //
    .split('\n') // split each group into individual lines
    .filter(function (line) {
      return !/^\s*\#/.test(line);
    });
  }) // remove comments
  .reduce(function (_groups, items) {
    //
    var _name = items // shift the first item to _name
    .shift() //
    .replace(/[\[\]]/g, ''); // strip out the brackets
    //
    _groups[_name] = items; // assign the remaining items
    return _groups; //
  }, {}); //

  var groupNames = Object // unique, top-level group names
  .keys(groups) //
  .reduce(function (_groupNames, group) {
    //
    var name = group.split(':')[0]; // grab the first part of the group name
    //
    if (_groupNames.indexOf(name) < 0) // this name is unique
      _groupNames.push(name); // add it to the list
    //
    return _groupNames; //
  }, []); //

  var inventory = groupNames // build the inventory object
  .reduce(function (_inventory, group) {
    //
    var vars = groups[group + ':vars'] || [],
        // use 'group:vars' or []
    children = groups[group + ':children'] || groups[group]; // use 'group:children' or the group
    //
    _inventory[group] = { //
      children: expandRanges(children), // expand out all the '[a:b]' ranges
      vars: assignVars(vars) // assign the vars to the group
    }; //
    //
    return _inventory; //
  }, {}); //

  var _loop = function (group) {
    // expand the nested groups
    var queue = inventory[group].children.slice(),
        // the work queue
    asterisked = false; // flag to prevent asterisk loops
    //
    inventory[group].children = []; // reset the actual children array
    //
    while (queue.length) {
      // while there's still work to do
      var child = queue.shift().trim(); // shift the next item
      //
      if (child === '*' && !asterisked) {
        //
        queue = queue.concat(groupNames.filter(function (name) {
          return name !== group;
        }));
        asterisked = true;
      } else if (inventory[child] && inventory[child].children) // if this item has children,
        queue = queue.concat(inventory[child].children); // add its children to the queue
      else if (child !== '*') // otherwise,
          inventory[group].children.push(child); // this item has no children
    } //
  };

  for (var group in inventory) {
    _loop(group);
  } //

  // now that all hosts have been populated, assign the vars
  for (var group in inventory) {
    inventory[group].children = inventory[group].children.map(assignHostVars).reduce(dedupeChildren, []);
  }return inventory;
};

exports['default'] = Inventory;
module.exports = exports['default'];