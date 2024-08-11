import { Hono } from 'hono'
import { jwtVerify, createRemoteJWKSet } from 'jose'

// グローバル定数
const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_ENDPOINT = 'https://www.googleapis.com/oauth2/v4/token'
const USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo'
const JWKS_URI = 'https://www.googleapis.com/oauth2/v3/certs'

const REDIRECT_URI = 'http://127.0.0.1:3333/callback'
const CLIENT_ID = 'YOUR_CLIENT_ID'
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET'

const app = new Hono()

// 認証用ページ
app.get('/auth', (c) => {
  const responseType = 'code'
  const scope = encodeURIComponent('openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile')
  const authUrl = `${AUTH_ENDPOINT}?response_type=${responseType}&client_id=${encodeURIComponent(CLIENT_ID)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scope}`
  
  console.log(`Redirecting to: ${authUrl}`) 
  return c.redirect(authUrl)
})

// コールバック用
app.get('/callback', async (c) => {
  const url = new URL(c.req.url)
  const code = url.searchParams.get('code')

  if (!code) {
    return c.text('Authorization code not found', 400)
  }

  const tokenResponse = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code: code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  })

  const tokenData = await tokenResponse.json()
  console.log('Token response:', tokenData) 

  if (!tokenData.id_token) {
    return c.text('Failed to obtain ID token', 400)
  }

  // IDトークンの検証
  const idToken = tokenData.id_token

  // Google の公開鍵を取得
  try {
    // JWKS URIを使ってリモートからキーセットを取得
    const JWKS = createRemoteJWKSet(new URL(JWKS_URI))
  
    // IDトークンを検証
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: 'https://accounts.google.com', // 発行者の確認
      audience: CLIENT_ID, // クライアントIDの確認
    })
    console.log('ID Token verified successfully:', payload)
  } catch (error) {
    console.error('ID Token verification failed:', error)
    
    return c.text('ID Token verification failed', 400)
  }

  // UserInfo エンドポイントから追加情報を取得
  const userInfoResponse = await fetch(USERINFO_ENDPOINT, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  })

  const userInfo = await userInfoResponse.json()

  return c.json(userInfo)
})

export default { 
  port: 3333, 
  fetch: app.fetch, 
}
