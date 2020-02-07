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

describe('percentileDataKeyFn', function() {
  it(''
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
