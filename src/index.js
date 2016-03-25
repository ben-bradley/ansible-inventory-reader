'use strict';

import { readFileSync } from 'fs';

const assignVars = (vars) => {
  return vars.reduce((_vars, v) => {
    let parts = v.split(/\ *\=\ */);

    _vars[parts[0]] = parts[1];
    return _vars;
  }, {});
}

const assignHostVars = (host) => {
  let parts = host.split(/\s+/),
    hostname = parts.shift();

  return { host: hostname, vars: assignVars(parts) };
}

const expandLetterRanges = (range) => {
  let [ match, start, end ] = range,
    { input } = range,
    result = [];

  let startNum = start.charCodeAt(),
    endNum = end.charCodeAt(),
    curr = startNum - 1;

  while (curr++ < endNum)
    result.push(input.replace(match, String.fromCharCode(curr)));

  return result;
}

const expandNumberRanges = (range) => {
  let [ match, start, end ] = range,
    { input } = range,
    result = [];

  start = Number(start);
  end = Number(end);

  let curr = start - 1;

  while (curr++ < end)
    result.push(input.replace(match, curr));

  return result;
}

const expandRanges = (children) => {
  let expanded = children.reduce((_children, child) => {
    // identify the type of expansions to preform
    let noRanges = !child.match(/\[.+?\]/),
      letterRanges = child.match(/\[(\w)\:(\w)\]/),
      numberRanges = child.match(/\[(\d)\:(\d)\]/);

    if (noRanges)
      _children.push(child);
    else if (numberRanges)
      _children = _children.concat(expandNumberRanges(numberRanges));
    else if (letterRanges)
      _children = _children.concat(expandLetterRanges(letterRanges));

    return _children;
  }, []);

  // check to see if there are any other ranges in the children
  let done = expanded.reduce(((_done, child) => (!child.match(/\[.+?\]/)) ? _done : false), true);

  // if there are still ranges, run it through again
  if (!done)
    return expandRanges(expanded);

  return expanded;
};

const Inventory = (filepath, encoding = 'utf8') => {
  if (!filepath || typeof filepath !== 'string')
    throw new Error('Filepath required to be a string.')

  const groups = readFileSync(filepath, encoding) // read the file into a groups object
    .replace(/\n*$/,'')                           // strip trailing new lines
    .split(/\n\s*\n/)                             // split into groups on empty lines
    .map((_group) => _group                       //
      .split('\n')                                // split each group into individual lines
      .filter((line) => !/^\s*\#/.test(line)))    // remove comments
    .reduce((_groups, items) => {                 //
      let _name = items                           // shift the first item to _name
        .shift()                                  //
        .replace(/[\[\]]/g, '');                  // strip out the brackets
                                                  //
      _groups[_name] = items;                     // assign the remaining items
      return _groups;                             //
    }, {});                                       //

  const groupNames = Object               // unique, top-level group names
    .keys(groups)                         //
    .reduce((_groupNames, group) => {     //
      let name = group.split(':')[0];     // grab the first part of the group name
                                          //
      if (_groupNames.indexOf(name) < 0)  // this name is unique
        _groupNames.push(name);           // add it to the list
                                          //
      return _groupNames;                 //
    }, []);                               //

  const inventory = groupNames                                      // build the inventory object
    .reduce((_inventory, group) => {                                //
      let vars = (groups[group + ':vars'] || []),                   // use 'group:vars' or []
        children = (groups[group + ':children'] || groups[group]);  // use 'group:children' or the group
                                                                    //
      _inventory[group] = {                                         //
        children: expandRanges(children),                           // expand out all the '[a:b]' ranges
        vars: assignVars(vars)                                      // assign the vars to the group
      };                                                            //
                                                                    //
      return _inventory;                                            //
    }, {});                                                         //

  for (let group in inventory) {                          // expand the nested groups
    let queue = inventory[group].children.slice();        // the work queue
                                                          //
    inventory[group].children = [];                       // reset the actual children array
                                                          //
    while (queue.length) {                                // while there's still work to do
      let child = queue.shift();                          // shift the next item
                                                          //
      if (inventory[child] && inventory[child].children)  // if this item has children,
        queue = queue.concat(inventory[child].children);  // add its children to the queue
      else                                                // otherwise,
        inventory[group].children.push(child);            // this item has no children
    }                                                     //
  }                                                       //

  // now that all hosts have been populated, assign the vars
  for (let group in inventory)
    inventory[group].children = inventory[group].children.map(assignHostVars);

  return inventory;
};

export default Inventory;
