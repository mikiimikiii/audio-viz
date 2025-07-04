import Head from 'next/head'
import dynamic from 'next/dynamic'

const AudioVisualizer = dynamic(() => import('../visualizer'), { ssr: false });

export default function Home() {
  return (
    <>
      <Head>
        <title>Audio Visualizer</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <AudioVisualizer />
    </>
  );
}