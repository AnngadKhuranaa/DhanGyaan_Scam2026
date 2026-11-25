import { useState, useEffect } from 'react';
import { Sparkles, ShieldCheck, Activity, MessageSquare, MessageCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const MOCK_TWEETS = [
  { text: "NIFTY breaking resistance levels today! #StockMarket", sentiment: "positive" },
  { text: "Cautious on BANKNIFTY right now, wait for dips.", sentiment: "neutral" },
  { text: "HDFC trailing down heavily, dragging the index.", sentiment: "negative" },
  { text: "Midcaps seeing crazy volume spikes...", sentiment: "positive" },
  { text: "Global cues look red, expect gap down opening.", sentiment: "negative" },
  { text: "A nice consolidation pattern forming on daily charts.", sentiment: "neutral" },
];

export default function Sidebar() {
  const [marketPulse, setMarketPulse] = useState({
    nifty: { symbol: 'NIFTY 50', changePercent: 0 },
    bankNifty: { symbol: 'BANKNIFTY', changePercent: 0 }
  });
  
  const [sentimentData, setSentimentData] = useState({
    summary: "Checking latest market sentiment...",
    label: "neutral"
  });

  const [tweets, setTweets] = useState([]);
  
  // 1) Fetch Market Pulse
  const fetchPulse = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/market/pulse`);
      const text = await response.text();
      const data = JSON.parse(text);
      if (data.pulse && data.pulse.length >= 2) {
        setMarketPulse({
          nifty: data.pulse.find(p => p.symbol.includes('NIFTY')),
          bankNifty: data.pulse.find(p => p.symbol.includes('BANKNIFTY'))
        });
      }
    } catch (error) {
      console.warn("Could not fetch pulse:", error);
    }
  };

  // 2) Fetch Sentiment
  const fetchSentiment = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sentiment/NIFTY`);
      const text = await response.text();
      const data = JSON.parse(text);
      
      if (data.sentimentScore !== undefined) {
        let label = "neutral";
        if (data.sentimentScore > 0.2) label = "positive";
        if (data.sentimentScore < -0.2) label = "negative";

        setSentimentData({
          summary: data.summary || "Sentiment looks balanced.",
          label
        });
      }
    } catch (error) {
      console.warn("Could not fetch sentiment:", error);
      setSentimentData({ summary: "Market outlook remains mostly neutral today.", label: "neutral" });
    }
  };

  // 3) Fetch / Generate Tweets
  const fetchTweets = () => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const randomTweet = MOCK_TWEETS[Math.floor(Math.random() * MOCK_TWEETS.length)];
    
    setTweets(prev => {
      const newTweets = [{ ...randomTweet, time: timestamp }, ...prev];
      return newTweets.slice(0, 8); // Keep latest 8 tweets
    });
  };

  useEffect(() => {
    fetchPulse();
    fetchSentiment();
    fetchTweets(); // initial tweets fetch
    fetchTweets(); 

    const tweetInterval = setInterval(fetchTweets, 30000);
    const pulseInterval = setInterval(fetchPulse, 60000); // refresh pulse every min
    
    return () => {
      clearInterval(tweetInterval);
      clearInterval(pulseInterval);
    };
  }, []);

  const getSentimentBadge = (label) => {
    switch (label) {
      case 'positive':
        return <span className="rounded-md bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-700">POSITIVE</span>;
      case 'negative':
        return <span className="rounded-md bg-rose-100 border border-rose-200 px-2 py-0.5 text-[10px] font-bold tracking-wide text-rose-700">NEGATIVE</span>;
      default:
        return <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold tracking-wide text-slate-700">NEUTRAL</span>;
    }
  };

  const getTweetColor = (sentiment) => {
    if (sentiment === 'positive') return 'border-l-4 border-emerald-500';
    if (sentiment === 'negative') return 'border-l-4 border-rose-500';
    return 'border-l-4 border-slate-300';
  };

  return (
    <aside className="hidden w-[340px] shrink-0 border-r border-slate-200/50 lg:flex flex-col h-screen overflow-hidden relative">
      {/* Gradient accent strip on left edge */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-indigo-500 via-brand-400 to-blue-500 opacity-60" />
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-slate-100/80 to-indigo-50/40" />
      <div className="absolute top-0 left-0 h-48 w-48 bg-indigo-200/20 rounded-full blur-[80px]" />
      
      <div className="relative z-10 flex flex-col h-full p-5 backdrop-blur-sm overflow-hidden">
      
      <div className="mb-5 px-1">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">AI Investment Insights</p>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" title="Live"></span>
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">
          Understand market behavior, investor sentiment, and risk exposure instantly.
        </p>
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto pr-2 pb-4 scrollbar-hide">
        
        {/* Core Metrics Card */}
        <div className="rounded-[1.25rem] border border-slate-200/50 bg-white/70 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md space-y-4">
          
          {/* AI Insight */}
          <div className="group">
            <div className="flex items-center gap-2 text-slate-800">
              <Sparkles size={16} className="text-indigo-500 transition-transform group-hover:scale-110" />
              <h3 className="text-sm font-semibold">AI Insight</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Tech sector shows mixed sentiment today. AI-driven stocks heavily outperforming the broader index.
            </p>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Risk Snapshot */}
          <div className="group">
            <div className="flex items-center gap-2 text-slate-800">
              <ShieldCheck size={16} className="text-emerald-500 transition-transform group-hover:scale-110" />
              <h3 className="text-sm font-semibold">Risk Snapshot</h3>
            </div>
            <div className="mt-2 flex items-center justify-between rounded-xl bg-gradient-to-r from-slate-50 to-indigo-50/40 p-2.5 outline outline-1 outline-slate-200/50">
              <span className="text-xs font-medium text-slate-600">Exposure</span>
              <span className="rounded-md bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-700 shadow-sm">
                MODERATE
              </span>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Market Pulse */}
          <div className="group">
            <div className="flex items-center gap-2 text-slate-800">
              <Activity size={16} className="text-blue-500 transition-transform group-hover:scale-110" />
              <h3 className="text-sm font-semibold">Market Pulse</h3>
            </div>
            <div className="mt-2 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50/30 p-2.5 outline outline-1 outline-slate-200/50 text-xs text-slate-600 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{marketPulse.nifty?.symbol || 'NIFTY 50'}</span>
                <span className={`font-bold ${(marketPulse.nifty?.changePercent || 0) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {(marketPulse.nifty?.changePercent || 0) > 0 ? '+' : ''}{marketPulse.nifty?.changePercent || '0.00'}%
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200/50 pt-2">
                <span className="font-medium">{marketPulse.bankNifty?.symbol || 'BANKNIFTY'}</span>
                <span className={`font-bold ${(marketPulse.bankNifty?.changePercent || 0) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {(marketPulse.bankNifty?.changePercent || 0) > 0 ? '+' : ''}{marketPulse.bankNifty?.changePercent || '0.00'}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* What Investors Are Saying */}
        <div className="rounded-[1.25rem] border border-slate-200/50 bg-white/70 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md">
          <div className="flex items-center gap-2 text-slate-800 mb-3">
            <MessageSquare size={16} className="text-indigo-500" />
            <h3 className="text-sm font-semibold">What Investors Say</h3>
          </div>
          <div className="flex items-end justify-between gap-2">
            <p className="text-xs leading-relaxed text-slate-500 line-clamp-3">
              {sentimentData.summary}
            </p>
            {getSentimentBadge(sentimentData.label)}
          </div>
        </div>

        {/* Live Market Buzz (Tweets) */}
        <div className="flex-1 min-h-[200px] flex flex-col rounded-[1.25rem] border border-slate-200/50 bg-gradient-to-b from-white/50 to-indigo-50/20 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md relative">
          <div className="flex items-center justify-between mb-3 text-slate-800">
            <div className="flex items-center gap-2">
              <MessageCircle size={16} className="text-blue-400" />
              <h3 className="text-sm font-semibold">Live Market Buzz</h3>
            </div>
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          
          <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[250px] pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {tweets.map((tweet, idx) => (
              <div key={idx} className={`rounded-lg bg-white p-3 shadow-sm text-xs text-slate-600 ${getTweetColor(tweet.sentiment)} animate-slide-up`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-slate-800">@TraderFlow</span>
                  <span className="text-[10px] text-slate-400">{tweet.time}</span>
                </div>
                <p className="line-clamp-2">{tweet.text}</p>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </aside>
  );
}
