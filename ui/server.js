import { createServer } from 'http';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const PORT        = process.env.PORT || 3000;
const OUTPUTS_DIR = join(__dirname, '..', 'outputs');
const ROOT_DIR    = join(__dirname, '..');
const HTML_FILE   = join(__dirname, 'index.html');

// ─── Pipeline state ────────────────────────────────────────────────
let pipelineRunning  = false;
let pipelineLogs     = [];
let pipelineExitCode = null;

// Strip ANSI color codes from terminal output
function stripAnsi(str) {
    return str.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[\??\d+[hl]/g, '');
}

// ─── Report helpers ────────────────────────────────────────────────
function listReports() {
    try {
        return readdirSync(OUTPUTS_DIR)
            .filter(f => f.endsWith('-report.json'))
            .sort()
            .reverse();
    } catch {
        return [];
    }
}

function loadReport(filename) {
    try {
        const content = readFileSync(join(OUTPUTS_DIR, filename), 'utf-8');
        return { filename, data: JSON.parse(content) };
    } catch (err) {
        return null;
    }
}

function getLatestReport() {
    const files = listReports();
    if (files.length === 0) return null;
    return loadReport(files[0]);
}

// ─── HTTP Server ───────────────────────────────────────────────────
const server = createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // GET /api/latest-report
    if (req.method === 'GET' && req.url === '/api/latest-report') {
        const report = getLatestReport();
        if (!report) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'No report found. Click "Run Pipeline" to generate one.' }));
            return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(report));
        return;
    }

    // GET /api/reports  — list all report filenames
    if (req.method === 'GET' && req.url === '/api/reports') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(listReports()));
        return;
    }

    // GET /api/report/:filename  — load a specific report
    if (req.method === 'GET' && req.url.startsWith('/api/report/')) {
        const filename = decodeURIComponent(req.url.slice('/api/report/'.length));
        if (!filename.endsWith('-report.json') || filename.includes('/') || filename.includes('\\')) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid filename' }));
            return;
        }
        const report = loadReport(filename);
        if (!report) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Report not found' }));
            return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(report));
        return;
    }

    // POST /api/run  — start the pipeline
    if (req.method === 'POST' && req.url === '/api/run') {
        if (pipelineRunning) {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Pipeline is already running' }));
            return;
        }

        pipelineLogs     = [];
        pipelineRunning  = true;
        pipelineExitCode = null;

        const proc = spawn('node', ['orchestrator.js', '--run'], {
            cwd: ROOT_DIR,
            env: { ...process.env },
        });

        proc.stdout.on('data', (chunk) => {
            const lines = stripAnsi(chunk.toString()).split('\n').filter(l => l.trim());
            pipelineLogs.push(...lines);
            if (pipelineLogs.length > 300) pipelineLogs = pipelineLogs.slice(-300);
        });

        proc.stderr.on('data', (chunk) => {
            const lines = stripAnsi(chunk.toString()).split('\n').filter(l => l.trim());
            pipelineLogs.push(...lines.map(l => `⚠ ${l}`));
        });

        proc.on('close', (code) => {
            pipelineRunning  = false;
            pipelineExitCode = code;
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ started: true }));
        return;
    }

    // GET /api/run/status  — poll pipeline progress
    if (req.method === 'GET' && req.url === '/api/run/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            running:  pipelineRunning,
            logs:     pipelineLogs,
            exitCode: pipelineExitCode,
        }));
        return;
    }

    // Serve dashboard HTML for everything else
    try {
        const html = readFileSync(HTML_FILE, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    } catch (err) {
        res.writeHead(500);
        res.end('Dashboard HTML not found: ' + err.message);
    }
});

server.listen(PORT, () => {
    console.log(`\n🚀 Content Studio running at: http://localhost:${PORT}\n`);
    console.log('   Open the URL above in your browser.\n');
    console.log('   Press Ctrl+C to stop.\n');
});
