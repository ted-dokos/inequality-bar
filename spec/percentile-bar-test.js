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
//var pb = require('../percentile-bar.js');
var d3 = require("d3");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
//const { window } = new JSDOM(`...`);
//const { document } = (new JSDOM(`...`)).window;
const dom = new JSDOM(`<!DOCTYPE html><body><div class="test"></div></body>`);
global.document = dom.window.document;
//global.document = (new JSDOM(`<!DOCTYPE html><body></body>`)).window;

describe('The d3 module', function() {
  it('exists', function() {
    expect(d3).not.toBe(undefined);
  });
  it('Can run selections', function() {
    let empty = d3.selection()
    expect(empty).not.toBe(undefined);
    expect(empty).not.toBe(null);
  });
  it('Can join data', function() {
    let test = d3.select('div.test');
    let testData = ['a', 'b', 'c'];
    test.selectAll('div').data(testData).join('div').html(d => d);

    let res = d3.selectAll('div.test div').nodes();
    expect(res.length).toBe(testData.length);
    res.forEach(
        (element, i) => expect(element.innerHTML).toBe(testData[i]));

  });
});

// describe('Test getPercentilesForPercentBar', function() {
//   beforeEach(function() {
//     jasmine.addMatchers(customMatchers);
//   });

//   it('returns the right buckets for 0-90-99-99.9-100', function() {
//     let percentileStr = 'percentBar-0-90-99-99.9-100';
//     let percentiles = util.getPercentilesForPercentBar(percentileStr);
//     expect(percentiles.length).toBe(4);
//     expect(percentiles.find(p => p.lower === '0' && p.upper === '90'))
//         .toEqualApproximately({ lower: '0',
//                                 upper: '90',
//                                 size: 0.9,
//                                 sizeLower: 0.0,
//                                 sizeUpper: 0.9,
//                                 country: percentileStr });
//     expect(percentiles.find(p => p.lower === '90' && p.upper === '99'))
//         .toEqualApproximately({ lower: '90',
//                                 upper: '99',
//                                 size: 0.09,
//                                 sizeLower: 0.9,
//                                 sizeUpper: 0.99,
//                                 country: percentileStr });
//     expect(percentiles.find(p => p.lower === '99' && p.upper === '99.9'))
//         .toEqualApproximately({ lower: '99',
//                                 upper: '99.9',
//                                 size: 0.009,
//                                 sizeLower: 0.99,
//                                 sizeUpper: 0.999,
//                                 country: percentileStr });
//     expect(percentiles.find(p => p.lower === '99.9' && p.upper === '100'))
//         .toEqualApproximately({ lower: '99.9',
//                                 upper: '100',
//                                 size: 0.001,
//                                 sizeLower: 0.999,
//                                 sizeUpper: 1.0,
//                                 country: percentileStr });
//   });

//   it('returns the right buckets for 0-50-100', function() {
//     let percentileStr = 'percentBar-0-50-100';
//     let percentiles = util.getPercentilesForPercentBar(percentileStr);
//     expect(percentiles.length).toBe(2);
//     expect(percentiles.find(p => p.lower === '0' && p.upper === '50'))
//         .toEqualApproximately({ lower: '0',
//                                 upper: '50',
//                                 size: 0.5,
//                                 sizeLower: 0.0,
//                                 sizeUpper: 0.5,
//                                 country: percentileStr });
//     expect(percentiles.find(p => p.lower === '50' && p.upper === '100'))
//         .toEqualApproximately({ lower: '50',
//                                 upper: '100',
//                                 size: 0.5,
//                                 sizeLower: 0.5,
//                                 sizeUpper: 1.0,
//                                 country: percentileStr });
//   });
// });
