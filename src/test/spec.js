'use strict';

import should from 'should';

import Inventory from '../';

const filepath = __dirname + '/../../inventory/inventory';

const assertGroup = (group) => {
  (group).should.be.an.Object.with.properties([ 'children', 'vars' ]);
  (group.vars).should.be.an.Object;
  (group.children).should.be.an.Array;
  group.children.forEach(assertChild);
};

const assertChild = (child) => {
  (child).should.be.an.Object.with.properties([ 'host', 'vars' ]);
  (child.host).should.be.a.String;
  (child.vars).should.be.an.Object;
};

describe('Ansible Inventory Reader', () => {

  it('should pass', () => {
    let inventory = new Inventory(filepath);

    (inventory).should.be.an.Object.with.properties([
      'a', 'b', 'c',
      'letter_range',
      'number_range',
      'combo_range',
      'host_vars',
      'all_example',
      'all_star',
      'no_children'
    ]);

    for (let group in inventory)
      assertGroup(inventory[group]);

    let {
      a, b, c,
      letter_range,
      number_range,
      combo_range,
      host_vars,
      all_example,
      all_star,
      no_children
    } = inventory;

    (a.children[0].host).should.eql('a.example.com');

    (b.children[0].host).should.eql('b.example.com');

    (c.children[0].host).should.eql('c.example.com');
    (c.vars).should.eql({ foo: 'bar' });

    (letter_range.children).should.have.length(3);
    (letter_range.children[0].host).should.eql('d.example.com');
    (letter_range.children[1].host).should.eql('e.example.com');
    (letter_range.children[2].host).should.eql('f.example.com');

    (number_range.children).should.have.length(3);
    (number_range.children[0].host).should.eql('number-1.example.com');
    (number_range.children[1].host).should.eql('number-2.example.com');
    (number_range.children[2].host).should.eql('number-3.example.com');

    (combo_range.children).should.have.length(4);
    (combo_range.children[0].host).should.eql('letter-a-number-1.example.com');
    (combo_range.children[1].host).should.eql('letter-b-number-1.example.com');
    (combo_range.children[2].host).should.eql('letter-a-number-2.example.com');
    (combo_range.children[3].host).should.eql('letter-b-number-2.example.com');

    (host_vars.children[0].host).should.eql('d.example.com');
    (host_vars.children[0].vars).should.eql({ bar: 'baz' });

    (all_example.children).should.have.length(13);
    (all_example.children[3].vars).should.eql({ bar: 'baz' });

    (all_star).should.eql(all_example);

    (no_children.children).should.have.length(0);
  });

});
