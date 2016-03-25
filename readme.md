# Ansible Inventory Reader

Ansible is taking over a lot of the automation that I interact with and I need a way for my scripts to reference the inventory files so I wrote this module to make that possible.

## Installation

For now I'm keeping this out of NPM, but if I get it refined I may post it there.  If you want to use it before then:

```bash
$ npm install ben-bradley/ansible-inventory-reader
```

## Use

```javascript
'use strict';

import Inventory from 'ansible-inventory-reader';

let filepath = __dirname + '/path/to/inventory/file';

let inventory = new Inventory(filepath);

console.log(JSON.stringify(inventory, null, 2));
```

## Ansible Inventory INI format

The Ansible inventory file INI format allows for the following syntax:

```ini
[group_a]
host_a

[group_b:children]
host_b

[group_b:vars]
foo=bar

[group_c]
host_c foo=bar

[group_def]
host_[d:f]

[group_all]
group_a
group_b
group_c
group_def
```

## Converted to JSON:

```json
{
  "group_a": {
    "children": [
      {
        "host": "host_a",
        "vars": {}
      }
    ],
    "vars": {}
  },
  "group_b": {
    "children": [
      {
        "host": "host_b",
        "vars": {}
      }
    ],
    "vars": {
      "foo": "bar"
    }
  },
  "group_c": {
    "children": [
      {
        "host": "host_c",
        "vars": {
          "foo": "bar"
        }
      }
    ],
    "vars": {}
  },
  "group_def": {
    "children": [
      {
        "host": "host_d",
        "vars": {}
      },
      {
        "host": "host_e",
        "vars": {}
      },
      {
        "host": "host_f",
        "vars": {}
      }
    ],
    "vars": {}
  },
  "group_all": {
    "children": [
      {
        "host": "host_a",
        "vars": {}
      },
        {
          "host": "host_b",
          "vars": {}
        },
      {
        "host": "host_c",
        "vars": {
          "foo": "bar"
        }
      },
      {
        "host": "host_d",
        "vars": {}
      },
      {
        "host": "host_e",
        "vars": {}
      },
      {
        "host": "host_f",
        "vars": {}
      }
    ],
    "vars": {}
  }
}
```
