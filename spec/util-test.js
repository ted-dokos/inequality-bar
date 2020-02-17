/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var util = require('../src/util.js');

var customMatchers = {
  isObjectContainingApproximately: function(util, customEqualityTesters) {
    return {
      compare: function(actual, expected) {
        let result = { pass: true };
        let epsilon = 1 / 128;
        if (typeof(actual) !== 'undefined') {
          Object.keys(expected).forEach(function(k) {
            if (typeof(expected[k]) === 'number') {
              let numeric_comparison = false;
              // Use absolute comparison at 0, relative otherwise.
              if (expected[k] === 0) {
                numeric_comparison = Math.abs(actual[k] - expected[k]) < epsilon;
              } else {
                numeric_comparison = Math.abs(actual[k] - expected[k]) / expected[k] < epsilon;
              }
              result.pass = result.pass &&
                  (actual.hasOwnProperty(k) &&
                   typeof(actual[k]) === 'number' &&
                   numeric_comparison);
            } else {
              result.pass = result.pass &&
                  (actual.hasOwnProperty(k) &&
                   util.equals(actual[k], expected[k], customEqualityTesters));
            }
          });
        } else {
          result.pass = false;
        }

        if (result.pass) {
          result.message = 'Expected ' + JSON.stringify(actual) +
              ' not to be an object containing ' + JSON.stringify(expected) +
              ', where floats are compared with an epsilon of ' +
              epsilon + '.';
        } else {
          result.message = 'Expected ' + JSON.stringify(actual) +
              ' to be an object containing ' + JSON.stringify(expected) +
              ', where floats are compared with an epsilon of ' +
              epsilon + '.';
        }
        return result;
      },
    };
  }
};

