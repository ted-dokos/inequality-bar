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

/**
 * @fileoverview Description of this file.
 */

var selectedCountries = [/*'percentopia',*/ 'USA', 'France'];
var debug = true;

var percentileColors = {
  '0-90': 'lightgreen',
  '90-99': '#5599dd',
  '99-99.9': 'darkorange',
  '99.9-100': '#cc4444',
};
var percentiles = [0, 90, 99, 99.9, 100];

var dataBase = {};
// Data defined in data.js
for (var year of Object.keys(data)) {
  var intermediateData = [];
  for (var country of Object.keys(data[year])) {
    intermediateData.push({name: country, bins: data[year][country]});
  }
  dataBase[year] = makePercentiles(percentiles, intermediateData);
}

// var dataBase = {
//   2014: makePercentiles(
//       percentiles,
//       [
//         {name: 'USA', bins: [53.0, 26.8, 10.9, 9.3]},
//         {name: 'France', bins: [67.4, 21.8, 7.1, 3.7]},
//         {name: 'Sweden', bins: [71.9, 19.3, 5.8, 3.0]},
//       ]),
//   1980: makePercentiles(
//       percentiles,
//       [
//         {name: 'USA', bins: [65.8, 23.6, 7.1, 3.6]},
//         {name: 'France', bins: [69.4, 22.5, 5.6, 2.6]},
//         {name: 'Sweden', bins: [77.8, 17.2, 3.8, 1.2]},
//       ])
// };

var upNext = '2014';
var displayData = dataBase['1980'];

if (debug) {
  console.log(displayData);
}

var chartWidth = 1000;
var chartHeight = 600;
var barHeight = 30;
var barBuffer = 30;

var x = d3.scaleLinear().range([chartWidth * 0.02, chartWidth * 0.98]).domain([
  0, 100
]);

var percentileAxis = d3.axisBottom()
                         .scale(x)
    .tickValues(percentiles)
    .tickFormat(d => { if (d < 100) { return d.toFixed(1); } else { return '100'; }});

var chart =
    d3.select('.chart').attr('width', chartWidth).attr('height', chartHeight);

chart.append('g')
    .attr('class', 'axis')
    .attr('transform',
          'translate(0, ' + (barHeight + chartHeight * 0.05).toString() + ')');

function display(data) {
  var transformedData = [];
  data.forEach(function (p) {
    var toPush = [];
    var percentileString = p.lower.toString() + '-' + p.upper.toString();
    toPush.push(['percentopia', p.lower, p.upper, percentileString]);
    selectedCountries.forEach(function (c) {
      toPush.push([c, p.countries[c].lower, p.countries[c].upper,
                   percentileString, p.countries[c].size]);
    });
    transformedData.push(toPush);
  });

  var bars = chart.selectAll('g.percentile')
               .data(transformedData)
               .join('g')
               .attr('class', 'percentile')
               .attr(
                   'transform',
                   'translate(0, ' + (chartHeight * 0.05).toString() + ')');

  bars.selectAll('rect')
      .data(function (d, i) { return d; /* d is transformedData[i] */ })
      .join('rect')
      .attr(
          'x',
          d => {
            return x(d[1]);
          })
      .attr('y', (d, i) => i * (barHeight + barBuffer))
      .style(
          'fill',
          d => {
            console.log(d);
            return percentileColors[d[3]];
          })
      .attr('height', barHeight)
      .attr('width', d => {
        return x(d[2]) - x(d[1]);
      });

  bars.selectAll('text')
      .data((d, i) => d)
      .join('text')
      .attr('x', d => (x(d[1]) + x(d[2])) / 2)
      .attr('y', (d, i) => i * (barHeight + barBuffer) + barHeight/2)
      .attr('dominant-baseline', 'middle')
      .attr('text-anchor', 'middle')
      .text((d, i) => i > 0 ? d[4].toFixed(1) : '');

  chart.selectAll('g.axis')
      .call(percentileAxis)
      .selectAll('g.tick')
      .each(function(d, i) {
        if (d > 90.1) {
          var extraHeight = 5;
          var xShift = (i + 1 - percentiles.length) * 25;
            //(i - 2) *
              //        25).toString();  // this kludge will fail hopelessly
        // if I ever change the percentiles
          var line = d3.select(this).select('line');
          var y2 = line.attr('y2');
          line.attr('y2', (parseInt(y2) + extraHeight))
              .attr('x2', xShift);
          d3.select(this).select('text').attr(
              'transform',
              'translate(' + xShift + ', ' + extraHeight.toString() + ')');
        }
      });
}

function toggle() {
  displayData = dataBase[upNext];
  if (upNext === '2014') {
    upNext = '1980';
  } else {
    upNext = '2014';
  }
  display(displayData);
}

function setYear() {
  var year = document.getElementById('foo').value;
  if (dataBase[year] != null) {
    display(dataBase[year]);
  }
}

display(displayData);
