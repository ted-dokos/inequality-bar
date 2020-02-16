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
  g['0']['100'] = '1.0'
  g['100']['0'] = '-1.0'

  for percentilestr, size in percentiledata:
    if size == '':
      continue
    split = percentilestr.split('p')
    lower = split[1]
    upper = split[2]
    g[lower][upper] = size
    g[upper][lower] = str(-1 * float(size))

  # Only traverse the connected component containing 0, I don't care about the
  # rest. For each vertex 'peek', calculate the weight of the path from 0 to
  # peek, and add that as an edge from 0 to peek (as well as the complement
  # weight from peek to 100).
  explored = set()
  explored.add('0')
  stack = list(g['0'].keys())
  path = ['0']
  def sumpath(path):
    return sum(map(lambda e: float(g[e[0]][e[1]]), \
                   zip(path, path[1:])))

  while len(stack) > 0:
    peek = stack[-1]
    path.append(peek)

    if peek in explored:
      stack.pop()
      path.pop()
      continue

    if '0' not in g[peek]:
      sp = sumpath(path)
      g[peek]['0'] = str(-sp)
      g['0'][peek] = str(sp)
      g[peek]['100'] = str(1.0 - sp)
      g['100'][peek] = str(sp - 1.0)
    explored.add(peek)
    stack.extend(list(g[peek].keys()))

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



def compute_implicit_ranges2(percentiledata):
  """Given an input list PERCENTILEDATA (with elements structured as
  (percentilestr, sizestr)), return a similar list of percentile data, with
  blank elements removed, and implicit ranges added. An example is helpful:
  given the percentiles ('p0p90', '0.6'), ('p0p50', '0.3'), and ('p90p100',
  '0.4'), there are two implicit ranges we can determine: ('p50p90', '0.3') and
  ('p50p100', 0.7).
  """
  def add(lower, upper, size):
    percents.add(lower)
    percents.add(upper)

    rangedata[(lower, upper)] = size
    for p in percents:
      if p == lower or p == upper:
        continue

      if float(p) > float(upper):
        large = (lower, p)
        if large in rangedata:
          rangedata[(upper, p)] = str(float(rangedata[large]) - float(size))
        small = (upper, p)
        if small in rangedata:
          rangedata[(lower, p)] = str(float(size) + float(rangedata[small]))

      if float(p) < float(lower):
        large = (p, upper)
        if large in rangedata:
          rangedata[(p, lower)] = str(float(rangedata[large]) - float(size))
        small = (p, lower)
        if small in rangedata:
          rangedata[(p, upper)] = str(float(rangedata[small]) + float(size))

      if float(lower) < float(p) < float(upper):
        midleft = (lower, p)
        midright = (p, upper)
        if midleft in rangedata:
          rangedata[midright] = str(float(size) - float(rangedata[midleft]))
        if midright in rangedata:
          rangedata[midleft] = str(float(size) - float(rangedata[midright]))


  rangedata = dict()
  percents = set()
  add('0', '100', '1.0')

  for percentile, size in percentiledata:
    if size == '':
      continue
    split = percentile.split('p')
    lower = split[1]
    upper = split[2]


    add(lower, upper, size)

    # if lower == '0' and upper != '100':
    #   complement = 'p' + upper + 'p100'
    #   rangedata[complement] = str(1 - float(size))

    # if upper == '100' and lower != '0':
    #   complement = 'p0p' + lower
    #   rangedata[complement] = str(1 - float(size))

    # if lower !='0' and upper != '100':
    #   complementleft = 'p0p'+lower
    #   complementright = 'p' + upper + 'p100'
    #   if complementleft in rangedata and complementright not in rangedata:
    #     rangedata[complementright] = str(1 - float(size) - float(rangedata[complementleft]))
    #   if complementright in rangedata and complementleft not in rangedata:
    #     rangedata[complementleft] = str(1 - float(size) - float(rangedata[complementright]))
  return rangedata

if __name__ == '__main__':
  with open('wid-data.csv', newline='') as widdata:
    datareader = csv.reader(widdata, delimiter=';', quotechar='"')
    ## Skip the header
    next(datareader)
    ## Strip additional data out of the country names
    colnames = process_column_names(next(datareader))

    ycdata = get_year_country_data(colnames, datareader)
    databyyear = defaultdict(lambda: defaultdict(list))

    for (year, country), percentiledata in ycdata.items():
      #print(len(compute_implicit_ranges(percentiledata)))
      break
    #databyyear[year][country] = compute_implicit_ranges(percentiledata)

    # percentiles = set()
    # databyyear = defaultdict(lambda: defaultdict(list))
    # for row in datareader:
    #   percentile = row[0]
    #   percentiles.add(percentile)
    #   year = row[1]
    #   for i, binsize in enumerate(row[2:], start=2):
    #     country = colnames[i]
    #     databyyear[year][country].append((percentile, binsize))

    # # 1. None-ify any trivial country-years.
    # # 2. Repair country-years that have one missing entry (100 - rest)
    # # 3. None-ify any non-repairable country-years.
    # for year in databyyear:
    #   countriesbyyear = databyyear[year]
    #   for country in countriesbyyear:
    #     assert (len(countriesbyyear[country]) > 0)
    #     if all([x[1] == '' for x in countriesbyyear[country]]):
    #       countriesbyyear[country] = None
    #     elif sum([x[1] == '' for x in countriesbyyear[country]]) == 1:
    #       otherstotal = 0.0
    #       missingindex = -1
    #       for i, x in enumerate(countriesbyyear[country]):
    #         if x[1] == '':
    #           missingindex = i
    #         else:
    #           otherstotal += float(x[1])
    #       countriesbyyear[country][missingindex] = (
    #           countriesbyyear[country][missingindex][0], 1.0 - otherstotal)
    #     elif any([x[1] == '' for x in countriesbyyear[country]]):
    #       countriesbyyear[country] = None

  print(json.dumps(databyyear))
