// Utils intended for node.js/server use only

export function requireEnv(k: string): string {
  // NOTE: Only use this for env vars we do not expect to be replaced in code (e.g. NODE_ENV and BASE_URL)
  if (process.env.NODE_ENV !== 'production') {
    if (['BASE_URL', 'NODE_ENV'].indexOf(k) !== -1) {
      throw new Error(`Forbidden use of requireEnv. Use 'process.env.${k} instead.`)
    }
  }

  const v = process.env[k]
  if (!v) {
    throw new Error(`Missing required env var: ${k}`)
  }
  return v
}
