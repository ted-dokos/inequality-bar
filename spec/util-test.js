var util = require('../util.js');

describe('Test getPercentilesForPercentBar', function() {
  it('returns the right buckets for 0-90-99-99.9-100', function() {
    let percentiles = util.getPercentilesForPercentBar('percentBar-0-90-99-99.9-100');
    expect(percentiles.length).toBe(4);

    percentiles = util.getPercentilesForPercentBar('percentBar-0-50-100');
    expect(percentiles.length).toBe(2);
  });
});
