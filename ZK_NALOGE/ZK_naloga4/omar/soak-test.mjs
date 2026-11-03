import autocannon from 'autocannon';
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..', '..', '..');
const evidenceDir = path.join(scriptDir, 'dokazila');
const targetUrl = new URL('http://localhost:3000/api/proxy/categories');

const config = Object.freeze({
  method: 'GET',
  warmupSeconds: 15,
  phaseSeconds: 120,
  phases: ['A', 'B', 'C'],
  connections: 5,
  pipelining: 1,
  overallRate: 10,
  timeoutSeconds: 10,
  dockerSampleSeconds: 15,
});

const thresholds = Object.freeze({
  maxFailureRate: 0.01,
  maxP95Ms: 1500,
  minRequestsPerSecond: 9,
  maxLateToEarlyP95Ratio: 1.5,
});

let interrupted = false;
let currentRun;

process.on('SIGINT', () => {
  if (interrupted) process.exit(130);
  interrupted = true;
  console.error('\nPrekinitev: zaključujem trenutno meritev in shranjujem delna dokazila.');
  currentRun?.stop();
});

function requireSession() {
  const raw = process.env.QUIZIO_SESSION?.trim();
  if (!raw) throw new Error('Manjka okoljska spremenljivka QUIZIO_SESSION.');
  const value = raw.startsWith('session=') ? raw.slice('session='.length) : raw;
  if (!value || /[;\r\n]/.test(value)) {
    throw new Error('QUIZIO_SESSION mora vsebovati samo vrednost piškotka session.');
  }
  return value;
}

function assertLocalTarget(url) {
  if (
    url.protocol !== 'http:' ||
    !['localhost', '127.0.0.1'].includes(url.hostname) ||
    url.port !== '3000' ||
    url.pathname !== '/api/proxy/categories' ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  ) {
    throw new Error('Varnostna omejitev dovoljuje samo GET http://localhost:3000/api/proxy/categories.');
  }
  if (config.method !== 'GET') throw new Error('Varnostna omejitev dovoljuje samo metodo GET.');
}

function validCategoriesBody(body) {
  try {
    const parsed = typeof body === 'string' ? JSON.parse(body) : body;
    return Boolean(
      parsed &&
      Array.isArray(parsed.categories) &&
      parsed.categories.length > 0 &&
      parsed.categories.every(
        (category) =>
          Number.isInteger(category?.id) &&
          typeof category?.name === 'string' &&
          category.name.trim().length > 0,
      )
    );
  } catch {
    return false;
  }
}

async function controlRequest(session, label) {
  const started = performance.now();
  const response = await fetch(targetUrl, {
    method: 'GET',
    headers: { Cookie: `session=${session}`, Accept: 'application/json' },
    redirect: 'manual',
    signal: AbortSignal.timeout(config.timeoutSeconds * 1000),
  });
  const body = await response.text();
  const valid = response.status === 200 && validCategoriesBody(body);
  return {
    label,
    timestamp: new Date().toISOString(),
    statusCode: response.status,
    latencyMs: round(performance.now() - started, 2),
    valid,
  };
}

