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
 * Given an ordered list of percentiles @percentileList, and a dictionary of countries
 * with bin sizes for these percentile bands @countryList, return a dictionary of
 * countries with a list of 'bins', i.e. each pair of consecutive percentiles.
 * @countryList has the following format:
 * { countryName: [ [pLpU, size_as_str ], ... ],
 *   ...
 * }
 * where L and U are the lower and upper bounds on the percentile, as strings
 * (e.g. '0' and '90').
 * The output has the following format:
 * { countryName: [
 *     { lower: the lower percentile as a string,
 *       upper: the upper percentile as a string,
 *       size: size of the percentile's share in this country as a float,
 *       sizeLower: the lower bound of the share for plotting on a bar chart,
 *       sizeUpper: the upper bound of the share for plotting on a bar chart,
 *     },
 *     ... ],
 *   ...
 * }
 */
function makePercentiles(percentileList, countryList) {
  var out = {};

  Object.keys(countryList).forEach(function(countryName) {
    // Process each percent band, but do it in lexicographic order. This ensures
    // that we can get subsequent lower and upper bounds. (i.e. process p0p90
    // before p90p99, etc).
    var percentBounds = { '0': 0.0 };
    var sizes = countryList[countryName];
    if (sizes === null) {
      return;
    }
    sizes.sort(function (a, b) {
      // these should look like ['', L, U]:
      var p_a = a[0].split('p');
      var p_b = b[0].split('p');

      if (p_a[1] != p_b[1]) {
        return parseFloat(p_a[1]) - parseFloat(p_b[1]);
      }
      return parseFloat(p_a[2]) - parseFloat(p_b[2]);
    });
    var countryOut = [];
    sizes.forEach(function (percentileSizePair) {
      var percentile = percentileSizePair[0].split('p');
      var size = parseFloat(percentileSizePair[1]);
      var lower = percentile[1];
      var upper = percentile[2];
      if (!percentBounds.hasOwnProperty(lower)) {
        console.error('Lower percent bound of %s missing from percentBounds.', lower);
      }
      var upperBound = percentBounds[lower] + size;
      // Ensure data consistency if this one's already been handled.
      var consistencyThreshold = 0.01 / 100; // 0.01 percent
      if (percentBounds.hasOwnProperty(upper) && Math.abs((upperBound - percentBounds[upper]) / upperBound) > consistencyThreshold) {
        console.error('Data inconsistency: calculated percentile bound of %s at percentile %s, but was already calculated as %s', upperBound, upper, percentBounds[upper]);
      }
      percentBounds[upper] = upperBound;
      countryOut.push({
        'lower': lower,
        'upper': upper,
        'size': size,
        'sizeLower': percentBounds[lower],
        'sizeUpper': percentBounds[upper],
      });
    });
    out[countryName] = countryOut;
  });
  return out;


  //   countryBins[country.name] = [0.0];
  //   if (country.bins === null) {
  //     countryBins[country.name] = null;
  //   } else {
  //     country.bins.forEach(function(size) {
  //       var last =
  //           countryBins[country.name][countryBins[country.name].length - 1];
  //       countryBins[country.name].push(last + size);
  //     });
  //   }
  // });

  // for (i = 0; i < percentileList.length - 1; i++) {
  //   var next = {
  //     lower: percentileList[i],
  //     upper: percentileList[i + 1],
  //     countries: {}
  //   };
  //   countryList.forEach(function(country) {
  //     if (country.bins === null) {
  //       next.countries[country.name] = null;
  //     } else {
  //       next.countries[country.name] = {
  //         size: country.bins[i]*100,
  //         lower: countryBins[country.name][i]*100,
  //         upper: countryBins[country.name][i + 1]*100,
  //       };
  //     }
  //   });
  //   out.push(next);
  // }
  // return out;
}
