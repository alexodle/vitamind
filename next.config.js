const { PHASE_DEVELOPMENT_SERVER } = require('next/constants')

module.exports = (phase) => {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    return {
      env: {
        BASE_URL: 'http://localhost:3000'
      }
    }
  }

  return {
    env: {
      BASE_URL: 'http://ec2-54-227-104-71.compute-1.amazonaws.com:3000'
    }
  }
}
