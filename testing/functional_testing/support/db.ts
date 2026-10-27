import { readFile } from "node:fs/promises";
import { Client } from "pg";

import { PURGE_FILE, SEED_FILE } from "./paths";

export const TEST_EMAIL = process.env.TEST_EMAIL ?? "functional_tests@nipravimail.com";

async function withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({
    connectionString:
      process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/appdb",
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

/** Removes all application data (testing/purge.sql); categories stay. */
export async function purgeDatabase() {
  const sql = await readFile(PURGE_FILE, "utf8");
  await withClient((client) => client.query(sql));
}

/** Loads seed/seed.sql: test user (admin, Light/English), "FT Seed Quiz" and its attempt. */
export async function applySeed() {
  const sql = await readFile(SEED_FILE, "utf8");
  await withClient((client) => client.query(sql));
}

export async function setPreferences({ theme, language }: { theme: number; language: number }) {
  await withClient((client) =>
    client.query('UPDATE quizio."User" SET theme = $1, language = $2 WHERE email = $3', [
      theme,
      language,
      TEST_EMAIL,
    ])
  );
}

export const resetPreferences = () => setPreferences({ theme: 0, language: 0 });

export async function getPreferences() {
  return withClient(async (client) => {
    const { rows } = await client.query(
      'SELECT theme, language FROM quizio."User" WHERE email = $1',
      [TEST_EMAIL]
    );
    return rows[0] as { theme: number; language: number };
  });
}

export type QuizRow = {
  id: number;
  title: string;
  description: string | null;
  category_id: number | null;
  time_limit_seconds: number;
  published: boolean;
};

export async function findQuizzes(title: string): Promise<QuizRow[]> {
  return withClient(async (client) => {
    const { rows } = await client.query(
      `SELECT id_quiz AS id, title, description, tk_category AS category_id,
              EXTRACT(EPOCH FROM time_limit)::int AS time_limit_seconds,
              publish_date IS NOT NULL AS published
         FROM quizio."Quiz" WHERE title = $1`,
      [title]
    );
    return rows;
  });
}

export async function countQuizzes(): Promise<number> {
  return withClient(async (client) => {
    const { rows } = await client.query('SELECT COUNT(*)::int AS n FROM quizio."Quiz"');
    return rows[0].n;
  });
}

export type StoredQuestion = { title: string; points: number; answers: string[]; correct: string[] };

export async function getQuestions(quizId: number): Promise<StoredQuestion[]> {
  return withClient(async (client) => {
    const questions = await client.query(
      'SELECT id_question AS id, title, value FROM quizio."Question" WHERE tk_quiz = $1 ORDER BY id_question',
      [quizId]
    );
    const result: StoredQuestion[] = [];
    for (const question of questions.rows) {
      const answers = await client.query(
        'SELECT title, is_correct FROM quizio."Answer" WHERE tk_question = $1 ORDER BY id_answer',
        [question.id]
      );
      result.push({
        title: question.title,
        points: question.value,
        answers: answers.rows.map((a) => a.title),
        correct: answers.rows.filter((a) => a.is_correct).map((a) => a.title),
      });
    }
    return result;
  });
}