function percentile(sorted, percentileValue) {
  if (sorted.length === 0) return null;
  const index = Math.ceil((percentileValue / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

function round(value, digits = 3) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return null;
  return Number(Number(value).toFixed(digits));
}

function statusGroups(statusCounts) {
  const groups = { status401: 0, status403: 0, status429: 0, status5xx: 0, otherNon200: 0 };
  for (const [codeText, count] of Object.entries(statusCounts)) {
    const code = Number(codeText);
    if (code === 401) groups.status401 += count;
    else if (code === 403) groups.status403 += count;
    else if (code === 429) groups.status429 += count;
    else if (code >= 500 && code <= 599) groups.status5xx += count;
    else if (code !== 200) groups.otherNon200 += count;
  }
  return groups;
}

async function runAutocannon(session, name, durationSeconds, collectResult) {
  const responseTimes = [];
  const statusCounts = {};
  let responseEvents = 0;

  const startedAt = new Date();
  const result = await new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        title: `OMR-ST-01 ${name}`,
        url: targetUrl.href,
        method: 'GET',
        duration: durationSeconds,
        connections: config.connections,
        pipelining: config.pipelining,
        overallRate: config.overallRate,
        timeout: config.timeoutSeconds,
        headers: { Cookie: `session=${session}`, Accept: 'application/json' },
        verifyBody: validCategoriesBody,
      },
      (error, finalResult) => {
        currentRun = undefined;
        if (error) reject(error);
        else resolve(finalResult);
      },
    );
    currentRun = instance;
    instance.on('response', (_client, statusCode, _bytes, responseTime) => {
      responseEvents += 1;
      statusCounts[statusCode] = (statusCounts[statusCode] ?? 0) + 1;
      if (collectResult) responseTimes.push(responseTime);
    });
    instance.on('error', reject);
  });

  if (!collectResult) {
    return {
      name,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      durationSeconds: round(result.duration),
      responses: responseEvents,
      errors: result.errors,
      timeouts: result.timeouts,
      mismatches: result.mismatches,
    };
  }

  const sorted = responseTimes.sort((a, b) => a - b);
  const sum = sorted.reduce((total, value) => total + value, 0);
  const httpFailures = Object.entries(statusCounts).reduce(
    (total, [code, count]) => total + (Number(code) === 200 ? 0 : count),
    0,
  );
  // Autocannon's `errors` already includes timeout errors, so timeouts are not added twice.
  const networkErrors = Number(result.errors ?? 0);
  const attempts = responseEvents + networkErrors;
  const failedRequests = httpFailures + networkErrors;
  const requestsPerSecond = result.duration > 0 ? responseEvents / result.duration : 0;
  const failureRate = attempts > 0 ? failedRequests / attempts : 1;
  const p95Ms = percentile(sorted, 95);
  const checks = {
    durationCompleted: result.duration >= durationSeconds - 1,
    failureRate: failureRate < thresholds.maxFailureRate,
    p95: p95Ms !== null && p95Ms < thresholds.maxP95Ms,
    requestsPerSecond: requestsPerSecond >= thresholds.minRequestsPerSecond,
    responseBodies: Number(result.mismatches ?? 0) === 0,
  };

  return {
    name,
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    configuredDurationSeconds: durationSeconds,
    actualDurationSeconds: round(result.duration),
    connections: result.connections,
    pipelining: result.pipelining,
    configuredOverallRate: config.overallRate,
    responseCount: responseEvents,
    attemptedRequests: attempts,
    requestsPerSecond: round(requestsPerSecond),
    autocannonRequestsAverage: round(result.requests?.average),
    latencyMs: {
      average: sorted.length ? round(sum / sorted.length, 2) : null,
      p50: round(percentile(sorted, 50), 2),
      p95: round(p95Ms, 2),
      p99: round(percentile(sorted, 99), 2),
      samples: sorted.length,
    },
    statusCounts,
    statusGroups: statusGroups(statusCounts),
    httpFailures,
    networkErrors,
    timeouts: Number(result.timeouts ?? 0),
    bodyMismatches: Number(result.mismatches ?? 0),
    failedRequests,
    failureRate: round(failureRate, 6),
    checks,
    status: Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL',
  };
}

function parseJsonLines(text) {
  const trimmed = text.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return trimmed.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  }
}

async function command(command, args, options = {}) {
  const { stdout } = await execFileAsync(command, args, {
    cwd: repoRoot,
    windowsHide: true,
    maxBuffer: 10 * 1024 * 1024,
    ...options,
  });
  return stdout.trim();
}

