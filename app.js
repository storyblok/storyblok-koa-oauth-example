// setting the environment variables
require('dotenv').config()

// the nodejs imports
const path = require('path')

// the koa imports
const Koa = require('koa')
const session = require('koa-session')
const Router = require('koa-router')
const koaqs = require('koa-qs')
const render = require('koa-ejs')
const serve = require('koa-static')
const bodyParser = require('koa-bodyparser')

const grant = require('grant').koa()
const grantConfig = require('./utils/factory-grant-config')()

const getTokenFromCode = require('./utils/get-token-from-code')
const getStoryblokClient = require('./utils/get-storyblok-client')

// Instantiating our app
const app = new Koa()

// setup application key for session
app.keys = ['grant', 'storyblok']

// use koa middlewares
app.use(bodyParser())
app.use(session(app))
koaqs(app)

// use the grant middleware with the grantConfig
app.use(grant(grantConfig))

// setup the views folder as a folder for our templates
render(app, {
  root: path.join(__dirname, 'views'),
  layout: 'template',
  viewExt: 'html',
  cache: false,
  debug: false,
  async: true
})

// use koa-static middleware for serve the public folder as static folder
app.use(serve(path.join(__dirname, '/public')))

// Initializing the router
const router = new Router()

router
  .get('/', async ctx => {
    // get the space_id from the URL
    const { space_id } = ctx.query

    // render the home page passing the space_id and access_token values
    await ctx.render('home', {
      space_id,
      access_token: ctx.session.access_token
    })
  })
  // let's register a callback route to get the token data
  .get('/callback', async ctx => {
    // for now, we will not use the space_id
    const { space_id, code } = ctx.query
    try {
      const config = {
        grant_type: 'authorization_code',
        code,
        client_id: grantConfig.storyblok.key,
        client_secret: grantConfig.storyblok.secret,
        redirect_uri: grantConfig.storyblok.redirect_uri
      }
      const { access_token, refresh_token } = await getTokenFromCode(
        grantConfig.storyblok.access_url,
        config
      )

      ctx.session.application_code = code
      ctx.session.access_token = access_token
      ctx.session.refresh_token = refresh_token

      // redirecting to the root route passing the space id as parameter
      ctx.redirect(`/?space_id=${space_id}`)
    } catch (e) {
      console.log(e)
      ctx.status = e.response.status
      ctx.body = {
        error: true,
        message: e.message
      }
    }
  })
  .get('/explore/:space_id/:resource', async ctx => {
    const { space_id, resource } = ctx.params

    const client = getStoryblokClient(ctx.session.access_token)

    try {
      const response = await client.get(`spaces/${space_id}/${resource}`)

      ctx.body = response.data
    } catch (e) {
      ctx.status = e.response.status
      ctx.body = {
        error: true,
        message: e.message
      }
    }
  })
  .post('/explore/:space_id/:resource', async ctx => {
    const { space_id, resource } = ctx.params
    const client = getStoryblokClient(ctx.session.access_token)
    const body = ctx.request.body

    try {
      const response = await client.post(`spaces/${space_id}/${resource}`, body)

      ctx.body = response.data
    } catch (e) {
      ctx.status = e.response.status
      ctx.body = {
        error: true,
        message: e.message
      }
    }
  })
  .put('/explore/:space_id/:resource/:id', async ctx => {
    const { space_id, resource, id } = ctx.params
    const client = getStoryblokClient(ctx.session.access_token)
    const body = ctx.request.body

    try {
      const response = await client.put(`spaces/${space_id}/${resource}/${id}`, body)

      ctx.body = response.data
    } catch (e) {
      ctx.status = e.response.status
      ctx.body = {
        error: true,
        message: e.message
      }
    }
  })
  .delete('/explore/:space_id/:resource/:id', async ctx => {
    const { space_id, resource, id } = ctx.params
    const client = getStoryblokClient(ctx.session.access_token)

    try {
      const response = await client.delete(`spaces/${space_id}/${resource}/${id}`)

      ctx.body = response.data
    } catch (e) {
      ctx.status = e.response.status
      ctx.body = {
        error: true,
        message: e.message
      }
    }
  })
  .get('/refresh', async ctx => {
    const { space_id } = ctx.query
    try {
      const config = {
        grant_type: 'refresh_token',
        refresh_token: ctx.session.refresh_token,
        client_id: grantConfig.storyblok.key,
        client_secret: grantConfig.storyblok.secret,
        redirect_uri: grantConfig.storyblok.redirect_uri
      }
      const { access_token, refresh_token } = await getTokenFromCode(
        grantConfig.storyblok.access_url,
        config
      )

      ctx.session.access_token = access_token
      ctx.session.refresh_token = refresh_token

      ctx.redirect(`/?space_id=${space_id}`)
    } catch (e) {
      console.log(e)
      ctx.status = e.response.status
      ctx.body = {
        error: true,
        message: e.response.data.error_description
      }
    }
  })

// use the router instance and initialize the server
app
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(3000)

console.log('Server listen on port 3000')