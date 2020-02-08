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
var pb = require('../percentile-bar.js');
var d3 = require("d3");

const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(`<!DOCTYPE html><body><div class="test"></div></body>`);
global.document = dom.window.document;

describe('countryDataFn', function() {
  it('returns [null] when the country is not in the data', function() {
    expect(pb.countryDataFn('France', {})).toEqual([null]);
  });

  it('returns [null] when the country is trivially in the data',
     function() {
       expect(pb.countryDataFn('France', { 'France': null })).toEqual([null]);
       expect(pb.countryDataFn('France', { 'France': [], })).toEqual([null]);
     });

  it('gets country data when present', function() {
    let data = ['not', 'real', 'data', 'but', 'whatevs'];
    expect(pb.countryDataFn('France', { 'France': data.slice() }))
        .toEqual(data);
  });
});

describe('percentBarEnterFn', function() {
  it('creates visual data for the entering percentile data', function() {
    let testData = [ { lower: '0', upper: '50',
                   sizeLower: 0.0, sizeUpper: 0.3, size: 0.3,
                   country: 'unimportant'},
                 { lower: '50', upper: '100',
                   sizeLower: 0.3, sizeUpper: 1.0, size: 0.7,
                   country: 'unimportant'},
                   ];
    let x = d3.scaleLinear()
        .range([0, 1000])
        .domain([0, 1.0]);
    let enter = d3.select('div.test')
        .selectAll('g.bar')
        .data(testData, pb.percentileDataKeyFn)
        .enter();

    let nodesBefore = d3.selectAll('div.test g.bar').nodes();
    expect(nodesBefore.length).toBe(0);

    pb.percentBarEnterFn(enter, x, 123);

    let nodesAfter = d3.selectAll('div.test g.bar').nodes();
    expect(nodesAfter.length).toBe(2);
  });
});

describe('percentileDataKeyFn', function() {
  it('is idempotent', function() {
    let pd = { lower: '90', upper: '100',
               sizeLower: 0.8, sizeUpper: 1.0,
               size: (1.0 - 0.8),
               country: 'unimportant' };
    expect(pb.percentileDataKeyFn(pd)).toEqual(pb.percentileDataKeyFn(pd));
  });

  it('returns different keys when percentile bands are different',
     function() {
       let pd1 = { lower: '90', upper: '100',
                   sizeLower: 0.8, sizeUpper: 1.0,
                   size: (1.0 - 0.8),
                   country: 'unimportant' };
       let pd2 = { lower: '95', upper: '100',
                   sizeLower: 0.8, sizeUpper: 1.0,
                   size: (1.0 - 0.8),
                   country: 'unimportant' };
       expect(pb.percentileDataKeyFn(pd1))
           .not.toEqual(pb.percentileDataKeyFn(pd2));
     });

  it('returns different keys when sizes are different', function() {
    let pd1 = { lower: '90', upper: '100',
                sizeLower: 0.8, sizeUpper: 1.0,
                size: (1.0 - 0.8),
                country: 'unimportant' };
    let pd2 = { lower: '90', upper: '100',
                sizeLower: 0.7, sizeUpper: 1.0,
                size: (1.0 - 0.7),
                country: 'unimportant' };
    expect(pb.percentileDataKeyFn(pd1))
        .not.toEqual(pb.percentileDataKeyFn(pd2));
  });
});

describe('The d3 module', function() {
  it('exists', function() {
    expect(d3).not.toBe(undefined);
  });
  it('can run selections', function() {
    let empty = d3.selection()
    expect(empty).not.toBe(undefined);
    expect(empty).not.toBe(null);
  });
  it('can join data', function() {
    let test = d3.select('div.test');
    let testData = ['a', 'b', 'c'];
    test.selectAll('div').data(testData).join('div').html(d => d);

    let res = d3.selectAll('div.test div').nodes();
    expect(res.length).toBe(testData.length);
    res.forEach(
        (element, i) => expect(element.innerHTML).toBe(testData[i]));

  });
});
