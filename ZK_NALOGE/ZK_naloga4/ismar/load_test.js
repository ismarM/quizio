// Spike test; retained filename load_test.js as requested. Run locally only.
import http from 'k6/http';
import exec from 'k6/execution';
import { check, sleep } from 'k6';

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const SESSION = __ENV.QUIZIO_SESSION;
if (!/^http:\/\/(localhost|127\.0\.0\.1):3000$/.test(BASE_URL)) {
  throw new Error('BASE_URL must be the local Quizio on port 3000.');
}
if (!SESSION) throw new Error('Set QUIZIO_SESSION locally; do not commit it.');

const thresholds = {};
for (const phase of ['baseline', 'spike', 'recovery']) {
  thresholds[`http_req_duration{phase:${phase}}`] = [
    `p(95)<${phase === 'spike' ? 1000 : 500}`,
  ];
  thresholds[`http_req_failed{phase:${phase}}`] = ['rate<0.01'];
  thresholds[`checks{phase:${phase}}`] = ['rate==1'];
  thresholds[`http_reqs{phase:${phase}}`] = ['count>0'];
}

export const options = {
  scenarios: {
    categories_spike: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 1 },
        { duration: '1s', target: 20 },
        { duration: '30s', target: 20 },
        { duration: '1s', target: 1 },
        { duration: '30s', target: 1 },
      ],
      gracefulRampDown: '6s',
      gracefulStop: '6s',
    },
  },
  thresholds,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(95)'],
};

http.setResponseCallback(http.expectedStatuses(200));

function validCategories(response) {
  try {
    const data = response.json();
    return Array.isArray(data.categories) && data.categories.length > 0 &&
      data.categories.every((category) =>
        Number.isInteger(category.id) && typeof category.name === 'string' &&
        category.name.trim().length > 0);
  } catch {
    return false;
  }
}

function request(phase) {
  return http.get(`${BASE_URL}/api/proxy/categories`, {
    cookies: { session: SESSION },
    redirects: 0,
    timeout: '5s',
    tags: { name: 'GET /api/proxy/categories', phase },
  });
}

export function setup() {
  const response = request('preparation');
  if (response.status !== 200 || !validCategories(response)) {
    exec.test.abort(`Preparation failed (HTTP ${response.status}); check session and categories.`);
  }
}

export default function () {
  const seconds = exec.instance.currentTestRunDuration / 1000;
  const phase = seconds < 30 ? 'baseline'
    : seconds < 31 ? 'transition'
    : seconds < 61 ? 'spike'
    : seconds < 62 ? 'transition' : 'recovery';
  const response = request(phase);
  check(response, {
    'HTTP 200': (r) => r.status === 200,
    'valid nonempty categories': validCategories,
  }, { phase });
  sleep(1);
}
