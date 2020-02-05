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

function percentBarEnterFn(enter) {
  let g = enter.append('g').attr('class', 'bar');
  g.append('rect');
  g.append('text');

  let hasData = function(percentileDataOrNull) {
    return percentileDataOrNull !== null;
  };

  enter.selectAll('g.bar rect')
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
  enter.filter(pd => pd === null || !pd['country'].startsWith('percentBar'))
      .selectAll('g.bar text')
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

  let countryDataFn = function(country, i) {
    if (country.startsWith('percentBar')) {
      return getPercentilesForPercentBar(country);
    } else {
      let noData =
          (!dataOneYear.hasOwnProperty(country) ||
           dataOneYear[country] === null || dataOneYear[country] === []);
      return noData ? [null] : dataOneYear[country];
    }
  };

  countries.selectAll('g.bar')
      .data(
          c => countryDataFn(c),
          pd => pd === null ? null :
                              pd['sizeLower'].toFixed(20) +
                  pd['sizeUpper'].toFixed(20) + pd['size'].toFixed(20))
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
