export async function probeCommand(
  cmd: string[],
  exitCode: number = 0,
): Promise<boolean> {
  const p = Deno.run({
    "cmd": cmd,
    "stdin": "null",
    "stdout": "null",
    "stderr": "null",
  });
  const { code } = await p.status();
  return code === exitCode;
}

export function getEnv(key: string, defaultValue: string): string {
  const value = Deno.env.get(key);
  return value === undefined ? defaultValue : value;
}
