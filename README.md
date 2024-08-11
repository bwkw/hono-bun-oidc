## リライングパーティーの起動方法

1. **依存関係をインストール**

    ```bash
    $ bun install
    ```

2. **コード上の以下のクライアント ID とクライアントシークレットを自身のものに変更する**

    ```text
    const CLIENT_ID         = 'YOUR_CLIENT_ID'
    const CLIENT_SECRET     = 'YOUR_CLIENT_SECRET'
    ```

3. **リライングパーティーを起動する**

    ```bash
    $ bun run index.ts
    ```
