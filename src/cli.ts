#!/usr/bin/env node

import { SoundCloudClient, generateCodeVerifier, generateCodeChallenge } from "./index.js";
import * as readline from "node:readline";
import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

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

const CONFIG_PATH = path.join(os.homedir(), ".soundcloud-cli.json");

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
    die("Not configured. Run `soundcloud-cli auth` first.");
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
    die("Not configured. Run `soundcloud-cli auth` first.");
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
${col(c.bold, "Usage:")} soundcloud-cli search <query> [--json]

${col(c.bold, "Examples:")}
  soundcloud-cli search "lofi hip hop"
  soundcloud-cli search deadmau5 --json
`);
    return;
  }

  const query = args.positional.join(" ");
  if (!query) die("Usage: soundcloud-cli search <query>");

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
${col(c.bold, "Usage:")} soundcloud-cli track <id> [--json]

${col(c.bold, "Examples:")}
  soundcloud-cli track 123456
  soundcloud-cli track 123456 --json
`);
    return;
  }

  const id = args.positional[0];
  if (!id) die("Usage: soundcloud-cli track <id>");

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
${col(c.bold, "Usage:")} soundcloud-cli user <id> [--json]

${col(c.bold, "Examples:")}
  soundcloud-cli user 123456
`);
    return;
  }

  const id = args.positional[0];
  if (!id) die("Usage: soundcloud-cli user <id>");

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
${col(c.bold, "Usage:")} soundcloud-cli playlist <id> [--json]

${col(c.bold, "Examples:")}
  soundcloud-cli playlist 123456
`);
    return;
  }

  const id = args.positional[0];
  if (!id) die("Usage: soundcloud-cli playlist <id>");

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
${col(c.bold, "Usage:")} soundcloud-cli stream <id> [--json]

${col(c.bold, "Examples:")}
  soundcloud-cli stream 123456
`);
    return;
  }

  const id = args.positional[0];
  if (!id) die("Usage: soundcloud-cli stream <id>");

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
${col(c.bold, "Usage:")} soundcloud-cli resolve <url> [--json]

${col(c.bold, "Examples:")}
  soundcloud-cli resolve https://soundcloud.com/artist/track
`);
    return;
  }

  const url = args.positional[0];
  if (!url) die("Usage: soundcloud-cli resolve <url>");

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
${col(c.bold, "Usage:")} soundcloud-cli me [--json]

Shows the authenticated user's profile. Requires \`soundcloud-cli login\` first.
`);
    return;
  }

  const config = loadConfig();
  const client = getClient(config);
  if (!client.accessToken) {
    die("Not logged in. Run `soundcloud-cli login` first.");
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
${col(c.bold, "Usage:")} soundcloud-cli likes [--json]

Shows your liked tracks. Requires \`soundcloud-cli login\` first.
`);
    return;
  }

  const config = loadConfig();
  const client = getClient(config);
  if (!client.accessToken) {
    die("Not logged in. Run `soundcloud-cli login` first.");
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

function showHelp(): void {
  console.log(`
${col(c.bold + c.cyan, "⚡ soundcloud-cli")} ${col(c.dim, "— Explore the SoundCloud API from your terminal")}

${col(c.bold, "Usage:")} soundcloud-cli <command> [options]

${col(c.bold, "Setup:")}
  ${col(c.green, "auth")}              Set up API credentials (client_id + client_secret)
  ${col(c.green, "login")}             Log in via OAuth (opens browser)

${col(c.bold, "Commands:")}
  ${col(c.green, "search")} <query>    Search tracks
  ${col(c.green, "track")}  <id>       Show track details
  ${col(c.green, "user")}   <id>       Show user profile
  ${col(c.green, "playlist")} <id>     Show playlist with track listing
  ${col(c.green, "stream")} <id>       Get stream URLs for a track
  ${col(c.green, "resolve")} <url>     Resolve a SoundCloud URL
  ${col(c.green, "me")}                Show your profile (requires login)
  ${col(c.green, "likes")}             Show your liked tracks (requires login)

${col(c.bold, "Options:")}
  ${col(c.yellow, "--json")}            Output raw JSON (works on all commands)
  ${col(c.yellow, "--help")}            Show help for a command

${col(c.bold, "Examples:")}
  ${col(c.dim, "$")} soundcloud-cli auth
  ${col(c.dim, "$")} soundcloud-cli search "lofi beats"
  ${col(c.dim, "$")} soundcloud-cli track 293 --json
  ${col(c.dim, "$")} soundcloud-cli resolve https://soundcloud.com/artist/track
  ${col(c.dim, "$")} soundcloud-cli login
  ${col(c.dim, "$")} soundcloud-cli me

${col(c.dim, "Config:")} ${CONFIG_PATH}
${col(c.dim, "Powered by")} soundcloud-api-ts
`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  if (args.flags["help"] && !["search", "track", "user", "playlist", "stream", "resolve", "me", "likes"].includes(args.command)) {
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
