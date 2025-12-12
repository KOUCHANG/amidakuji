# あみだくじ

GitHub Pagesで動作するあみだくじアプリケーションです。

## 機能

- 参加者名と結果を自由に設定可能
- ランダムに横線を生成
- クリックでアニメーション付きで経路をトレース
- すべての結果を一度に表示する機能

## 使い方

1. 参加者の名前をカンマ区切りで入力
2. 結果/景品をカンマ区切りで入力（参加者と同じ数）
3. 横線の数を設定
4. 「あみだくじを生成」ボタンをクリック
5. 参加者名をクリックして結果を確認

## デモ

https://kouchang.github.io/amidakuji/

## ローカルでの実行

```bash
# リポジトリをクローン
git clone https://github.com/KOUCHANG/amidakuji.git
cd amidakuji

# index.htmlをブラウザで開く
open index.html
```

## デプロイ

変更をmainブランチにプッシュすると、GitHub Actionsが自動的に:
1. 最新のコミットハッシュとバージョン情報を埋め込む
2. `gh-pages`ブランチにデプロイ
3. GitHub Pagesで公開

```bash
# 変更をコミット＆プッシュするだけ
git add -A
git commit -m "Add new feature"
git push origin main
```

**重要**: GitHub Pagesの設定で、デプロイ元を`gh-pages`ブランチに設定してください:
1. リポジトリの Settings > Pages
2. Source: Deploy from a branch
3. Branch: `gh-pages` / `/ (root)`

mainブランチはソースコード用、gh-pagesブランチは公開用として分離されます。

ブラウザのコンソール（F12）でバージョン情報を確認できます。

## 技術スタック

- HTML5
- CSS3
- JavaScript (Vanilla)
- Canvas API

## ライセンス

MIT
