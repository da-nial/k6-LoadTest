# Load Testing with k6

This project performs simple unit load testing and scenario load testing on some example APIs using the k6 load testing
tool.

The full description of the project can be found in [instructions.pdf](docs/instructions.pdf)
and [report.pdf](docs/report.pdf), in Persian. Some background explanation about concepts such as load testing, stress
testing, checks and thresholds in k6 can also be found in the report.

## Tests

### 1-unit-test.js

A basic unit test that hits an endpoint and validates the response.

### 2-scenario.js

The scenarios simulate load on the [test-api.k6.io](https://test-api.k6.io) API. The script
uses [./users.json](users.json)
and [./crocos.json](crocos.json) for user credentials and crocodile data.

##### Thresholds

- http_req_failed: The rate of failed HTTP requests should be kept below 1%.
- http_req_duration: 95% of requests should complete within 1000ms (1 second).

#### Scenario 1

A gradual ramp-up of virtual users (VUs) is performed using the 'ramping-arrival-rate' executor. The
goal is to simulate increasing load on the target API over time.

1. Check Public Crocos: Verifies that the response status from the public crocodiles endpoint is 200 (OK).
2. Check Selected Croco: Ensures that the response status from a randomly selected crocodile's endpoint is 200 and that
   the response contains all expected crocodile fields.

#### Scenario 2

A fixed number of VUs (30) perform a specified number of iterations using the 'shared-iterations'
executor. The goal is to simulate a consistent load on the target API.

1. Check Login: Verifies that the login to the API was successful by checking the response status.
2. Check Create Crocos: Ensures that newly created crocodiles have a response status of 201 (Created) and that the
   response includes an assigned ID for each crocodile.

### Visualization

[Grafana](https://grafana.com/) was used to visualize the test results
with [k6 Grafana plugin](https://k6.io/docs/results-visualization/grafana-plugin/). Explanation of this step can be
found in the
report.

## Run

To run the tests:

```
k6 run 1-unit-test.js
k6 run 2-scenario.js
```

The test hits endpoints on https://test-api.k6.io:

- `/user/register/` - register
- `/auth/token/login/` - login
- `/my/crocodiles/` - private crocodile management
- `/my/crocodiles/{id}` - select a specific private crocodile
- `/public/crocodiles/` - browse public crocodiles
- `public/crocodiles/{id}` - select a specific public crocodile

## Course Information

- **Course**: Software Engineering II
- **University**: Amirkabir University of Technology
- **Semester**: Fall 2022

Let me know if you have any questions.
