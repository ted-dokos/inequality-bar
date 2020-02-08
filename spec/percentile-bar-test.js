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
var pb = require('../src/percentile-bar.js');
var d3 = require("d3");

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

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
  let x = d3.scaleLinear()
      .range([0, 1000])
      .domain([0, 1.0]);
  let dom = null;
  beforeEach(function() {
    dom = new JSDOM(`<!DOCTYPE html><body><svg class="test"></svg></body>`);
    global.document = dom.window.document;
  });
  afterEach(function() {
    dom = null;
    global.document = null;
  });

  it('creates elements for the entering percentile data', function() {
    let testData = [ { lower: '0', upper: '50',
                   sizeLower: 0.0, sizeUpper: 0.3, size: 0.3,
                   country: 'unimportant'},
                 { lower: '50', upper: '100',
                   sizeLower: 0.3, sizeUpper: 1.0, size: 0.7,
                   country: 'unimportant'},
                   ];
    let enter = d3.select('svg.test')
        .selectAll('g.bar')
        .data(testData, pb.percentileDataKeyFn)
        .enter();

    let nodesBefore = d3.selectAll('svg.test g.bar').nodes();
    expect(nodesBefore.length).toBe(0);

    pb.percentBarEnterFn(enter, x, 123);

    let nodesAfter = d3.selectAll('svg.test g.bar').nodes();
    expect(nodesAfter.length).toBe(2);
    expect(d3.select('svg.test').selectAll('g.bar').data()).toEqual(testData);
  });

  it('creates a "no data" element when the entering data = [null]', function() {
    let testData = [null];
    let enter = d3.select('svg.test')
        .selectAll('g.bar')
        .data(testData, pb.percentileDataKeyFn)
        .enter();

    let nodesBefore = d3.selectAll('svg.test g.bar').nodes();
    expect(nodesBefore.length).toBe(0);

    pb.percentBarEnterFn(enter, x, 123);

    let after = d3.selectAll('svg.test g.bar');
    expect(after.nodes().length).toBe(1);
    expect(after.select('text').text()).toEqual('NO DATA');
  });

  it('creates new elements when passed new data', function() {
    let initialData = [ { lower: '0', upper: '50',
                          sizeLower: 0.0, sizeUpper: 0.3, size: 0.3,
                          country: 'unimportant'},
                        { lower: '50', upper: '100',
                          sizeLower: 0.3, sizeUpper: 1.0, size: 0.7,
                          country: 'unimportant'},
                      ];

    d3.select('svg.test')
        .selectAll('g.bar')
        .data(initialData, pb.percentileDataKeyFn)
        .join(enter => pb.percentBarEnterFn(enter, x, 123));

    expect(d3.select('svg.test').selectAll('g.bar').data())
        .toEqual(initialData);

    let newData = [ { lower: '0', upper: '50',
                          sizeLower: 0.0, sizeUpper: 0.5, size: 0.5,
                          country: 'unimportant'},
                        { lower: '50', upper: '100',
                          sizeLower: 0.5, sizeUpper: 1.0, size: 0.5,
                          country: 'unimportant'},
                      ];

    let update = d3.select('svg.test')
        .selectAll('g.bar')
        .data(newData, pb.percentileDataKeyFn);

    expect(update.exit().nodes().length).toBe(2);
    expect(update.exit().data()).toEqual(initialData);
    expect(update.enter().nodes().length).toBe(2);
    expect(update.enter().data()).toEqual(newData);

    update.join(enter => pb.percentBarEnterFn(enter, x, 123));

    expect(d3.select('svg.test').selectAll('g.bar').data()).toEqual(newData);
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
  let dom = null;
  beforeEach(function() {
    dom = new JSDOM(`<!DOCTYPE html><body><div class="test"></div></body>`);
    global.document = dom.window.document;
  });
  afterEach(function() {
    dom = null;
    global.document = null;
  });

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
