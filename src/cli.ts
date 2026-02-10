#!/usr/bin/env node

import { SoundCloudClient, generateCodeVerifier, generateCodeChallenge } from "./index.js";
import * as readline from "node:readline";
import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { execSync, spawn, type ChildProcess } from "node:child_process";
import * as net from "node:net";

// ── ANSI Colors ──────────────────────────────────────────────────────────────

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgBlue: "\x1b[44m",
};

const isNoColor = !!process.env["NO_COLOR"];
function col(color: string, text: string): string {
  return isNoColor ? text : `${color}${text}${c.reset}`;
}

// ── Config ───────────────────────────────────────────────────────────────────

interface CLIConfig {
  clientId?: string;
  clientSecret?: string;
  token?: string;
  refreshToken?: string;
}

const CONFIG_PATH = path.join(os.homedir(), ".sc-cli.json");

function loadConfig(): CLIConfig {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8")) as CLIConfig;
  } catch {
    return {};
  }
}

function saveConfig(config: CLIConfig): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

// ── Spinner ──────────────────────────────────────────────────────────────────

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function createSpinner(message: string) {
  let i = 0;
  const timer = setInterval(() => {
    process.stdout.write(`\r${col(c.cyan, SPINNER_FRAMES[i % SPINNER_FRAMES.length])} ${message}`);
    i++;
  }, 80);
  return {
    stop(finalMessage?: string) {
      clearInterval(timer);
      process.stdout.write(`\r${" ".repeat(message.length + 4)}\r`);
      if (finalMessage) console.log(finalMessage);
    },
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function formatNumber(n: number | undefined | null): string {
  if (n == null) return "-";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function padRight(s: string, len: number): string {
  return s.length >= len ? s : s + " ".repeat(len - s.length);
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function die(msg: string): never {
  console.error(`\n${col(c.red, "✖")} ${msg}`);
  process.exit(1);
}

function getClient(config: CLIConfig): SoundCloudClient {
  if (!config.clientId || !config.clientSecret) {
    die("Not configured. Run `sc-cli auth` first.");
  }
  const client = new SoundCloudClient({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: "http://localhost:8976/callback",
  });
  if (config.token) {
    client.setToken(config.token, config.refreshToken);
  }
  return client;
}

async function ensureToken(client: SoundCloudClient, config: CLIConfig): Promise<void> {
  if (client.accessToken) return;
  const spinner = createSpinner("Getting client token…");
  try {
    const token = await client.auth.getClientToken();
    client.setToken(token.access_token);
    config.token = token.access_token;
    saveConfig(config);
    spinner.stop();
  } catch (err) {
    spinner.stop();
    die(`Failed to get token: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Args parsing ─────────────────────────────────────────────────────────────

interface ParsedArgs {
  command: string;
  positional: string[];
  flags: Record<string, string | boolean>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const eqIdx = arg.indexOf("=");
      if (eqIdx > -1) {
        flags[arg.slice(2, eqIdx)] = arg.slice(eqIdx + 1);
      } else {
        flags[arg.slice(2)] = true;
      }
    } else {
      positional.push(arg);
    }
  }
  const command = positional.shift() ?? "help";
  return { command, positional, flags };
}

// ── Commands ─────────────────────────────────────────────────────────────────

async function cmdAuth(): Promise<void> {
  console.log(`\n${col(c.bold + c.cyan, "⚡ SoundCloud CLI Setup")}\n`);
  const clientId = await prompt(`${col(c.yellow, "?")} Client ID: `);
  if (!clientId) die("Client ID is required.");
  const clientSecret = await prompt(`${col(c.yellow, "?")} Client Secret: `);
  if (!clientSecret) die("Client Secret is required.");

  const spinner = createSpinner("Verifying credentials…");
  try {
    const client = new SoundCloudClient({ clientId, clientSecret });
    const token = await client.auth.getClientToken();
    spinner.stop(`${col(c.green, "✔")} Credentials verified!`);
    const config: CLIConfig = { clientId, clientSecret, token: token.access_token };
    saveConfig(config);
    console.log(`${col(c.dim, `  Config saved to ${CONFIG_PATH}`)}`);
  } catch (err) {
    spinner.stop();
    die(`Invalid credentials: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function cmdLogin(): Promise<void> {
  const config = loadConfig();
  if (!config.clientId || !config.clientSecret) {
    die("Not configured. Run `sc-cli auth` first.");
  }

  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  const client = new SoundCloudClient({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: "http://localhost:8976/callback",
  });

  const authUrl = client.auth.getAuthorizationUrl({
    state: "cli-login",
    codeChallenge: challenge,
  });

  console.log(`\n${col(c.bold + c.cyan, "⚡ SoundCloud OAuth Login")}\n`);
  console.log(`${col(c.yellow, "→")} Open this URL in your browser:\n`);
  console.log(`  ${col(c.blue, authUrl)}\n`);

  // Try to open browser automatically
  const openCmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  try {
    const { exec: cpExec } = await import("node:child_process");
    cpExec(`${openCmd} "${authUrl}"`);
  } catch {
    // ignore — user can open manually
  }

  console.log(`${col(c.dim, "  Waiting for callback on http://localhost:8976/callback …")}\n`);

  const code = await new Promise<string>((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? "/", "http://localhost:8976");
      const authCode = url.searchParams.get("code");
      if (authCode) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<html><body><h2>✅ Authenticated! You can close this tab.</h2></body></html>");
        server.close();
        resolve(authCode);
      } else {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end("<html><body><h2>❌ No code received.</h2></body></html>");
        server.close();
        reject(new Error("No authorization code received"));
      }
    });
    server.listen(8976);
    server.on("error", reject);
  });

  const spinner = createSpinner("Exchanging code for token…");
  try {
    const token = await client.auth.getUserToken(code, verifier);
    spinner.stop(`${col(c.green, "✔")} Logged in successfully!`);
    config.token = token.access_token;
    config.refreshToken = token.refresh_token;
    saveConfig(config);
    console.log(`${col(c.dim, `  Config saved to ${CONFIG_PATH}`)}`);
  } catch (err) {
    spinner.stop();
    die(`Login failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function cmdSearch(args: ParsedArgs): Promise<void> {
  if (args.flags["help"]) {
    console.log(`
${col(c.bold, "Usage:")} sc-cli search <query> [--json]

${col(c.bold, "Examples:")}
  sc-cli search "lofi hip hop"
  sc-cli search deadmau5 --json
`);
    return;
  }

  const query = args.positional.join(" ");
  if (!query) die("Usage: sc-cli search <query>");

  const config = loadConfig();
  const client = getClient(config);
  await ensureToken(client, config);

  const spinner = createSpinner(`Searching "${query}"…`);
  const results = await client.search.tracks(query);
  spinner.stop();

  if (args.flags["json"]) {
    console.log(JSON.stringify(results.collection, null, 2));
    return;
  }

  if (!results.collection.length) {
    console.log(`\n${col(c.yellow, "No results found.")}`);
    return;
  }

  console.log(`\n${col(c.bold + c.cyan, `⚡ Search results for "${query}"`)}\n`);
  console.log(
    `  ${col(c.dim, padRight("#", 4))}${col(c.dim, padRight("Title", 40))}${col(c.dim, padRight("Artist", 24))}${col(c.dim, padRight("Duration", 10))}${col(c.dim, "Plays")}`,
  );
  console.log(`  ${col(c.dim, "─".repeat(90))}`);

  results.collection.forEach((track, i) => {
    const num = padRight(`${i + 1}`, 4);
    const title = padRight(truncate(track.title ?? "Untitled", 38), 40);
    const artist = padRight(truncate(track.user?.username ?? "Unknown", 22), 24);
    const duration = padRight(formatDuration(track.duration ?? 0), 10);
    const plays = formatNumber(track.playback_count);
    console.log(`  ${col(c.dim, num)}${col(c.white, title)}${col(c.magenta, artist)}${col(c.yellow, duration)}${col(c.green, plays)}`);
  });
  console.log();
}

async function cmdTrack(args: ParsedArgs): Promise<void> {
  if (args.flags["help"]) {
    console.log(`
${col(c.bold, "Usage:")} sc-cli track <id> [--json]

${col(c.bold, "Examples:")}
  sc-cli track 123456
  sc-cli track 123456 --json
`);
    return;
  }

  const id = args.positional[0];
  if (!id) die("Usage: sc-cli track <id>");

  const config = loadConfig();
  const client = getClient(config);
  await ensureToken(client, config);

  const spinner = createSpinner("Fetching track…");
  const track = await client.tracks.getTrack(id);
  spinner.stop();

  if (args.flags["json"]) {
    console.log(JSON.stringify(track, null, 2));
    return;
  }

  console.log(`\n${col(c.bold + c.cyan, "⚡ Track Details")}\n`);
  console.log(`  ${col(c.dim, "Title:")}     ${col(c.bold + c.white, track.title ?? "Untitled")}`);
  console.log(`  ${col(c.dim, "Artist:")}    ${col(c.magenta, track.user?.username ?? "Unknown")}`);
  console.log(`  ${col(c.dim, "Duration:")}  ${col(c.yellow, formatDuration(track.duration ?? 0))}`);
  console.log(`  ${col(c.dim, "Plays:")}     ${col(c.green, formatNumber(track.playback_count))}`);
  console.log(`  ${col(c.dim, "Likes:")}     ${col(c.green, formatNumber(track.favoritings_count))}`);
  console.log(`  ${col(c.dim, "Genre:")}     ${track.genre ?? "-"}`);
  console.log(`  ${col(c.dim, "Created:")}   ${track.created_at ?? "-"}`);
  console.log(`  ${col(c.dim, "URL:")}       ${col(c.blue, track.permalink_url ?? "-")}`);
  console.log();
}

async function cmdUser(args: ParsedArgs): Promise<void> {
  if (args.flags["help"]) {
    console.log(`
${col(c.bold, "Usage:")} sc-cli user <id> [--json]

${col(c.bold, "Examples:")}
  sc-cli user 123456
`);
    return;
  }

  const id = args.positional[0];
  if (!id) die("Usage: sc-cli user <id>");

  const config = loadConfig();
  const client = getClient(config);
  await ensureToken(client, config);

  const spinner = createSpinner("Fetching user…");
  const user = await client.users.getUser(id);
  spinner.stop();

  if (args.flags["json"]) {
    console.log(JSON.stringify(user, null, 2));
    return;
  }

  console.log(`\n${col(c.bold + c.cyan, "⚡ User Profile")}\n`);
  console.log(`  ${col(c.dim, "Username:")}   ${col(c.bold + c.white, user.username ?? "Unknown")}`);
  console.log(`  ${col(c.dim, "Followers:")}  ${col(c.green, formatNumber(user.followers_count))}`);
  console.log(`  ${col(c.dim, "Following:")}  ${col(c.green, formatNumber(user.followings_count))}`);
  console.log(`  ${col(c.dim, "Tracks:")}     ${col(c.yellow, formatNumber(user.track_count))}`);
  console.log(`  ${col(c.dim, "City:")}       ${user.city ?? "-"}`);
  console.log(`  ${col(c.dim, "URL:")}        ${col(c.blue, user.permalink_url ?? "-")}`);
  console.log();
}

async function cmdPlaylist(args: ParsedArgs): Promise<void> {
  if (args.flags["help"]) {
    console.log(`
${col(c.bold, "Usage:")} sc-cli playlist <id> [--json]

${col(c.bold, "Examples:")}
  sc-cli playlist 123456
`);
    return;
  }

  const id = args.positional[0];
  if (!id) die("Usage: sc-cli playlist <id>");

  const config = loadConfig();
  const client = getClient(config);
  await ensureToken(client, config);

  const spinner = createSpinner("Fetching playlist…");
  const playlist = await client.playlists.getPlaylist(id);
  spinner.stop();

  if (args.flags["json"]) {
    console.log(JSON.stringify(playlist, null, 2));
    return;
  }

  console.log(`\n${col(c.bold + c.cyan, "⚡ Playlist")}\n`);
  console.log(`  ${col(c.dim, "Title:")}    ${col(c.bold + c.white, playlist.title ?? "Untitled")}`);
  console.log(`  ${col(c.dim, "By:")}       ${col(c.magenta, playlist.user?.username ?? "Unknown")}`);
  console.log(`  ${col(c.dim, "Tracks:")}   ${playlist.track_count ?? 0}`);
  console.log(`  ${col(c.dim, "Duration:")} ${col(c.yellow, formatDuration(playlist.duration ?? 0))}`);
  console.log(`  ${col(c.dim, "URL:")}      ${col(c.blue, playlist.permalink_url ?? "-")}`);

  if (playlist.tracks?.length) {
    console.log(`\n  ${col(c.bold, "Track listing:")}\n`);
    playlist.tracks.forEach((track, i) => {
      const num = padRight(`${i + 1}.`, 5);
      const title = truncate(track.title ?? "Untitled", 45);
      const dur = formatDuration(track.duration ?? 0);
      console.log(`  ${col(c.dim, num)}${title} ${col(c.dim, `(${dur})`)}`);
    });
  }
  console.log();
}

async function cmdStream(args: ParsedArgs): Promise<void> {
  if (args.flags["help"]) {
    console.log(`
${col(c.bold, "Usage:")} sc-cli stream <id> [--json]

${col(c.bold, "Examples:")}
  sc-cli stream 123456
`);
    return;
  }

  const id = args.positional[0];
  if (!id) die("Usage: sc-cli stream <id>");

  const config = loadConfig();
  const client = getClient(config);
  await ensureToken(client, config);

  const spinner = createSpinner("Getting stream URLs…");
  const streams = await client.tracks.getStreams(id);
  spinner.stop();

  if (args.flags["json"]) {
    console.log(JSON.stringify(streams, null, 2));
    return;
  }

  console.log(`\n${col(c.bold + c.cyan, "⚡ Stream URLs")}\n`);
  const entries = Object.entries(streams).filter(([, v]) => v);
  if (!entries.length) {
    console.log(`  ${col(c.yellow, "No stream URLs available.")}`);
  } else {
    for (const [key, url] of entries) {
      const label = key.replace(/_url$/, "").replace(/_/g, " ").toUpperCase();
      console.log(`  ${col(c.dim, padRight(label + ":", 28))}${col(c.blue, String(url))}`);
    }
  }
  console.log();
}

async function cmdResolve(args: ParsedArgs): Promise<void> {
  if (args.flags["help"]) {
    console.log(`
${col(c.bold, "Usage:")} sc-cli resolve <url> [--json]

${col(c.bold, "Examples:")}
  sc-cli resolve https://soundcloud.com/artist/track
`);
    return;
  }

  const url = args.positional[0];
  if (!url) die("Usage: sc-cli resolve <url>");

  const config = loadConfig();
  const client = getClient(config);
  await ensureToken(client, config);

  const spinner = createSpinner("Resolving URL…");
  const result = await client.resolve.resolveUrl(url);
  spinner.stop();

  if (args.flags["json"]) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`\n${col(c.green, "✔")} Resolved:\n`);
  if (typeof result === "string") {
    console.log(`  ${col(c.blue, result)}`);
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
  console.log();
}

async function cmdMe(args: ParsedArgs): Promise<void> {
  if (args.flags["help"]) {
    console.log(`
${col(c.bold, "Usage:")} sc-cli me [--json]

Shows the authenticated user's profile. Requires \`sc-cli login\` first.
`);
    return;
  }

  const config = loadConfig();
  const client = getClient(config);
  if (!client.accessToken) {
    die("Not logged in. Run `sc-cli login` first.");
  }

  const spinner = createSpinner("Fetching profile…");
  const me = await client.me.getMe();
  spinner.stop();

  if (args.flags["json"]) {
    console.log(JSON.stringify(me, null, 2));
    return;
  }

  console.log(`\n${col(c.bold + c.cyan, "⚡ Your Profile")}\n`);
  console.log(`  ${col(c.dim, "Username:")}   ${col(c.bold + c.white, me.username ?? "Unknown")}`);
  console.log(`  ${col(c.dim, "Followers:")}  ${col(c.green, formatNumber(me.followers_count))}`);
  console.log(`  ${col(c.dim, "Following:")}  ${col(c.green, formatNumber(me.followings_count))}`);
  console.log(`  ${col(c.dim, "Tracks:")}     ${col(c.yellow, formatNumber(me.track_count))}`);
  console.log(`  ${col(c.dim, "City:")}       ${me.city ?? "-"}`);
  console.log(`  ${col(c.dim, "Plan:")}       ${me.quota?.unlimited_upload_quota ? "Pro" : "Free"}`);
  console.log(`  ${col(c.dim, "URL:")}        ${col(c.blue, me.permalink_url ?? "-")}`);
  console.log();
}

async function cmdLikes(args: ParsedArgs): Promise<void> {
  if (args.flags["help"]) {
    console.log(`
${col(c.bold, "Usage:")} sc-cli likes [--json]

Shows your liked tracks. Requires \`sc-cli login\` first.
`);
    return;
  }

  const config = loadConfig();
  const client = getClient(config);
  if (!client.accessToken) {
    die("Not logged in. Run `sc-cli login` first.");
  }

  const spinner = createSpinner("Fetching likes…");
  const likes = await client.me.getLikesTracks(20);
  spinner.stop();

  if (args.flags["json"]) {
    console.log(JSON.stringify(likes.collection, null, 2));
    return;
  }

  if (!likes.collection.length) {
    console.log(`\n${col(c.yellow, "No liked tracks.")}`);
    return;
  }

  console.log(`\n${col(c.bold + c.cyan, "⚡ Your Liked Tracks")}\n`);
  console.log(
    `  ${col(c.dim, padRight("#", 4))}${col(c.dim, padRight("Title", 40))}${col(c.dim, padRight("Artist", 24))}${col(c.dim, "Duration")}`,
  );
  console.log(`  ${col(c.dim, "─".repeat(80))}`);

  likes.collection.forEach((track, i) => {
    const num = padRight(`${i + 1}`, 4);
    const title = padRight(truncate(track.title ?? "Untitled", 38), 40);
    const artist = padRight(truncate(track.user?.username ?? "Unknown", 22), 24);
    const duration = formatDuration(track.duration ?? 0);
    console.log(`  ${col(c.dim, num)}${col(c.white, title)}${col(c.magenta, artist)}${col(c.yellow, duration)}`);
  });
  console.log();
}

// ── Play Command ─────────────────────────────────────────────────────────────

const isWindows = process.platform === "win32";

/** Detect an available audio player binary */
function detectPlayer(): string | null {
  const candidates = isWindows ? ["mpv", "ffplay"] : ["mpv", "ffplay", "afplay"];
  const whichCmd = isWindows ? "where.exe" : "command -v";
  for (const bin of candidates) {
    try {
      execSync(`${whichCmd} ${bin}`, { stdio: "ignore" });
      return bin;
    } catch {
      // not found, try next
    }
  }
  return null;
}

/** IPC socket path for mpv (shared between playerArgs and cmdPlay) */
const mpvSocketPath = isWindows ? "\\\\.\\pipe\\sc-cli-mpv" : path.join(os.tmpdir(), "sc-cli-mpv.sock");

/** Build player args (suppress visual output where possible) */
function playerArgs(bin: string, filePath: string): string[] {
  switch (bin) {
    case "mpv":
      return ["--no-video", "--no-terminal", `--input-ipc-server=${mpvSocketPath}`, filePath];
    case "ffplay":
      return ["-nodisp", "-autoexit", "-loglevel", "quiet", filePath];
    case "afplay":
      return [filePath];
    default:
      return [filePath];
  }
}

async function cmdPlay(args: ParsedArgs): Promise<void> {
  if (args.flags["help"]) {
    console.log(`
${col(c.bold, "Usage:")} sc-cli play <id> [--url] [--json]

Play a SoundCloud track in your terminal.

${col(c.bold, "Options:")}
  ${col(c.yellow, "--url")}     Print the best stream URL and exit
  ${col(c.yellow, "--json")}    Print raw stream URLs JSON and exit

${col(c.bold, "Examples:")}
  sc-cli play 123456
  sc-cli play 123456 --url
`);
    return;
  }

  const id = args.positional[0];
  if (!id) die("Usage: sc-cli play <track-id>");

  const config = loadConfig();
  const client = getClient(config);
  await ensureToken(client, config);

  // Fetch track info and streams in parallel
  const spinner = createSpinner("Fetching track…");
  const [track, streams] = await Promise.all([
    client.tracks.getTrack(id),
    client.tracks.getStreams(id),
  ]);
  spinner.stop();

  // --json: dump raw stream URLs
  if (args.flags["json"]) {
    console.log(JSON.stringify(streams, null, 2));
    return;
  }

  // Pick best stream URL
  const streamUrl =
    streams.http_mp3_128_url ||
    streams.hls_mp3_128_url ||
    streams.hls_aac_160_url ||
    streams.preview_mp3_128_url;

  if (!streamUrl) die("No stream URL available for this track.");

  // --url: just print and exit
  if (args.flags["url"]) {
    console.log(streamUrl);
    return;
  }

  // Detect player
  const playerBin = detectPlayer();
  if (!playerBin) die("No audio player found. Install mpv, ffplay, or afplay.");

  // Show track header
  const title = track.title ?? "Untitled";
  const artist = track.user?.username ?? "Unknown";
  const durationMs = track.duration ?? 0;
  const durationStr = formatDuration(durationMs);

  console.log(`\n${col(c.bold + c.cyan, "⚡ Now Playing")}\n`);
  console.log(`  ${col(c.dim, "Title:")}    ${col(c.bold + c.white, title)}`);
  console.log(`  ${col(c.dim, "Artist:")}   ${col(c.magenta, artist)}`);
  console.log(`  ${col(c.dim, "Duration:")} ${col(c.yellow, durationStr)}`);
  console.log(`  ${col(c.dim, "Player:")}   ${playerBin}\n`);

  // Download to temp file
  const tmpFile = path.join(os.tmpdir(), `sc-play-${id}-${Date.now()}.mp3`);
  const dlSpinner = createSpinner("Downloading stream…");
  try {
    const resp = await fetch(streamUrl, {
      headers: { Authorization: `OAuth ${client.accessToken}` },
    });
    if (!resp.ok) die(`Download failed: HTTP ${resp.status}`);
    const buffer = Buffer.from(await resp.arrayBuffer());
    fs.writeFileSync(tmpFile, buffer);
  } catch (err) {
    dlSpinner.stop();
    die(`Download failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  dlSpinner.stop();

  // Spawn player
  const totalSec = Math.floor(durationMs / 1000);
  let player: ChildProcess | null = null;
  let progressTimer: ReturnType<typeof setInterval> | null = null;
  let startTime = Date.now();
  const usesMpv = playerBin === "mpv";

  // Restore terminal state helper
  const restoreStdin = () => {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }
  };

  // Cleanup helper
  const cleanup = () => {
    if (progressTimer) { clearInterval(progressTimer); progressTimer = null; }
    restoreStdin();
    process.stdout.write("\n");
    if (player && !player.killed) player.kill();
    try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
    if (usesMpv) try { fs.unlinkSync(mpvSocketPath); } catch { /* ignore */ }
  };

  // Handle Ctrl+C
  const onSigint = () => { cleanup(); process.exit(0); };
  process.on("SIGINT", onSigint);

  return new Promise<void>((resolve) => {
    player = spawn(playerBin, playerArgs(playerBin, tmpFile), { stdio: "ignore" });
    startTime = Date.now();
    let paused = false;
    let pausedAt = 0; // total ms spent paused
    let pauseStart = 0;

    // Live progress bar
    const barWidth = 30;
    const drawProgress = () => {
      const pauseOffset = paused ? Date.now() - pauseStart : 0;
      const elapsed = Math.floor((Date.now() - startTime - pausedAt - pauseOffset) / 1000);
      const capped = Math.min(Math.max(elapsed, 0), totalSec);
      const ratio = totalSec > 0 ? capped / totalSec : 0;
      const filled = Math.round(ratio * barWidth);
      const empty = barWidth - filled;
      const bar = "█".repeat(filled) + "░".repeat(empty);
      const elapsedStr = formatDuration(capped * 1000);
      const icon = paused ? col(c.yellow, "⏸") : col(c.green, "▶");
      process.stdout.write(`\r  ${icon} [${col(c.cyan, bar)}] ${elapsedStr} / ${durationStr} `);
    };
    drawProgress(); // draw immediately
    progressTimer = setInterval(drawProgress, 1000);

    // Keyboard controls
    // afplay has no pause support; ffplay on Windows can't use SIGSTOP/SIGCONT
    const supportsPause = playerBin === "mpv" || (playerBin === "ffplay" && !isWindows);

    const sendMpvCommand = (cmd: string[]) => {
      if (!usesMpv) return;
      try {
        const sock = net.createConnection(mpvSocketPath);
        sock.on("error", () => { /* ignore connection errors */ });
        sock.write(JSON.stringify({ command: cmd }) + "\n");
        sock.end();
      } catch { /* ignore */ }
    };

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on("data", (key: Buffer) => {
        const ch = key.toString();
        if (ch === " " && supportsPause && player && !player.killed) {
          if (usesMpv) {
            // Toggle pause via mpv IPC
            sendMpvCommand(["cycle", "pause"]);
          } else {
            // Signal-based fallback for ffplay
            if (paused) player.kill("SIGCONT");
            else player.kill("SIGSTOP");
          }
          if (paused) {
            pausedAt += Date.now() - pauseStart;
            paused = false;
          } else {
            pauseStart = Date.now();
            paused = true;
          }
          drawProgress();
        } else if (ch === "q" || ch === "\x03") {
          // q or Ctrl+C
          if (usesMpv) sendMpvCommand(["quit"]);
          cleanup();
          process.removeListener("SIGINT", onSigint);
          process.exit(0);
        }
      });
    }

    const controlHint = supportsPause ? "[space] pause/play  [q] quit" : "[q] quit";
    console.log(`  ${col(c.dim, controlHint)}\n`);

    player.on("close", () => {
      cleanup();
      process.removeListener("SIGINT", onSigint);
      console.log(`\n${col(c.green, "✔")} Playback complete.`);
      resolve();
    });

    player.on("error", (err) => {
      cleanup();
      process.removeListener("SIGINT", onSigint);
      die(`Player error: ${err.message}`);
    });
  });
}

function showHelp(): void {
  console.log(`
${col(c.bold + c.cyan, "⚡ sc-cli")} ${col(c.dim, "— Explore the SoundCloud API from your terminal")}

${col(c.bold, "Usage:")} sc-cli <command> [options]

${col(c.bold, "Setup:")}
  ${col(c.green, "auth")}              Set up API credentials (client_id + client_secret)
  ${col(c.green, "login")}             Log in via OAuth (opens browser)

${col(c.bold, "Commands:")}
  ${col(c.green, "search")} <query>    Search tracks
  ${col(c.green, "track")}  <id>       Show track details
  ${col(c.green, "user")}   <id>       Show user profile
  ${col(c.green, "playlist")} <id>     Show playlist with track listing
  ${col(c.green, "play")}   <id>       Play a track in your terminal
  ${col(c.green, "stream")} <id>       Get stream URLs for a track
  ${col(c.green, "resolve")} <url>     Resolve a SoundCloud URL
  ${col(c.green, "me")}                Show your profile (requires login)
  ${col(c.green, "likes")}             Show your liked tracks (requires login)

${col(c.bold, "Options:")}
  ${col(c.yellow, "--json")}            Output raw JSON (works on all commands)
  ${col(c.yellow, "--help")}            Show help for a command

${col(c.bold, "Examples:")}
  ${col(c.dim, "$")} sc-cli auth
  ${col(c.dim, "$")} sc-cli search "lofi beats"
  ${col(c.dim, "$")} sc-cli play 293
  ${col(c.dim, "$")} sc-cli track 293 --json
  ${col(c.dim, "$")} sc-cli resolve https://soundcloud.com/artist/track
  ${col(c.dim, "$")} sc-cli login
  ${col(c.dim, "$")} sc-cli me

${col(c.dim, "Config:")} ${CONFIG_PATH}
${col(c.dim, "Powered by")} soundcloud-api-ts
`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  if (args.flags["help"] && !["search", "track", "user", "playlist", "play", "stream", "resolve", "me", "likes"].includes(args.command)) {
    showHelp();
    return;
  }

  try {
    switch (args.command) {
      case "help":
        showHelp();
        break;
      case "auth":
        await cmdAuth();
        break;
      case "login":
        await cmdLogin();
        break;
      case "search":
        await cmdSearch(args);
        break;
      case "track":
        await cmdTrack(args);
        break;
      case "user":
        await cmdUser(args);
        break;
      case "playlist":
        await cmdPlaylist(args);
        break;
      case "play":
        await cmdPlay(args);
        break;
      case "stream":
        await cmdStream(args);
        break;
      case "resolve":
        await cmdResolve(args);
        break;
      case "me":
        await cmdMe(args);
        break;
      case "likes":
        await cmdLikes(args);
        break;
      default:
        console.error(`\n${col(c.red, "✖")} Unknown command: ${args.command}`);
        showHelp();
        process.exit(1);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    die(message);
  }
}

main();
