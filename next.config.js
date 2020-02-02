module.exports = {
  env: {
    // Redefining BASE_URL here causes it to get replaced with a string at build-time
    BASE_URL: process.env.BASE_URL
  }
}
