module.exports = () => {
  const prod = process.env.NODE_ENV === 'production'
  if (!process.env.BASE_URL || (prod && !process.env.CDN_URL)) {
    throw new Error('Missing required env var at build-time')
  }
  return {
    env: {
      BASE_URL: process.env.BASE_URL,
      ASSET_URL: prod ? process.env.CDN_URL : process.env.BASE_URL,
    }
  }
}
