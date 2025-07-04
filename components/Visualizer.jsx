import { useEffect, useRef, useState } from 'react';

export default function Visualizer() {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [error, setError] = useState('');
  const [analyser, setAnalyser] = useState(null);
  const [ctxAudio, setCtxAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [eqLow, setEqLow] = useState(0);
  const [eqMid, setEqMid] = useState(0);
  const [eqHigh, setEqHigh] = useState(0);

  const setupAudio = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const buffer = await ctx.decodeAudioData(arrayBuffer);
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gainNode = ctx.createGain();
      gainNode.gain.value = volume;

      const filterLow = ctx.createBiquadFilter();
      filterLow.type = 'lowshelf';
      filterLow.frequency.value = 200;
      filterLow.gain.value = eqLow;

      const filterMid = ctx.createBiquadFilter();
      filterMid.type = 'peaking';
      filterMid.frequency.value = 1000;
      filterMid.Q.value = 1;
      filterMid.gain.value = eqMid;

      const filterHigh = ctx.createBiquadFilter();
      filterHigh.type = 'highshelf';
      filterHigh.frequency.value = 3000;
      filterHigh.gain.value = eqHigh;

      const analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 1024;

      source.connect(gainNode);
      gainNode.connect(filterLow);
      filterLow.connect(filterMid);
      filterMid.connect(filterHigh);
      filterHigh.connect(analyserNode);
      analyserNode.connect(ctx.destination);

      source.start(0);
      setCtxAudio({ ctx, source, gainNode, filterLow, filterMid, filterHigh });
      setAnalyser(analyserNode);
      setError('');
      setIsPlaying(true);
    } catch (e) {
      setError('Erreur lors du chargement du fichier. Veuillez choisir un MP3 valide.');
    }
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setError('Aucun fichier sélectionné.');
      return;
    }
    if (!file.type.includes('audio/mp3') && !file.name.endsWith('.mp3')) {
      setError('Format non supporté. Choisissez un MP3.');
      return;
    }
    setupAudio(file);
  };

  // drag & drop
  useEffect(() => {
    const canvas = canvasRef.current;
    const preventDefaults = (e) => { e.preventDefault(); e.stopPropagation(); };
    ['dragenter','dragover','dragleave','drop'].forEach(evt => {
      canvas.addEventListener(evt, preventDefaults);
    });
    canvas.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const [file] = dt.files;
      handleFile({ target: { files: [file] } });
    });
  }, []);

  // Controls update
  useEffect(() => {
    if (ctxAudio) ctxAudio.gainNode.gain.value = volume;
  }, [volume, ctxAudio]);

  useEffect(() => {
    if (ctxAudio) ctxAudio.filterLow.gain.value = eqLow;
  }, [eqLow, ctxAudio]);

  useEffect(() => {
    if (ctxAudio) ctxAudio.filterMid.gain.value = eqMid;
  }, [eqMid, ctxAudio]);

  useEffect(() => {
    if (ctxAudio) ctxAudio.filterHigh.gain.value = eqHigh;
  }, [eqHigh, ctxAudio]);

  // draw loop
  useEffect(() => {
    if (!analyser) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let rafId;
    const draw = () => {
      const bufferLen = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLen);
      analyser.getByteTimeDomainData(dataArray);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#0ff';
      ctx.beginPath();
      const sliceWidth = canvas.width / bufferLen;
      let x = 0;
      for (let i = 0; i < bufferLen; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        ctx.lineTo(x, y + (Math.random() - 0.5) * 5);
        x += sliceWidth;
      }
      ctx.stroke();
      rafId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(rafId);
  }, [analyser]);

  // Resize canvas
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <div style={{ position:'relative', fontFamily:'Press Start 2P, monospace', color:'#0ff' }}>
      <canvas ref={canvasRef} style={{ display:'block' }} />
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFile}
        style={{
          position:'absolute', top:10, left:10, background:'#111', color:'#0ff',
          border:'1px solid #0ff', padding:8, borderRadius:4, zIndex:10
        }}
      />
      {error && <div style={{ position:'absolute', top:50, left:10, color:'red', fontSize:12 }}>{error}</div>}
      {/* Controls bar */}
      <div style={{
        position:'absolute', bottom:0, left:0, width:'100%', padding:10,
        background:'rgba(0,0,0,0.7)', display:'flex', gap:10, alignItems:'center'
      }}>
        <button onClick={() => {
          if (ctxAudio && ctxAudio.source) {
            if (isPlaying) ctxAudio.source.stop();
            else setupAudio(ctxAudio.source.buffer);
            setIsPlaying(!isPlaying);
          }
        }} style={{ background:'#0ff', color:'#000', padding:8, border:'none', borderRadius:4 }}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <label>Vol</label>
        <input type="range" min="0" max="1" step="0.01" value={volume}
          onChange={e => setVolume(parseFloat(e.target.value))} />
        <label>Basses</label>
        <input type="range" min="-15" max="15" step="1" value={eqLow}
          onChange={e => setEqLow(parseFloat(e.target.value))} />
        <label>Médiums</label>
        <input type="range" min="-15" max="15" step="1" value={eqMid}
          onChange={e => setEqMid(parseFloat(e.target.value))} />
        <label>Aigus</label>
        <input type="range" min="-15" max="15" step="1" value={eqHigh}
          onChange={e => setEqHigh(parseFloat(e.target.value))} />
      </div>
    </div>
  );
}