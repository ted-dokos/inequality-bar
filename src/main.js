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

var selectedCountries = ['percentBar-0-90-99-99.9-100',
                         'USA',
                         'France',
                         'Sweden',];
var debug = true;

var dataBase = {};

var dataPromise = fetch('src/income-data.json')
    .then(response => response.json())
    .then(function(data) {
      if (debug) {
        console.log(data);
      }
      return new Promise(resolve => {
        let db = {};
        Object.keys(data).forEach(
            year => { db[year] = makePercentiles(data[year]); });
        resolve(db);
      });
    });

var upNext = '2014';

var chartSpec = {
  chartWidth: 1000,
  chartHeight: 1000,
  barHeight: 30,
  barBuffer: 40,
};

var yShift = chartSpec.chartHeight * 0.10;

var chart;

var inequalityType = 'Income';

function toggle() {
  setYear(upNext)
  display(upNext, inequalityType, dataBase[upNext], selectedCountries, chart,
          chartSpec);
  if (upNext === '2014') {
    upNext = '1980';
  } else {
    upNext = '2014';
  }
}

function setYear(y = undefined) {
  let year = y === undefined ? document.getElementById('foo').value : y;
  document.getElementById('foo').value = year;
  if (dataBase[year] != null) {
    display(year, inequalityType, dataBase[year], selectedCountries, chart,
            chartSpec);
    let slider = document.getElementById('slider');
    slider.value = year;
  }
}

async function main() {
  dataBase = await dataPromise;
  if (debug) {
    console.log(dataBase);
  }

  chart =
      d3.select('.chart')
      .attr('width', chartSpec.chartWidth)
      .attr('height', chartSpec.chartHeight);
  chart.append('g')
      .attr('class', 'axis')
      .attr('transform',
            'translate(0, ' + (chartSpec.barHeight + yShift).toString() + ')');

  display('1980', inequalityType, dataBase['1980'], selectedCountries, chart,
          chartSpec);

  var yearBox = document.getElementById('foo');
  yearBox.value = '1980';
  var slider = document.getElementById('slider');
  slider.value = '1980';
  slider.oninput = function() {
    yearBox.value = this.value;
    display(this.value, inequalityType, dataBase[this.value], selectedCountries,
            chart, chartSpec);
  };
}
