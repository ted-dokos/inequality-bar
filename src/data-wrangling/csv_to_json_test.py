from csv_to_json import compute_implicit_ranges
from itertools import permutations

def test_compute_implicit_ranges():
  tolerance = 0.0000001
  def contains_approx(rangedata, lower, upper, size):
    justthestrings = [pd[0] for pd in rangedata]
    ps = 'p' + lower + 'p' + upper
    if ps in justthestrings:
      actualsize = float(rangedata[justthestrings.index(ps)][1])
      return abs(actualsize - size) < tolerance
    return False

  data = [ ('p0p50', '0.3') ]
  rangedata = compute_implicit_ranges(data)

  assert len(rangedata) == 3
  assert contains_approx(rangedata,  '0',  '50', 0.3)
  assert contains_approx(rangedata,  '0', '100', 1.0)
  assert contains_approx(rangedata, '50', '100', 0.7)

  data = [ ('p50p100', '0.7') ]
  rangedata = compute_implicit_ranges(data)

  assert len(rangedata) == 3
  assert contains_approx(rangedata,  '0',  '50', 0.3)
  assert contains_approx(rangedata,  '0', '100', 1.0)
  assert contains_approx(rangedata, '50', '100', 0.7)

  # Test all possible orderings of this case with the p99p99.9 percentile
  # missing. We should be able to compute its value, and return the same 10 data
  # regardless of order.
  data = [ ('p0p90', '0.6'),
           ('p90p99', '0.2'),
           ('p99p99.9', ''),
           ('p99.9p100', '0.08')]
  for d in permutations(data):
    rangedata = compute_implicit_ranges(list(d))
    assert len(rangedata) == 10
    assert contains_approx(rangedata,    '0',   '90', 0.6)
    assert contains_approx(rangedata,    '0',   '99', 0.8)
    assert contains_approx(rangedata,    '0', '99.9', 0.92)
    assert contains_approx(rangedata,    '0',  '100', 1.0)
    assert contains_approx(rangedata,   '90',   '99', 0.2)
    assert contains_approx(rangedata,   '90', '99.9', 0.32)
    assert contains_approx(rangedata,   '90',  '100', 0.4)
    # Repaired case:
    assert contains_approx(rangedata,   '99', '99.9', 0.12)

    assert contains_approx(rangedata,   '99',  '100', 0.2)
    assert contains_approx(rangedata, '99.9',  '100', 0.08)

  # Regression test: this data triggered an error in an earlier iteration of my
  # code.
  data = [ ('p0p90', '0.6'),
           ('p90p99', '0.2'),
           ('p99p99.9', '0.12'),
           ('p99.9p100', ''),
           ('p99p100', ''),
  ]
  rangedata = compute_implicit_ranges(data)
  assert len(rangedata) == 10
  assert contains_approx(rangedata,    '0',   '90', 0.6)
  assert contains_approx(rangedata,    '0',   '99', 0.8)
  assert contains_approx(rangedata,    '0', '99.9', 0.92)
  assert contains_approx(rangedata,    '0',  '100', 1.0)
  assert contains_approx(rangedata,   '90',   '99', 0.2)
  assert contains_approx(rangedata,   '90', '99.9', 0.32)
  assert contains_approx(rangedata,   '90',  '100', 0.4)
  assert contains_approx(rangedata,   '99', '99.9', 0.12)
  assert contains_approx(rangedata,   '99',  '100', 0.2)
  assert contains_approx(rangedata, '99.9',  '100', 0.08)


if __name__ == '__main__':
  test_compute_implicit_ranges()

  print("All tests pass successfully!")
