export function getTestCredentials() {
  const email = process.env.TEST_EMAIL ?? "functional_tests@nipravimail.com";
  const password = process.env.TEST_PASSWORD;

  if (!password) {
    throw new Error(
      "TEST_PASSWORD is not set. Add it to testing/.env (see testing/.env.example)."
    );
  }

  return { email, password };
}
