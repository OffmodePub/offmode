#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const args = parseArgs(process.argv.slice(2));
const keystorePath = path.resolve(args.keystore || "android/app/debug.keystore");
const alias = args.alias || "androiddebugkey";
const storePass = args.storepass || "android";
const keyPass = args.keypass || "android";

if (!fs.existsSync(keystorePath)) {
  fail(`Keystore not found: ${keystorePath}`);
}

const keytool = findKeytool();
if (!keytool) {
  fail(
    [
      "keytool was not found.",
      "Install a JDK or set JAVA_HOME to a JDK path, then retry.",
      "You can also pass KEYTOOL=/path/to/keytool as an environment variable.",
    ].join(os.EOL),
  );
}

const result = spawnSync(
  keytool,
  [
    "-list",
    "-v",
    "-alias",
    alias,
    "-keystore",
    keystorePath,
    "-storepass",
    storePass,
    "-keypass",
    keyPass,
  ],
  { encoding: "utf8" },
);

if (result.error) {
  fail(result.error.message);
}

const output = `${result.stdout || ""}${os.EOL}${result.stderr || ""}`;
if (result.status !== 0) {
  fail(output.trim() || `keytool failed with exit code ${result.status}`);
}

const sha1Match = output.match(/^\s*SHA1:\s*([0-9A-F:]+)\s*$/im);
if (!sha1Match) {
  fail("Could not find SHA1 fingerprint in keytool output.");
}

const sha1 = sha1Match[1].trim();
const bytes = sha1.split(":").map((value) => Number.parseInt(value, 16));
const keyHash = Buffer.from(bytes).toString("base64");

console.log(`Keystore: ${keystorePath}`);
console.log(`Alias: ${alias}`);
console.log(`SHA1: ${sha1}`);
console.log(`Kakao Android key hash: ${keyHash}`);

function parseArgs(argv) {
  const parsed = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      fail(`Unknown argument: ${arg}`);
    }

    const key = arg.slice(2).toLowerCase();
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      fail(`Missing value for ${arg}`);
    }

    parsed[key] = value;
    i += 1;
  }

  return parsed;
}

function findKeytool() {
  const candidates = [];

  if (process.env.KEYTOOL) {
    candidates.push(process.env.KEYTOOL);
  }

  candidates.push("keytool");

  if (process.env.JAVA_HOME) {
    candidates.push(path.join(process.env.JAVA_HOME, "bin", executable("keytool")));
  }

  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA;
    const programFiles = process.env.ProgramFiles;

    if (localAppData) {
      candidates.push(
        path.join(localAppData, "Programs", "Android Studio", "jbr", "bin", "keytool.exe"),
      );
    }

    if (programFiles) {
      candidates.push(path.join(programFiles, "Android", "Android Studio", "jbr", "bin", "keytool.exe"));
    }
  }

  for (const candidate of candidates) {
    const result = spawnSync(candidate, ["-help"], {
      encoding: "utf8",
      stdio: ["ignore", "ignore", "ignore"],
    });

    if (!result.error && result.status === 0) {
      return candidate;
    }
  }

  return null;
}

function executable(name) {
  return process.platform === "win32" ? `${name}.exe` : name;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