async function discoverContainers() {
  const output = await command('docker', ['compose', 'ps', '--format', 'json']);
  const containers = parseJsonLines(output)
    .filter((item) => ['next', 'backend', 'postgres'].includes(item.Service))
    .map((item) => ({ service: item.Service, name: item.Name, state: item.State, health: item.Health }));
  if (containers.length !== 3) {
    throw new Error(`Pričakovani so trije Compose vsebniki (next/backend/postgres), najdenih: ${containers.length}.`);
  }
  return containers;
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function dockerCsv(samples) {
  const header = [
    'timestamp', 'phase', 'service', 'container', 'cpu_percent', 'memory_usage',
    'memory_percent', 'network_io', 'block_io', 'pids', 'sample_error',
  ];
  const rows = samples.map((sample) => header.map((key) => csvCell(sample[key])).join(','));
  return `${header.join(',')}\n${rows.join('\n')}\n`;
}

function startDockerMonitor(containers, samples, getPhase) {
  let stopped = false;
  const running = new Set();

  const sample = async () => {
    const timestamp = new Date().toISOString();
    const phase = getPhase();
    try {
      const output = await command('docker', [
        'stats', '--no-stream', '--format', '{{json .}}', ...containers.map((item) => item.name),
      ]);
      const records = parseJsonLines(output);
      const byName = new Map(records.map((item) => [item.Name, item]));
      for (const container of containers) {
        const item = byName.get(container.name) ?? {};
        samples.push({
          timestamp,
          phase,
          service: container.service,
          container: container.name,
          cpu_percent: item.CPUPerc,
          memory_usage: item.MemUsage,
          memory_percent: item.MemPerc,
          network_io: item.NetIO,
          block_io: item.BlockIO,
          pids: item.PIDs,
          sample_error: byName.has(container.name) ? '' : 'Manjka zapis docker stats',
        });
      }
    } catch (error) {
      for (const container of containers) {
        samples.push({
          timestamp,
          phase,
          service: container.service,
          container: container.name,
          sample_error: error.message,
        });
      }
    }
  };

  const takeSample = () => {
    if (stopped) return;
    const pending = sample().finally(() => running.delete(pending));
    running.add(pending);
  };
  takeSample();
  const timer = setInterval(takeSample, config.dockerSampleSeconds * 1000);

  return async () => {
    stopped = true;
    clearInterval(timer);
    await Promise.allSettled([...running]);
  };
}

async function collectEnvironment(containers) {
  const packageJson = JSON.parse(await readFile(path.join(scriptDir, 'package.json'), 'utf8'));
  const safeCommand = async (executable, args) => {
    try { return await command(executable, args); } catch (error) { return `NI NA VOLJO: ${error.message}`; }
  };
  return {
    gitCommit: await safeCommand('git', ['rev-parse', 'HEAD']),
    operatingSystem: `${os.type()} ${os.release()} (${os.arch()})`,
    cpu: os.cpus()[0]?.model ?? 'neznan',
    logicalCpuCount: os.cpus().length,
    totalMemoryBytes: os.totalmem(),
    nodeVersion: process.version,
    autocannonVersion: packageJson.dependencies.autocannon,
    dockerVersion: await safeCommand('docker', ['version', '--format', '{{.Server.Version}}']),
    dockerComposeVersion: await safeCommand('docker', ['compose', 'version', '--short']),
    containers,
    note: 'Generator obremenitve in vsi vsebniki so tekli na istem lokalnem računalniku.',
  };
}

function evaluateOverall(results) {
  const early = results.phases.find((phase) => phase.name === 'A');
  const late = results.phases.find((phase) => phase.name === 'C');
  const hasComparableP95 =
    Number.isFinite(early?.latencyMs.p95) &&
    early.latencyMs.p95 > 0 &&
    Number.isFinite(late?.latencyMs.p95);
  const ratio = hasComparableP95
    ? late.latencyMs.p95 / early.latencyMs.p95
    : null;
  results.lateToEarlyP95Ratio = round(ratio);
  results.trendCheck = ratio !== null && ratio <= thresholds.maxLateToEarlyP95Ratio;
  const allPhasesPass = results.phases.length === 3 && results.phases.every((phase) => phase.status === 'PASS');
  results.overallStatus =
    results.preflight?.valid && results.postTest?.valid && allPhasesPass && results.trendCheck
      ? 'PASS'
      : 'FAIL';
}

function summaryText(results) {
  const lines = [
    'OMR-ST-01 – povzetek vzdržljivostnega testa',
    `Rezultat: ${results.overallStatus}`,
    `Začetek: ${results.startedAt}`,
    `Konec: ${results.finishedAt}`,
    `Git commit: ${results.environment?.gitCommit ?? 'ni na voljo'}`,
    `Cilj: ${targetUrl.href}`,
    `Preflight: ${results.preflight?.valid ? 'PASS' : 'FAIL'} (HTTP ${results.preflight?.statusCode ?? 'n/a'})`,
    '',
  ];
  for (const phase of results.phases) {
    lines.push(
      `Faza ${phase.name}: ${phase.status}; ${phase.responseCount} odzivov; ` +
      `${phase.requestsPerSecond} req/s; avg ${phase.latencyMs.average} ms; ` +
      `p50 ${phase.latencyMs.p50} ms; p95 ${phase.latencyMs.p95} ms; ` +
      `p99 ${phase.latencyMs.p99} ms; napake ${(phase.failureRate * 100).toFixed(3)} %; ` +
      `401=${phase.statusGroups.status401}, 403=${phase.statusGroups.status403}, ` +
      `429=${phase.statusGroups.status429}, 5xx=${phase.statusGroups.status5xx}, ` +
      `omrežne=${phase.networkErrors}, timeouti=${phase.timeouts}, neveljavna telesa=${phase.bodyMismatches}`,
    );
  }
  lines.push(
    '',
    `Razmerje p95(C)/p95(A): ${results.lateToEarlyP95Ratio ?? 'ni na voljo'} ` +
      `(zahteva ≤ ${thresholds.maxLateToEarlyP95Ratio}; ${results.trendCheck ? 'PASS' : 'FAIL'})`,
    `Končna kontrola: ${results.postTest?.valid ? 'PASS' : 'FAIL'} (HTTP ${results.postTest?.statusCode ?? 'n/a'})`,
    `Vzorci docker stats: ${results.dockerStatsSamples.length} vrstic; napake vzorčenja: ` +
      `${results.dockerStatsSamples.filter((sample) => sample.sample_error).length}`,
    '',
    'Piškotek seje in glave Cookie niso zapisani v dokazila.',
  );
  return `${lines.join('\n')}\n`;
}

async function saveEvidence(results) {
  await mkdir(evidenceDir, { recursive: true });
  await Promise.all([
    writeFile(path.join(evidenceDir, 'results.json'), `${JSON.stringify(results, null, 2)}\n`, 'utf8'),
    writeFile(path.join(evidenceDir, 'docker-stats.csv'), dockerCsv(results.dockerStatsSamples), 'utf8'),
    writeFile(path.join(evidenceDir, 'summary.txt'), summaryText(results), 'utf8'),
  ]);
}

async function main() {
  assertLocalTarget(targetUrl);
  const session = requireSession();
  const results = {
    schemaVersion: 1,
    testId: 'OMR-ST-01',
    startedAt: new Date().toISOString(),
    target: targetUrl.href,
    method: config.method,
    config,
    thresholds,
    phases: [],
    dockerStatsSamples: [],
  };

  await mkdir(evidenceDir, { recursive: true });
  console.log(`OMR-ST-01: preflight za ${targetUrl.href} (seja se ne izpisuje).`);
  results.preflight = await controlRequest(session, 'preflight');
  if (!results.preflight.valid) {
    throw new Error(`Preflight ni veljaven (HTTP ${results.preflight.statusCode}); obremenitev ni bila zagnana.`);
  }

  const containers = await discoverContainers();
  results.environment = await collectEnvironment(containers);
  let activePhase = 'ogrevanje';
  const stopMonitor = startDockerMonitor(containers, results.dockerStatsSamples, () => activePhase);

  try {
    console.log(`Ogrevanje: ${config.warmupSeconds} s.`);
    results.warmup = await runAutocannon(session, 'ogrevanje', config.warmupSeconds, false);
    for (const phaseName of config.phases) {
      if (interrupted) throw new Error('Test je prekinil uporabnik.');
      activePhase = phaseName;
      console.log(`Faza ${phaseName}: ${config.phaseSeconds} s pri cilju ${config.overallRate} req/s.`);
      const phase = await runAutocannon(session, phaseName, config.phaseSeconds, true);
      phase.controlAfterPhase = await controlRequest(session, `po fazi ${phaseName}`);
      if (!phase.controlAfterPhase.valid) {
        phase.checks.responseBodies = false;
        phase.status = 'FAIL';
      }
      results.phases.push(phase);
      results.finishedAt = new Date().toISOString();
      evaluateOverall(results);
      await saveEvidence(results);
      console.log(`Faza ${phaseName}: ${phase.status}, ${phase.requestsPerSecond} req/s, p95 ${phase.latencyMs.p95} ms.`);
    }
    activePhase = 'končna kontrola';
    results.postTest = await controlRequest(session, 'končna kontrola');
  } finally {
    await stopMonitor();
  }

  results.finishedAt = new Date().toISOString();
  evaluateOverall(results);
  await saveEvidence(results);
  console.log(`Končni rezultat: ${results.overallStatus}. Dokazila so v mapi dokazila/.`);
  process.exitCode = results.overallStatus === 'PASS' ? 0 : 1;
}

try {
  await main();
} catch (error) {
  console.error(`OMR-ST-01 ni bil veljavno zaključen: ${error.message}`);
  process.exitCode = interrupted ? 130 : 2;
}
