/* eslint-env node */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const gitDir = path.join(rootDir, ".git");
const hooksDir = path.join(rootDir, ".githooks");
const commitMsgHook = path.join(hooksDir, "commit-msg");

try {
  if (!fs.existsSync(gitDir)) {
    process.exit(0);
  }

  execFileSync("git", ["config", "core.hooksPath", ".githooks"], {
    cwd: rootDir,
    stdio: "ignore",
  });

  if (process.platform !== "win32" && fs.existsSync(commitMsgHook)) {
    fs.chmodSync(commitMsgHook, 0o755);
  }
} catch (error) {
  console.warn(`Skipping git hook setup: ${error.message}`);
}
