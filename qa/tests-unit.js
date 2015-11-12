var bridgeFact = require('../lib/bridgefact.js');
var expect = require('chai').expect;

suite('Bridge fact tests', function(){

  test('getBridgeFact() should return a bridge fact', function(){
    expect(typeof bridgeFact.getBridgeFact() === 'string');
  });
});
