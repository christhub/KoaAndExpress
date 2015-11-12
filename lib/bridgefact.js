var bridgeFacts = [
  'the bridge is getting you over the river',
  'there is the marquam bridge that carries I-5 over the willamette',
  'the fremont bridge carries I-405 over the willamette',
  'the broadway bridge carries broadway over the willamette',
  'the ross island bridge carries 26 over the willamette river',
  'the sellwood bridge connects sellwood to the other side of the river'
];

exports.getBridgeFact = function({
      var idx = Math.floor(Math.random() * bridgeFacts.length);
      return bridgeFacts[idx];
});
