const SHA256 = require('crypto-js/sha256')
const { v4: uuid } = require('uuid')

const getConfig = () => {
  const codeIdentifier = uuid()

  return {
    defaults: {
      origin: 'http://localhost:3000'
    },
    // we need to create a custom provider
    // https://github.com/simov/grant#custom-providers
    storyblok: {
      key: process.env.CONFIDENTIAL_CLIENT_ID,
      secret: process.env.CONFIDENTIAL_CLIENT_SECRET,
      redirect_uri: process.env.CONFIDENTIAL_CLIENT_REDIRECT_URI,
      callback: '/callback',
      authorize_url: 'https://app.storyblok.com/oauth/authorize',
      access_url: 'https://app.storyblok.com/oauth/token',
      oauth: 2,
      scope: 'read_content write_content',
      // create some custom parameters to send in URL
      // https://github.com/simov/grant#custom-parameters
      // this additional parameters are explain in Storyblok OAuth documentation
      custom_params: {
        code_chalenge: SHA256(codeIdentifier).toString(),
        code_chalenge_method: 'S256',
        state: codeIdentifier
      }
    }
  }
}

module.exports = getConfig