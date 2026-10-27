// Load test of the authenticated quiz listing page (/quizzes).
//
//   npm run test:load   (loads testing/.env: BASE_URL, FIREBASE_API_KEY, TEST_EMAIL, TEST_PASSWORD)
//
// or manually:
//   k6 run \
//     -e BASE_URL=http://localhost:3000 \
//     -e FIREBASE_API_KEY=... \
//     -e TEST_PASSWORD=... \
//     load/quiz-listing.js
//
// TEST_EMAIL defaults to the seeded regular user. `npm run test:load` clears and
// re-seeds the database first; when running k6 manually, run `npm run seed` first.
import http from "k6/http";
import exec from "k6/execution";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const FIREBASE_API_KEY = __ENV.FIREBASE_API_KEY;
const TEST_EMAIL = __ENV.TEST_EMAIL || "functional_tests@nipravimail.com";
const TEST_PASSWORD = __ENV.TEST_PASSWORD;

export const options = {
  stages: [
    { duration: "30s", target: 50 }, // ramp-up
    { duration: "2m", target: 50 }, // steady load
    { duration: "15s", target: 0 }, // ramp-down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
    checks: ["rate>0.99"],
  },
};

// Runs once: Firebase sign-in -> idToken -> BFF session cookie shared by all VUs.
export function setup() {
  if (!FIREBASE_API_KEY || !TEST_PASSWORD) {
    exec.test.abort("FIREBASE_API_KEY and TEST_PASSWORD must be set");
  }

  const jsonHeaders = { headers: { "Content-Type": "application/json" } };

  const firebase = http.post(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      returnSecureToken: true,
    }),
    jsonHeaders,
  );
  const idToken = firebase.status === 200 ? firebase.json("idToken") : null;
  if (!idToken) {
    exec.test.abort(`Firebase sign-in failed (${firebase.status})`);
  }

  const session = http.post(
    `${BASE_URL}/api/session`,
    JSON.stringify({ idToken }),
    jsonHeaders,
  );
  const cookie = session.cookies.session && session.cookies.session[0];
  if (session.status !== 200 || !cookie) {
    exec.test.abort(`Session creation failed (${session.status})`);
  }

  return { sessionCookie: cookie.value };
}

export default function (data) {
  const res = http.get(`${BASE_URL}/quizzes`, {
    cookies: { session: data.sessionCookie },
    redirects: 0, // a redirect to /login means the session was rejected
    tags: { name: "GET /quizzes" },
  });

  check(res, {
    "status is 200": (r) => r.status === 200,
    "seeded quizzes rendered": (r) => r.body.includes("LT Quiz"),
  });

  sleep(1);
}
