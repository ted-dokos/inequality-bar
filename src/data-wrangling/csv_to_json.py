# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from collections import defaultdict
import csv
import json

def process_column_names(names):
  out = names[:]
  assert (out[0] == 'Percentile')
  assert (out[1] == 'Year')
  for i, n in enumerate(out):
    out[i] = n.split('\n')[-1]
  return out


with open('wid-data.csv', newline='') as widdata:
  datareader = csv.reader(widdata, delimiter=';', quotechar='"')
  ## Skip the header
  next(datareader)
  ## Strip additional data out of the country names
  colnames = process_column_names(next(datareader))

  percentiles = set()
  databyyear = defaultdict(lambda: defaultdict(list))
  for row in datareader:
    percentile = row[0]
    percentiles.add(percentile)
    year = row[1]
    for i, binsize in enumerate(row[2:], start=2):
      country = colnames[i]
      databyyear[year][country].append((percentile, binsize))

  # 1. None-ify any trivial country-years.
  # 2. Repair country-years that have one missing entry (100 - rest)
  # 3. None-ify any non-repairable country-years.
  for year in databyyear:
    countriesbyyear = databyyear[year]
    for country in countriesbyyear:
      assert (len(countriesbyyear[country]) > 0)
      if all([x[1] == '' for x in countriesbyyear[country]]):
        countriesbyyear[country] = None
      elif sum([x[1] == '' for x in countriesbyyear[country]]) == 1:
        otherstotal = 0.0
        missingindex = -1
        for i, x in enumerate(countriesbyyear[country]):
          if x[1] == '':
            missingindex = i
          else:
            otherstotal += float(x[1])
        countriesbyyear[country][missingindex] = (
            countriesbyyear[country][missingindex][0], 1.0 - otherstotal)
      elif any([x[1] == '' for x in countriesbyyear[country]]):
        countriesbyyear[country] = None

print(json.dumps(databyyear))
