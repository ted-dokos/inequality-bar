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
 * Add visual elements for entering percentile data objects: colored rectangles
 * of the corresponding size, and the size itself as text (only for countries,
 * not for percent bars).
 * @enter is a d3 selection of <g class="bar"> elements, each bound to a
 * percentile data object (as described in the output of makePercentiles).
 * @x is a d3 scale object, used to determine the positions of elements.
 * @barHeight is a number that determines the height of the displayed bars.
 */
function percentBarEnterFn(enter, x, barHeight) {
  let hasData = function(percentileDataOrNull) {
    return percentileDataOrNull !== null;
  };

  let percentileColors = {
    '0-50': 'lightgreen',
    '50-90': 'darkgreen',
    '0-90': 'lightgreen',
    '90-99': '#5599dd',
    '99-99.9': 'darkorange',
    '99-100': 'darkorange',
    '99.9-100': '#cc4444',
  };

  let g = enter.append('g').attr('class', 'bar');
  g.append('rect')
  .attr(
          'x',
          percentileData => hasData(percentileData) ?
            x(percentileData['sizeLower']) :
            x(0.0))
      .attr('y', 0)
      .style(
          'fill',
          pd => hasData(pd) ?
            percentileColors[pd['lower'] + '-' + pd['upper']] :
            'white')
      .style('stroke', pd => hasData(pd) ? '' : 'black')
      .attr('height', barHeight)
      .attr(
          'width',
          pd => hasData(pd) ? x(pd['sizeUpper']) - x(pd['sizeLower']) :
            x(1.0) - x(0.0));
  // Add text to each percentile bar, except for the axis reference.
  g.append('text')
      .filter(pd => pd === null || !pd['country'].startsWith('percentBar'))
      .attr('class', 'barSize')
      .attr(
          'x',
          pd => {
            if (hasData(pd)) {
              return (x(pd['sizeLower']) + x(pd['sizeUpper'])) / 2;
            } else {
              return (x(0.0) + x(1.0)) / 2;
            }
          })
      .attr('y', barHeight / 2)
      .attr('dominant-baseline', 'middle')
      .attr('text-anchor', 'middle')
      .text(pd => hasData(pd) ? (pd['size'] * 100).toFixed(1) : 'NO DATA');
}

/**
 * Retrieve an array of percentile data objects for a specified country, or
 * [null] if the country is not present in the data.
 * @country is simply a string representing the country.
 * @data is a dictionary of the form
 * { country_1: [ pd_{1,1}, pd_{1,2}, ... ],
 *   ...
 * }
 * where each pd_{i,j} is a percentile data object (as described in the output
 * of makePercentiles).
 */
function countryDataFn(country, desiredPercentiles, data) {
  if (country.startsWith('percentBar')) {
    return getPercentilesForPercentBar(country);
  }
  if (!data.hasOwnProperty(country) ||
      data[country] === null || data[country].length === 0) {
    return [null];
  }
  let maybeUsableData = data[country].filter(
      pd => desiredPercentiles.has(pd['lower'] + '-' + pd['upper']));
  if (maybeUsableData.length === desiredPercentiles.size) {
    return maybeUsableData;
  }
  return [null];
}

/**
 * Return key data for a percentile data object pd. The important visual factors
 * for a percentile data object are its percentile band (determines color), left
 * side coordinate (sizeLower), right side coordinate (sizeUpper), and its size
 * (size) for text display. The latter is implicitly determined by sizeLower and
 * sizeUpper, so we key only on those two.
 * @pd is either null, or a percentile data object (as described in the output of
 * makePercentiles).
 * @output is a key that uniquely determines pd's visual representation.
 */
function percentileDataKeyFn(pd) {
  if (pd === null) {
    return null;
  }
  return [pd['lower'], // lower and upper determine color.
          pd['upper'],
          pd['sizeLower'].toFixed(20),
          pd['sizeUpper'].toFixed(20)]
      .join('|');
}
/**
 * @data is a database of inequality measurements for various countries, indexed
 * by year. It is formatted as follows:
 * {
 *   type: The type of inequality measured (income or wealth),
 *   year: Inequality data for the year in question, formatted as in the output
 *         of makePercentiles,
 *   ...
 * },
 * where the year field is repeated ('1900', '1901', etc).
 * @selectedCountries is a list of countries to display. It's expected that the
 * first element is a percentile string as described in the input to
 * getPercentilesForPercentBar.
 */
function display(year,
                 data,
                 selectedCountries,
                 chart,
                 chartSpec) {
  let useInterpolation = true;
  let inequalityType = data['type'];
  let dataOneYear = data[year];
  let x = d3.scaleLinear()
      .range([chartSpec.chartWidth * 0.02,
              chartSpec.chartWidth * 0.98])
      .domain([0, 1.0]);
  // Expect that selectedCountries[0] is a percentile string.
  let percentileStr = selectedCountries[0];
  let percentiles = percentileStr.split('-').slice(1)
      .map(s => parseFloat(s) / 100);

  let percentileAxis =
      d3.axisBottom().scale(x).tickValues(percentiles).tickFormat(d => {
        if (d < 1.0) {
          return (d * 100).toFixed(1);
        } else {
          return '100';
        }
      });

  chart.selectAll('text.year')
      .data([year])
      .join('text')
      .attr('x', chartSpec.chartWidth / 2)
      .attr('y', yShift / 2)
      .attr('class', 'year')
      .attr('dominant-baseline', 'middle')
      .attr('text-anchor', 'middle')
      .text(d => inequalityType + ' inequality in ' + d);

  let countries =
      chart.selectAll('g.country')
          .data(selectedCountries)
          .join('g')
          .attr('class', 'country')
          .attr('id', country => country)
          .attr(
              'transform',
              (d, i) => {
                return 'translate(0, ' +
                    (yShift +
                     i * (chartSpec.barHeight + chartSpec.barBuffer)).toString() +
                    ')'});

  let desiredPercentiles = computeDesiredPercentiles(percentileStr);

  countries.selectAll('g.bar')
      .data(c => countryDataFn(c, desiredPercentiles, dataOneYear),
            percentileDataKeyFn)
      .join(enter => percentBarEnterFn(enter, x, chartSpec.barHeight));

  // Add country names to the chart.
  countries
      .selectAll('g.country text.countryName')
      .data(country => [country])
      .join('text')
      .attr('class', 'countryName')
      .attr('x', x(0))
      .attr('y', -5)
      .text(c => {
        if (c.startsWith('percentBar')) {
          return 'Country population, from least income to most income';
        }
        return c;
      });

  // Update the axis.
  chart.selectAll('g.axis')
      .call(percentileAxis)
      .selectAll('g.tick')
      .each(function(d, i) {
        if (d > 0.901) {
          var extraHeight = 5;
          var xShift = (i + 1 - percentiles.length) * 25;
          //(i - 2) *
          //        25).toString();  // this kludge will fail hopelessly
          // if I ever change the percentiles
          var line = d3.select(this).select('line');
          var y2 = line.attr('y2');
          line.attr('y2', (parseInt(y2) + extraHeight)).attr('x2', xShift);
          d3.select(this).select('text').attr(
              'transform',
              'translate(' + xShift + ', ' + extraHeight.toString() + ')');
        }
      });
}

if ( typeof module !== 'undefined' && module.hasOwnProperty('exports') )
{
  module.exports = {
    'countryDataFn': countryDataFn,
    'percentBarEnterFn': percentBarEnterFn,
    'percentileDataKeyFn': percentileDataKeyFn,
  };
}
