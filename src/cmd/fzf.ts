import { readLines } from "https://deno.land/std@0.89.0/io/mod.ts";
import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.78.0/path/mod.ts";

import { getEnv, probeCommand } from "../utils.ts";

function extractKey(x: string): string {
  return x.replace(/^\s+/, "").replace(/\s.*$/, "");
}

async function issuePreviewCmd(subcmd: string): Promise<string> {
  let hasCmd = false;
  try {
    hasCmd = await probeCommand(["ghf", "fzfpreview"]);
  } catch (NotFound) {
    hasCmd = false;
  }

  if (hasCmd) {
    return `ghf fzfpreview ${subcmd} {}`;
  }

  const previewTs = join(
    dirname(dirname(dirname(fromFileUrl(import.meta.url)))),
    "ghf.ts",
  );
  return `deno run --allow-run '${previewTs}' fzfpreview ${subcmd} {}`;
}

export async function fzfList(cmd: string, subcmd: string, args: string[]) {
  const listProcess = Deno.run({
    "cmd": [cmd, subcmd, "list", ...args],
    "stdout": "piped",
  });

  const fzfCmd = ["fzf", "--preview", await issuePreviewCmd(subcmd)];
  const fzfProcess = Deno.run({
    cmd: fzfCmd,
    stdin: "piped",
    stdout: "piped",
  });
  listProcess.stdout.readable.pipeTo(fzfProcess.stdin.writable, {});

  const fzfStatus = await fzfProcess.status();
  const selections: string[] = [];
  for await (let line of readLines(fzfProcess.stdout)) {
    if (line !== "") {
      selections.push(extractKey(line));
    }
  }

  listProcess.close(); // no longer needed once fuzzy search has done
  fzfProcess.close();

  return { code: fzfStatus.code, selections };
}

async function fzfView(
  cmd: string,
  subcmd: string,
  args: string[],
  selections: string[],
): Promise<number> {
  const GHF_VIEWER = getEnv("GHF_VIEWER", "web");
  // If not tty, echo keys to stdout
  if (!Deno.isatty(Deno.stdout.rid) || GHF_VIEWER === "id") {
    selections.forEach((x) => console.log(x));
    return 0;
  }

  // View
  async function view(key: string): Promise<Number> {
    const viewCmd = [cmd, subcmd, "view", key, ...args];
    if (GHF_VIEWER === "web") {
      viewCmd.push("--web");
    }
    const p = Deno.run({ cmd: viewCmd });
    const { code } = await p.status();
    p.close();
    return code;
  }

  selections.forEach((x) => view(x));

  return 0;
}

export async function fzf(cmd: string, subcmd: string, args: string[]) {
  const { code, selections } = await fzfList(cmd, subcmd, args);
  await fzfView(cmd, subcmd, [], selections);
  return code;
}
