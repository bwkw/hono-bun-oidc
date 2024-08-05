import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { Issuer, generators } from 'openid-client'
import session from 'express-session'

const app = new Hono()
const port = 3000

// セッションの設定
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
}))

// Google OIDCプロバイダの設定
let googleIssuer

async function initializeGoogleIssuer() {
  googleIssuer = await Issuer.discover('https://accounts.google.com')
}

initializeGoogleIssuer().then(() => {
  console.log('Google issuer initialized')
})

const client = new googleIssuer.Client({
  client_id: 'your_client_id',
  client_secret: 'your_client_secret',
  redirect_uris: ['http://localhost:3000/callback'],
  response_types: ['code'],
})

// 認証のルート
app.get('/auth', (req, res) => {
  const code_verifier = generators.codeVerifier()
  const code_challenge = generators.codeChallenge(code_verifier)
  req.session.code_verifier = code_verifier

  const authorizationUrl = client.authorizationUrl({
    scope: 'openid email profile',
    code_challenge,
    code_challenge_method: 'S256',
  })

  res.redirect(authorizationUrl)
})

// コールバックのルート
app.get('/callback', async (req, res) => {
  const params = client.callbackParams(req)
  const tokenSet = await client.callback('http://localhost:3000/callback', params, {
    code_verifier: req.session.code_verifier,
  })
  req.session.tokenSet = tokenSet
  res.send('ログイン成功')
})

serve(app, { port })
console.log(`Listening on http://localhost:${port}`)
