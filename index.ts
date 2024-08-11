import { Hono } from 'hono'
import { jwtVerify, createRemoteJWKSet } from 'jose'

// グローバル定数
const AUTH_ENDPOINT     = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_ENDPOINT    = 'https://www.googleapis.com/oauth2/v4/token'
const USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo'
const JWKS_URI          = 'https://www.googleapis.com/oauth2/v3/certs'
const REDIRECT_URI      = 'http://127.0.0.1:3333/callback'
const CLIENT_ID         = 'YOUR_CLIENT_ID'
const CLIENT_SECRET     = 'YOUR_CLIENT_SECRET'

const app = new Hono()

// 認証用ページ
app.get('/auth', (c) => {
  // 認証リクエストを構築
  const responseType = 'code'
  const scope = encodeURIComponent('openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile')
  const authUrl = `${AUTH_ENDPOINT}?response_type=${responseType}&client_id=${encodeURIComponent(CLIENT_ID)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scope}`
  
  console.log(`Redirecting to: ${authUrl}`) 
  return c.redirect(authUrl) // 認可エンドポイントにリダイレクトして、ユーザー認証を開始
})

// コールバック用
app.get('/callback', async (c) => {
  // 認可コードを受け取る
  const url = new URL(c.req.url)
  const code = url.searchParams.get('code')

  if (!code) {
    return c.text('Authorization code not found', 400)
  }

  // 認可コードを使用してトークンをリクエスト
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
      grant_type: 'authorization_code', // 認可コードを使ってトークンをリクエストするための指定
    }),
  })

  // トークンレスポンスを確認
  const tokenData = await tokenResponse.json()
  console.log('Token response:', tokenData) 

  // ID トークンの存在確認
  if (!tokenData.id_token) {
    return c.text('Failed to obtain ID token', 400)
  }

  // ID トークンの検証
  const idToken = tokenData.id_token

  try {
    // JWKS URI を使ってリモートからキーセットを取得
    const JWKS = createRemoteJWKSet(new URL(JWKS_URI))
  
    // ID トークンを検証
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: 'https://accounts.google.com', // 発行者の確認
      audience: CLIENT_ID, // クライアント ID の確認
    })
    console.log('ID Token verified successfully:', payload) // トークンのペイロードを確認
  } catch (error) {
    console.error('ID Token verification failed:', error)
    return c.text('ID Token verification failed', 400) // 検証が失敗した場合
  }

  // UserInfo エンドポイントから追加情報を取得
  const userInfoResponse = await fetch(USERINFO_ENDPOINT, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`, // アクセストークンを使用してリクエスト
    },
  })

  const userInfo = await userInfoResponse.json()

  return c.json(userInfo) // ユーザー情報を返す
})

export default { 
  port: 3333, 
  fetch: app.fetch, 
}

console.log('Open http://127.0.0.1:3333/auth')
