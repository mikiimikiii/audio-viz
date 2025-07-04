import Head from 'next/head';
import Visualizer from '../components/Visualizer';

export default function Home() {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Glitchcore Audio Visualizer</title>
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
        {/* Analytics placeholder */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=UA-XXXXX-X"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'UA-XXXXX-X');
          `,
        }} />
      </Head>
      <Visualizer />
    </>
  );
}