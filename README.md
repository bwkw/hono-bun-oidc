## リライングパーティーの起動方法

1. **依存関係をインストール**

    ```bash
    $ bun install
    ```

2. **index.ts のクライアント ID とクライアントシークレットを自身のものに変更する**

    ```text
    const CLIENT_ID         = 'YOUR_CLIENT_ID'
    const CLIENT_SECRET     = 'YOUR_CLIENT_SECRET'
    ```

3. **リライングパーティーを起動する**

    ```bash
    $ bun run index.ts
    ```

4. **ログイン**  
http://127.0.0.1:3333/auth にアクセスし、画面に沿ってログイン操作を行い、ログインユーザー情報を取得できれば成功
