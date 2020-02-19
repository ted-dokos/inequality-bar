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
import sys


def process_column_names(names):
  out = names[:]
  assert (out[0] == 'Percentile')
  assert (out[1] == 'Year')
  for i, n in enumerate(out):
    out[i] = n.split('\n')[-1]
  return out


def get_year_country_data(colnames, csvreader):
  """Consume CSVREADER and construct a dictionary of percentile data
(percentilestr, sizestr), keyed by (year, country). COLNAMES provides the
country names.
  """
  assert (colnames[0] == 'Percentile')
  assert (colnames[1] == 'Year')
  data = defaultdict(list)
  for row in csvreader:
    percentile = row[0]
    year = row[1]
    for i in range(2, len(row)):
      country = colnames[i]
      binsize = row[i]
      data[(year, country)].append( (percentile, binsize) )
  return data

def compute_implicit_ranges(percentiledata):
  """Given an input list PERCENTILEDATA (with elements structured as
  (percentilestr, sizestr)), return a similar list of percentile data, with
  blank elements removed, and implicit ranges added. An example is helpful:
  given the percentiles ('p0p90', '0.6'), ('p0p50', '0.3'), and ('p90p100',
  '0.4'), there are two implicit ranges we can determine: ('p50p90', '0.3') and
  ('p50p100', 0.7).
  """
  # Treat this as a weighted graph traversal problem.
  g = defaultdict(dict)
  def make_edge(v1, v2, wstr):
    g[v1][v2] = wstr
    g[v2][v1] = '-' + wstr
  make_edge('0', '100', '1.0')

  for percentilestr, size in percentiledata:
    if size == '':
      continue
    split = percentilestr.split('p')
    lower = split[1]
    upper = split[2]
    make_edge(lower, upper, size)

  # Only traverse the connected component containing 0, I don't care about the
  # rest. For each vertex 'peek', calculate the weight of the path from 0 to
  # peek, and add that as an edge from 0 to peek (as well as the complement
  # weight from peek to 100).
  processed = set(['0'])
  toprocess = list(g['0'].keys())
  path = ['0', toprocess[-1]]
  pathset = set(path)
  def sumpath(path):
    return sum(map(lambda e: float(g[e[0]][e[1]]), \
                   zip(path, path[1:])))

  while len(toprocess) > 0:
    current = toprocess[-1]
    # Invariant: at the beginning of the loop, current is the last element of
    # path and toprocess.
    nextneighbors = list(
        filter(lambda v: v not in processed and v not in pathset,
               g[current].keys()))
    if len(nextneighbors) == 0:
      # Leaf case.
      if current not in g['0']:
        make_edge('0', current, str(sumpath(path)))
      processed.add(current)
      pathset.remove(current)
      path.pop()
      toprocess.pop()
      # Handle the case when the parent on the path has more children. We must
      # update the path to land on the next child.
      if len(toprocess) > 0 and toprocess[-1] != path[-1]:
        path.append(toprocess[-1])
        pathset.add(toprocess[-1])
    else:
      toprocess.extend(nextneighbors)
      path.append(toprocess[-1])
      pathset.add(toprocess[-1])

  # Now compute edges from v1 to v2 using the edges to 0, when possible.
  for v1 in g.keys():
    for v2 in g.keys():
      if v1 == v2 or v1 == '0' or v2 == '0':
        continue
      if '0' not in g[v1] or '0' not in g[v2]:
        continue
      if v2 not in g[v1]:
        g[v1][v2] = str(float(g['0'][v2]) - float(g['0'][v1]))
      if v1 not in g[v2]:
        g[v2][v1] = str(float(g['0'][v1]) - float(g['0'][v2]))

  # Format output, positive weight edges only (which should correspond exactly
  # to pXpY, where X < Y).
  rangedata = []
  for v1 in g.keys():
    for v2 in g[v1].keys():
      if float(g[v1][v2]) < 0:
        continue
      rangedata.append(('p' + v1 + 'p' + v2, g[v1][v2]))
  return rangedata


def is_range_of_interest(percentiledatum):
  is_range_of_interest.interestingranges = set([
      'p0p50',
      'p0p90',
      'p50p90',
      'p90p99',
      'p90p100',
      'p99p99.9',
      'p99p100',
      'p99.9p100',
      ])
  return percentiledatum[0] in is_range_of_interest.interestingranges


if __name__ == '__main__':
  with open(sys.argv[1], newline='') as widdata:
    datareader = csv.reader(widdata, delimiter=';', quotechar='"')
    ## Skip the header
    next(datareader)
    ## Strip additional data out of the country names
    colnames = process_column_names(next(datareader))

    ycdata = get_year_country_data(colnames, datareader)
    databyyear = defaultdict(lambda: defaultdict(list))

    for (year, country), percentiledata in ycdata.items():
      rd = compute_implicit_ranges(percentiledata)
      rdfiltered = list(filter(is_range_of_interest, rd))
      if len(rdfiltered) > 0:
        databyyear[year][country] = rdfiltered

  print(json.dumps(databyyear))
