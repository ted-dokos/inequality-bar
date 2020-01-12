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

/**
 * Given an ordered list of percentiles @percentileList, and a list of countries
 * with bin sizes for these percentile bands @countryList, create an array for
 * each 'bin', i.e. each pair of consecutive percentiles. Each bin object has
 * the following format:
 * { lower: the lower percentile,
 *   upper: the upper percentile,
 *   countries: a map keyed by countries with the value format
 *              { size: size of the percentile's share in this country,
 *                lower: the lower (percentile) bound of the share,
 *                upper: the upper (percentile) bound of the share }
 * }
 */
function makePercentiles(percentileList, countryList) {
  var out = [];
  // var assertions = percentileList.length == country1sizeList.length + 1 &&
  //     country1sizeList.length == country2sizeList.length &&
  //     percentileList[0] == 0 &&
  //     percentileList[percentileList.length - 1] == 100 &&
  //     country1sizeList.reduce((a, b) => a + b, 0) == 100.0 &&
  //     country2sizeList.reduce((a, b) => a + b, 0) == 100.0;
  // if (!assertions) {
  //   return { error: 'makePercentiles assertions failed' };
  // }

  var countryBins = {};
  countryList.forEach(function(country) {
    countryBins[country.name] = [0.0];
    if (country.bins === null) {
      countryBins[country.name] = null;
    } else {
      country.bins.forEach(function(size) {
        var last =
            countryBins[country.name][countryBins[country.name].length - 1];
        countryBins[country.name].push(last + size);
      });
    }
  });

  for (i = 0; i < percentileList.length - 1; i++) {
    var next = {
      lower: percentileList[i],
      upper: percentileList[i + 1],
      countries: {}
    };
    countryList.forEach(function(country) {
      if (country.bins === null) {
        next.countries[country.name] = null;
      } else {
        next.countries[country.name] = {
          size: country.bins[i]*100,
          lower: countryBins[country.name][i]*100,
          upper: countryBins[country.name][i + 1]*100,
        };
      }
    });
    out.push(next);
  }
  return out;
}
