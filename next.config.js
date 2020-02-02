module.exports = () => {
  if (!process.env.BASE_URL) {
    throw new Error('Missing required env var at build-time')
  }
  return {
    env: {
      // Redefining BASE_URL here causes it to get replaced with a string at build-time
      BASE_URL: process.env.BASE_URL
    }
  }
}
