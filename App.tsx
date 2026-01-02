
import React, { useState, useRef } from 'react';
import { analyzeVideo, generateVariationImage } from './services/geminiService';
import { Variation } from './types';

interface VideoPrompts {
  process: string;
  result: string;
}

const App: React.FC = () => {
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [videoPrompts, setVideoPrompts] = useState<VideoPrompts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMimeType(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoFile(reader.result as string);
        setVariations([]);
        setVideoPrompts(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async () => {
    if (!videoFile) return;
    try {
      setIsAnalyzing(true);
      setError(null);
      setVariations([]); 
      const base64Data = videoFile.split(',')[1];
      const analysis = await analyzeVideo(base64Data, mimeType);
      setVideoPrompts(analysis.videoPrompts);
      
      const initialVariations: Variation[] = analysis.storyboard.map((v, idx) => ({
        id: idx,
        title: v.title,
        style: v.style,
        prompt: v.imagePrompt,
        loading: true,
      }));
      setVariations(initialVariations);
      setIsAnalyzing(false);

      // توليد الصور بالتتابع لضمان عدم الفشل
      for (let i = 0; i < initialVariations.length; i++) {
        await generateFrameImage(i, initialVariations[i].prompt);
      }
    } catch (err: any) {
      setError('حدث خطأ في استخراج DNA الفيديو. يرجى تجربة فيديو أقصر.');
      setIsAnalyzing(false);
    }
  };

  const generateFrameImage = async (index: number, prompt: string) => {
    setVariations(prev => prev.map(p => p.id === index ? { ...p, loading: true } : p));
    try {
      const imgUrl = await generateVariationImage(prompt);
      setVariations(prev => prev.map(p => p.id === index ? { ...p, imageUrl: imgUrl, loading: false } : p));
    } catch (err) {
      setVariations(prev => prev.map(p => p.id === index ? { ...p, loading: false, error: 'Locked' } : p));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('تم نسخ برومبت Sora للذاكرة!');
  };

  const downloadImage = (base64Data: string, filename: string) => {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = `${filename}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-green-500/30 font-sans p-6 md:p-10">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between mb-12 border-b border-white/5 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.4)]">
             <span className="font-black text-black text-xl">S</span>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase italic">SORA STUDIO <span className="text-green-500">PRO</span></h1>
            <p className="text-[9px] text-zinc-500 font-bold tracking-[0.3em] uppercase">Desktop DNA Extraction Engine</p>
          </div>
        </div>
        <div className="flex gap-6 items-center">
           <span className="text-zinc-600 text-[10px] font-black tracking-widest uppercase hidden md:block">Safety Mode: Active</span>
           <button onClick={() => window.location.reload()} className="px-5 py-2 bg-zinc-900 border border-white/5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">New Project</button>
        </div>
      </nav>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        
        {/* Left Side: Upload & Input */}
        <div className="xl:col-span-4 flex flex-col gap-8">
          <div className="bg-zinc-900/40 rounded-[2.5rem] p-8 border border-white/5 backdrop-blur-3xl sticky top-10">
            {!videoFile ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group border-2 border-dashed border-zinc-800 hover:border-green-600/50 hover:bg-green-600/5 transition-all duration-500 rounded-[2rem] h-[450px] flex flex-col items-center justify-center cursor-pointer overflow-hidden relative"
              >
                <div className="z-10 text-center px-8">
                  <div className="w-16 h-16 bg-zinc-950 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-all border border-white/5">
                    <svg className="w-8 h-8 text-zinc-600 group-hover:text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h3 className="text-white font-black text-lg mb-2">إسقاط الفيديو هنا</h3>
                  <p className="text-zinc-500 text-xs leading-relaxed">ارفع فيديو المصدر لبدء عملية استخراج <br/>البرومبتات الخاصة بموقع Sora</p>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="video/*" />
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                <div className="relative aspect-[9/16] w-full max-w-[300px] mx-auto rounded-[2rem] overflow-hidden border-4 border-zinc-800 shadow-4xl group">
                   <video src={videoFile} controls className="w-full h-full object-cover" />
                   {isAnalyzing && (
                     <div className="absolute inset-0 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center z-20 text-center p-8">
                        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-6" />
                        <p className="text-green-500 font-black uppercase tracking-widest text-[9px] animate-pulse italic">Decoding Video Assets...</p>
                     </div>
                   )}
                </div>
                <button 
                  onClick={startAnalysis}
                  disabled={isAnalyzing}
                  className="w-full py-5 bg-green-600 text-black hover:bg-green-500 disabled:opacity-50 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all shadow-[0_15px_40px_rgba(34,197,94,0.15)]"
                >
                  {isAnalyzing ? 'يتم الاستخراج...' : 'استخراج DNA لـ SORA'}
                </button>
              </div>
            )}
            {error && <p className="mt-6 text-red-500 text-center font-bold text-xs uppercase tracking-widest animate-pulse">{error}</p>}
          </div>
        </div>

        {/* Right Side: Results */}
        <div className="xl:col-span-8 space-y-12">
          
          {/* Master Prompt Card */}
          {videoPrompts && (
            <div className="bg-zinc-900/20 rounded-[3rem] p-10 md:p-14 border border-green-500/10 backdrop-blur-3xl animate-slide-up relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-10 select-none pointer-events-none opacity-[0.03]">
                  <span className="text-white font-black text-[12rem] italic leading-none">DNA</span>
               </div>
               
               <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                  <div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2 text-white">SORA MASTER PROMPT</h2>
                    <p className="text-green-500/60 text-[10px] font-black uppercase tracking-[0.5em]">البرومبت الكامل المخصص لـ OpenAI Sora</p>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(videoPrompts.process)}
                    className="flex items-center gap-4 bg-white text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-500 transition-all shadow-2xl active:scale-95 shrink-0"
                  >
                    Copy Master Prompt
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                  </button>
               </header>

               <div className="bg-black/40 rounded-[2.5rem] p-10 border border-white/5 shadow-inner">
                  <p className="text-zinc-400 text-lg md:text-xl leading-relaxed italic text-right font-medium" dir="rtl">
                    {videoPrompts.process}
                  </p>
               </div>
               
               <div className="mt-8 flex flex-wrap gap-4">
                  <div className="bg-zinc-950 px-5 py-3 rounded-xl border border-white/5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">RES: 4K HIGH-BITRATE</div>
                  <div className="bg-zinc-950 px-5 py-3 rounded-xl border border-white/5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">ENGINE: SORA ARCHV1</div>
                  <div className="bg-zinc-950 px-5 py-3 rounded-xl border border-white/5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">ASPECT: 9:16 VERTICAL</div>
               </div>
            </div>
          )}

          {/* Keyframes Grid */}
          {variations.length > 0 && (
            <div className="animate-slide-up delay-100">
               <h3 className="text-xl font-black uppercase italic tracking-widest mb-10 text-zinc-400 border-l-4 border-green-600 pl-6">REPLICATED KEYFRAMES</h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {variations.map((v, index) => (
                    <div key={v.id} className="group relative">
                       <div className="w-full aspect-[9/16] bg-zinc-950 rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl relative group-hover:border-green-500/40 transition-all duration-700">
                          {v.imageUrl && !v.loading && (
                            <img src={v.imageUrl} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-[3s] group-hover:scale-110" alt={v.title} />
                          )}
                          {v.loading && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                              <div className="w-10 h-10 border-2 border-green-600 border-t-transparent rounded-full animate-spin mb-4" />
                              <span className="text-green-500 font-black text-[8px] uppercase tracking-[0.3em] animate-pulse">Building Frame {index+1}</span>
                            </div>
                          )}
                          
                          {/* Hover Actions */}
                          {!v.loading && v.imageUrl && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-black/70 backdrop-blur-sm z-20 p-6">
                               <button onClick={() => downloadImage(v.imageUrl!, `sora-keyframe-${index+1}`)} className="w-full bg-white text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-green-500 transition-all transform hover:-translate-y-1 mb-3">Download PNG</button>
                               <button onClick={() => generateFrameImage(index, v.prompt)} className="w-full bg-zinc-900 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest border border-white/10 hover:bg-zinc-800">Regenerate</button>
                            </div>
                          )}

                          <div className="absolute bottom-8 left-8 right-8 pointer-events-none group-hover:translate-y-2 transition-transform z-10">
                             <span className="text-green-500 text-[9px] font-black uppercase tracking-[0.4em] mb-2 block">SORA SHOT</span>
                             <h4 className="text-white text-base font-black uppercase leading-tight tracking-tighter drop-shadow-2xl">{v.title}</h4>
                          </div>
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Background Matrix Decorative Effect */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-[-1] overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full flex flex-wrap gap-10 font-mono text-[10px]">
            {Array.from({length: 100}).map((_, i) => (
              <span key={i} className="animate-pulse">SORA_ENGINE_v4.0_EXTRACTION_PROCESS_ID_{Math.random().toString(16).slice(2, 8).toUpperCase()}</span>
            ))}
         </div>
      </div>
    </div>
  );
};

export default App;
