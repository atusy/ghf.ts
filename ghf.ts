import { parse } from "https://deno.land/std@0.66.0/flags/mod.ts";

import { fzf } from "./src/cmd/fzf.ts";
import { fzfpreview } from "./src/cmd/fzfpreview.ts";
import { probeCommand } from "./src/utils.ts";

const ARGS = Deno.args;
const PARSED_ARGS = parse(Deno.args);
const POSITIONAL_ARGS = PARSED_ARGS["_"];

const CMD = "gh";
const SUBCMD = ARGS[0];

if (SUBCMD == "fzfpreview") {
  const code = await fzfpreview(CMD, ARGS[1], ARGS.slice(2));
  Deno.exit(code);
}

if (SUBCMD == "fzf") {
  const code = await fzf(CMD, ARGS[1], ARGS.slice(2));
  Deno.exit(code);
}

// fallback
if (
  PARSED_ARGS.help === true ||
  POSITIONAL_ARGS.length !== 1 ||
  SUBCMD === undefined ||
  !await probeCommand(["gh", SUBCMD, "list", "--help"])
) {
  console.log("fallback");
  const gh = Deno.run({ "cmd": ["gh", ...Deno.args] });
  const { code } = await gh.status();
  Deno.exit(code);
}

const code = await fzf(CMD, SUBCMD, ARGS.slice(1));
Deno.exit(code);
