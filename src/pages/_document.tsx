import Document, { Html, Head, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="zh-CN">
        <Head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
          <meta name="description" content="时光回响 - 为老年人的回忆留下尊严的数字档案" />
        </Head>
        <body className="bg-paper-base text-ink-heavy font-serif">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
