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
 */
function percentBarEnterFn(enter) {
  let hasData = function(percentileDataOrNull) {
    return percentileDataOrNull !== null;
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
      .attr('height', chartSpec.barHeight)
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
      .attr('y', chartSpec.barHeight / 2)
      .attr('dominant-baseline', 'middle')
      .attr('text-anchor', 'middle')
      .text(pd => hasData(pd) ? (pd['size'] * 100).toFixed(1) : 'NO DATA');
}

/**
 * Retrieve an array of percentile data objects for a specified country, or
 * [null] if the country is not present in the data.
 * @country is simply a string representing the country.
 * @data is a dictionary of the form
 * { country_1: [ pd_1, ... ],
 *   ...
 * }
 * where each pd_i is a percentile data object (as described in the output of
 * makePercentiles).
 */
function countryDataFn(country, data) {
  if (country.startsWith('percentBar')) {
    return getPercentilesForPercentBar(country);
  } else {
    let noData =
        (!data.hasOwnProperty(country) ||
         data[country] === null || data[country].length === 0);
    return noData ? [null] : data[country];
  }
}

/**
 * Return key data for a percentile data object pd. The important visual factors
 * for a percentile data object are its percentile band (determines color), left
 * side coordinate (sizeLower), right side coordinate (sizeUpper), and its size
 * (size) for text display. The latter is implicitly determined by sizeLower and
 * sizeUpper, two, so we key only on those two.
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

function display(year, dataOneYear, selectedCountries, chart, chartSpec) {
  chart.selectAll('text.year')
      .data([year])
      .join('text')
      .attr('x', chartSpec.chartWidth / 2)
      .attr('y', yShift / 2)
      .attr('class', 'year')
      .attr('dominant-baseline', 'middle')
      .attr('text-anchor', 'middle')
      .text(d => d);

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

  countries.selectAll('g.bar')
      .data(c => countryDataFn(c, dataOneYear), percentileDataKeyFn)
      .join(percentBarEnterFn);

  // Add country names to the chart.
  countries.filter(c => !c.startsWith('percentBar'))
      .selectAll('g.country text.countryName')
      .data(country => [country])
      .join('text')
      .attr('class', 'countryName')
      .attr('x', x(0))
      .attr('y', -5)
      .text(c => c);

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
    'percentileDataKeyFn': percentileDataKeyFn,
  };
}
