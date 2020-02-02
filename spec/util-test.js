var util = require('../util.js');

describe('A suite', function() {
  it('contains spec with an expectation', function() {
    expect(true).toBe(true);
  });
});

describe('Test getPercentilesForPercentBar', function() {
  it('returns the right buckets for 0-90-99-99.9-100', function() {
    let percentiles = util.getPercentilesForPercentBar('percentBar-0-90-99-99.9-100');
    expect(percentiles.length).toBe(4);

    percentiles = util.getPercentilesForPercentBar('percentBar-0-50-100');
    expect(percentiles.length).toBe(2);
  });
});