describe('makePercentiles', function() {
  beforeEach(function() {
    jasmine.addMatchers(customMatchers);
  });

  it('creates the expected data in the case 0-50-100', function() {
    let cd = {
      'country1': [['p0p50', 0.4], ['p50p100', 0.6]],
      'country2': [['p0p50', 0.3], ['p50p100', 0.7]],
    };
    let percentiles = util.makePercentiles(cd);
    let pdForC1 = percentiles['country1'];
    expect(pdForC1.length).toBe(2);
    expect(pdForC1.find(pd => pd.lower === '0' && pd.upper === '50'))
        .isObjectContainingApproximately({ lower: '0',
                                           upper: '50',
                                           size: 0.4,
                                           sizeLower: 0.0,
                                           sizeUpper: 0.4,
                                           country: 'country1' });
    expect(pdForC1.find(pd => pd.lower === '50' && pd.upper === '100'))
        .isObjectContainingApproximately({ lower: '50',
                                           upper: '100',
                                           size: 0.6,
                                           sizeLower: 0.4,
                                           sizeUpper: 1.0,
                                           country: 'country1' });
    let pdForC2 = percentiles['country2'];
    expect(pdForC2.length).toBe(2);
    expect(pdForC2.find(pd => pd.lower === '0' && pd.upper === '50'))
        .isObjectContainingApproximately({ lower: '0',
                                           upper: '50',
                                           size: 0.3,
                                           sizeLower: 0.0,
                                           sizeUpper: 0.3,
                                           country: 'country2' });
    expect(pdForC2.find(pd => pd.lower === '50' && pd.upper === '100'))
        .isObjectContainingApproximately({ lower: '50',
                                           upper: '100',
                                           size: 0.7,
                                           sizeLower: 0.3,
                                           sizeUpper: 1.0,
                                           country: 'country2' });
  });

  it('handles countries with differing band data', function() {
    let cd = {
      'country1': [['p0p90', 0.4], ['p90p100', 0.6]],
      'country2': [['p0p50', 0.3], ['p50p100', 0.7]],
    };
    let percentiles = util.makePercentiles(cd);
    let pdForC1 = percentiles['country1'];
    expect(pdForC1.length).toBe(2);
    expect(pdForC1.find(pd => pd.lower === '0' && pd.upper === '90'))
        .isObjectContainingApproximately({ lower: '0',
                                           upper: '90',
                                           size: 0.4,
                                           sizeLower: 0.0,
                                           sizeUpper: 0.4,
                                           country: 'country1' });
    expect(pdForC1.find(pd => pd.lower === '90' && pd.upper === '100'))
        .isObjectContainingApproximately({ lower: '90',
                                           upper: '100',
                                           size: 0.6,
                                           sizeLower: 0.4,
                                           sizeUpper: 1.0,
                                           country: 'country1' });
    let pdForC2 = percentiles['country2'];
    expect(pdForC2.length).toBe(2);
    expect(pdForC2.find(pd => pd.lower === '0' && pd.upper === '50'))
        .isObjectContainingApproximately({ lower: '0',
                                           upper: '50',
                                           size: 0.3,
                                           sizeLower: 0.0,
                                           sizeUpper: 0.3,
                                           country: 'country2' });
    expect(pdForC2.find(pd => pd.lower === '50' && pd.upper === '100'))
        .isObjectContainingApproximately({ lower: '50',
                                           upper: '100',
                                           size: 0.7,
                                           sizeLower: 0.3,
                                           sizeUpper: 1.0,
                                           country: 'country2' });
  });

  it('handles overlapping (but consistent) bands', function() {
    let cd = { 'country1': [['p0p90', 0.6],
                            ['p90p100', 0.4],
                            ['p90p99', 0.2],
                            ['p99p100', 0.2]] };
    let percentiles = util.makePercentiles(cd);
    let pdForC1 = percentiles['country1'];
    expect(pdForC1.length).toBe(4);
    expect(pdForC1.find(pd => pd.lower === '0' && pd.upper === '90'))
        .isObjectContainingApproximately({ lower: '0',
                                           upper: '90',
                                           size: 0.6,
                                           sizeLower: 0.0,
                                           sizeUpper: 0.6,
                                           country: 'country1' });
    expect(pdForC1.find(pd => pd.lower === '90' && pd.upper === '99'))
        .isObjectContainingApproximately({ lower: '90',
                                           upper: '99',
                                           size: 0.2,
                                           sizeLower: 0.6,
                                           sizeUpper: 0.8,
                                           country: 'country1' });
    expect(pdForC1.find(pd => pd.lower === '90' && pd.upper === '100'))
        .isObjectContainingApproximately({ lower: '90',
                                           upper: '100',
                                           size: 0.4,
                                           sizeLower: 0.6,
                                           sizeUpper: 1.0,
                                           country: 'country1' });
    expect(pdForC1.find(pd => pd.lower === '99' && pd.upper === '100'))
        .isObjectContainingApproximately({ lower: '99',
                                           upper: '100',
                                           size: 0.2,
                                           sizeLower: 0.8,
                                           sizeUpper: 1.0,
                                           country: 'country1' });
  });

  it('logs a warning when overlapping bands are inconsistent', function(){
    spyOn(console, 'warn');
    let cd = { 'country1': [['p0p90', 0.6],
                            ['p90p100', 0.4],
                            ['p90p99', 0.3],
                            ['p99p100', 0.2]] };
    util.makePercentiles(cd);
    expect(console.warn).toHaveBeenCalled();
  });
});

  describe('getPercentilesForPercentBar', function() {
    beforeEach(function() {
      jasmine.addMatchers(customMatchers);
    });

    it('returns the right buckets for 0-90-99-99.9-100', function() {
      let percentileStr = 'percentBar-0-90-99-99.9-100';
      let percentiles = util.getPercentilesForPercentBar(percentileStr);
      expect(percentiles.length).toBe(4);
      expect(percentiles.find(p => p.lower === '0' && p.upper === '90'))
          .isObjectContainingApproximately({ lower: '0',
                                             upper: '90',
                                             size: 0.9,
                                             sizeLower: 0.0,
                                             sizeUpper: 0.9,
                                             country: percentileStr });
      expect(percentiles.find(p => p.lower === '90' && p.upper === '99'))
          .isObjectContainingApproximately({ lower: '90',
                                             upper: '99',
                                             size: 0.09,
                                             sizeLower: 0.9,
                                             sizeUpper: 0.99,
                                             country: percentileStr });
      expect(percentiles.find(p => p.lower === '99' && p.upper === '99.9'))
          .isObjectContainingApproximately({ lower: '99',
                                             upper: '99.9',
                                             size: 0.009,
                                             sizeLower: 0.99,
                                             sizeUpper: 0.999,
                                             country: percentileStr });
      expect(percentiles.find(p => p.lower === '99.9' && p.upper === '100'))
          .isObjectContainingApproximately({ lower: '99.9',
                                             upper: '100',
                                             size: 0.001,
                                             sizeLower: 0.999,
                                             sizeUpper: 1.0,
                                             country: percentileStr });
    });

    it('returns the right buckets for 0-50-100', function() {
      let percentileStr = 'percentBar-0-50-100';
      let percentiles = util.getPercentilesForPercentBar(percentileStr);
      expect(percentiles.length).toBe(2);
      expect(percentiles.find(p => p.lower === '0' && p.upper === '50'))
          .isObjectContainingApproximately({ lower: '0',
                                             upper: '50',
                                             size: 0.5,
                                             sizeLower: 0.0,
                                             sizeUpper: 0.5,
                                             country: percentileStr });
      expect(percentiles.find(p => p.lower === '50' && p.upper === '100'))
          .isObjectContainingApproximately({ lower: '50',
                                             upper: '100',
                                             size: 0.5,
                                             sizeLower: 0.5,
                                             sizeUpper: 1.0,
                                             country: percentileStr });
    });
  });

describe('computeDesiredPercentiles', function() {
  it('returns the correct set for 0-90-99-99.9-100', function() {
    let dp = util.computeDesiredPercentiles('percentBar-0-90-99-99.9-100');
    expect(dp.size).toBe(4);
    expect(dp).toContain('0-90');
    expect(dp).toContain('90-99');
    expect(dp).toContain('99-99.9');
    expect(dp).toContain('99.9-100');
  });

  it('returns the correct set for 0-50-100', function() {
    let dp = util.computeDesiredPercentiles('percentBar-0-50-100');
    expect(dp.size).toBe(2);
    expect(dp).toContain('0-50');
    expect(dp).toContain('50-100');
  });
});
