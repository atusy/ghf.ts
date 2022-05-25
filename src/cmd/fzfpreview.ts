function extractKey(x: string): string {
  return x.replace(/^\s+/, "").replace(/\s.*$/, "");
}

export async function fzfpreview(
  cmd: string,
  subcmd: string,
  args: string[],
): Promise<number> {
  if (args[0] == "--help") {
    console.log("Preview selection in ghf fzf.");
    return 0;
  }

  const p = Deno.run({
    cmd: [cmd, subcmd, "view", extractKey(args[0]), ...args.slice(1)],
  });
  const { code } = await p.status();
  return code;
}
