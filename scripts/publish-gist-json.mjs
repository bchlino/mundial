#!/usr/bin/env node

import fs from "node:fs/promises";

function requireEnv(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function readJsonFile(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Input JSON must be an object");
  }
  return parsed;
}

async function updateGist(content) {
  const gistId = requireEnv("GIST_ID");
  const gistToken = requireEnv("GIST_TOKEN");
  const gistFileName = String(process.env.GIST_FILE_NAME || "matches.json").trim();

  const body = {
    files: {
      [gistFileName]: {
        content: JSON.stringify(content, null, 2),
      },
    },
  };

  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${gistToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gist update failed (${response.status}): ${errorBody.slice(0, 500)}`);
  }
}

async function main() {
  const inputPath = process.argv[2] || "scripts/data/test-matches.json";
  const payload = await readJsonFile(inputPath);

  payload.updatedAt = new Date().toISOString();

  await updateGist(payload);
  console.log(`Published ${inputPath} to gist successfully.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
