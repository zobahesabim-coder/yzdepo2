import { useState, useRef, useEffect } from "react";
import type { ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Mic,
  MicOff,
  Upload,
  Loader2,
  AlignLeft,
  BarChart2,
  Download,
  CheckCircle2,
  Square,
  AlertCircle,
} from "lucide-react";
import { addHistoryItem } from "@/lib/history";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

type ToneLabel = { id: string; label: string };

const TR_TONES: ToneLabel[] = [
  { id: "informative", label: "Bilgilendirici" },
  { id: "excited", label: "Heyecanlı / Enerjik" },
  { id: "questioning", label: "Soru Soran / Etkileşimli" },
  { id: "detailed", label: "Detaylı / Kapsamlı" },
  { id: "concise", label: "Kısa / Öz" },
];

const EN_TONES: ToneLabel[] = [
  { id: "informative", label: "Informative" },
  { id: "excited", label: "Excited / Energetic" },
  { id: "questioning", label: "Questioning / Interactive" },
  { id: "detailed", label: "Detailed / Comprehensive" },
  { id: "concise", label: "Brief / Concise" },
];

function toneLabelById(id: string, tones: ToneLabel[]): string {
  return tones.find((t) => t.id === id)?.label || tones[0].label;
}

/**
 * Turkish speech recognition often transliterates proper nouns and Turkish
 * characters into English approximations. This function corrects common
 * mismatches and restores Turkish characters that Chrome's tr-TR engine
 * sometimes drops.
 */
const TURKISH_CORRECTIONS: Record<string, string> = {
  // Common letter substitutions the engine makes in tr-TR mode
  "c": "ç", "g": "ğ", "i": "ı", "o": "ö", "s": "ş", "u": "ü",
};

// Words that should NOT be auto-corrected (keep as-is when the engine returns them)
const KEEP_AS_IS = new Set([
  "ve", "bir", "bu", "ile", "için", "ama", "fakat", "veya", "hem", "de", "da",
  "mi", "mı", "mu", "mü", "ki", "ne", "nasıl", "nerede", "neden", "niçin",
  "the", "and", "or", "but", "is", "are", "was", "were", "a", "an",
  "in", "on", "at", "to", "for", "of", "with", "from", "by",
]);

/**
 * Post-processes speech recognition output for Turkish mode. Restores Turkish
 * characters the engine may have dropped, without mangling English words
 * when the user switched to English mode.
 */
function postProcessTranscript(text: string, lang: "tr-TR" | "en-US"): string {
  if (lang !== "tr-TR") return text;

  // The Chrome tr-TR engine sometimes returns Turkish words with English
  // spelling (e.g. "cicek" instead of "çiçek"). We do targeted corrections
  // for well-known patterns without breaking valid words.
  const corrections: [RegExp, string][] = [
    // "cicek" -> "çiçek", "cocuk" -> "çocuk", "gurur" -> "gurur" (already correct)
    [/\bcicek\b/gi, "çiçek"],
    [/\bcocuk\b/gi, "çocuk"],
    [/\bogretmen\b/gi, "öğretmen"],
    [/\bogrenci\b/gi, "öğrenci"],
    [/\boglu\b/gi, "oğlu"],
    [/\bogretim\b/gi, "öğretim"],
    [/\bogren\b/gi, "öğren"],
    [/\bogrenmek\b/gi, "öğrenmek"],
    [/\bsaglik\b/gi, "sağlık"],
    [/\bsag\b/gi, "sağ"],
    [/\bsokak\b/gi, "sokak"],
    [/\bsesli\b/gi, "sesli"],
    [/\bsehir\b/gi, "şehir"],
    [/\bsimdi\b/gi, "şimdi"],
    [/\bsunu\b/gi, "şunu"],
    [/\bsu\b/gi, "şu"],
    [/\b gun\b/gi, " gün"],
    [/\bgun\b/gi, "gün"],
    [/\bguzel\b/gi, "güzel"],
    [/\bbugun\b/gi, "bugün"],
    [/\bogur\b/gi, "öğür"],
    [/\bmu?ller\b/gi, "müller"],
    [/\bhal?buki\b/gi, "halbuki"],
    [/\bmud?ur\b/gi, "müdür"],
    [/\bmud?ir\b/gi, "müdür"],
    [/\bokul\b/gi, "okul"],
    [/\bo?grenci\b/gi, "öğrenci"],
    [/\bagac\b/gi, "ağaç"],
    [/\byagmur\b/gi, "yağmur"],
    [/\byag\b/gi, "yağ"],
    [/\bdag\b/gi, "dağ"],
    [/\bdogru\b/gi, "doğru"],
    [/\bdog?a\b/gi, "doğa"],
    [/\bkus\b/gi, "kuş"],
    [/\bdus\b/gi, "düş"],
    [/\bdusun\b/gi, "düşün"],
    [/\bdusunce\b/gi, "düşünce"],
    [/\btesekkur\b/gi, "teşekkür"],
    [/\btesekkurler\b/gi, "teşekkürler"],
    [/\bmerhaba\b/gi, "merhaba"],
    [/\bselam\b/gi, "selam"],
    [/\bsinir\b/gi, "sinir"],
    [/\bcan\b/gi, "can"],
    [/\bcanim\b/gi, "canım"],
    [/\bkardes\b/gi, "kardeş"],
    [/\banne\b/gi, "anne"],
    [/\bbaba\b/gi, "baba"],
    [/\bakademik\b/gi, "akademik"],
    [/\buniversite\b/gi, "üniversite"],
    [/\bkutuphane\b/gi, "kütüphane"],
    [/\bkitap\b/gi, "kitap"],
    [/\bdefter\b/gi, "defter"],
    [/\bkalem\b/gi, "kalem"],
    [/\bsinav\b/gi, "sınav"],
    [/\bsinif\b/gi, "sınıf"],
    [/\bders\b/gi, "ders"],
    [/\bodev\b/gi, "ödev"],
    [/\bnot\b/gi, "not"],
    [/\bbasari\b/gi, "başarı"],
    [/\bbasarili\b/gi, "başarılı"],
    [/\bbasla\b/gi, "başla"],
    [/\bbaslangic\b/gi, "başlangıç"],
    [/\bsonuc\b/gi, "sonuç"],
    [/\bic\b/gi, "iç"],
    [/\bicin\b/gi, "için"],
    [/\bd?is\b/gi, "diş"],
    [/\bd?is?ari\b/gi, "dışarı"],
    [/\bic?eri\b/gi, "içeri"],
    [/\bk?irk\b/gi, "kırk"],
    [/\bk?irk?lik\b/gi, "kırklık"],
    [/\bos?man\b/gi, "osman"],
    [/\bos?manli\b/gi, "osmanlı"],
    [/\bturk\b/gi, "türk"],
    [/\bturkiye\b/gi, "türkiye"],
    [/\bturkce\b/gi, "türkçe"],
    [/\bismail\b/gi, "ismail"],
    [/\berdogan\b/gi, "erdoğan"],
    [/\bar?di?yan\b/gi, "erdoğan"],
    [/\bahmet\b/gi, "ahmet"],
    [/\bmehmet\b/gi, "mehmet"],
    [/\bayse\b/gi, "ayşe"],
    [/\bfatma\b/gi, "fatma"],
    [/\bmustafa\b/gi, "mustafa"],
    [/\bberat\b/gi, "berat"],
    [/\bsmg\b/gi, "SMG"],
    [/\bsmg?tal\b/gi, "SMG Tal"],
    [/\bokul\b/gi, "okul"],
    [/\byapay\b/gi, "yapay"],
    [/\bzeka\b/gi, "zekâ"],
    [/\bzeka\b/gi, "zeka"],
    [/\byapay zeka\b/gi, "yapay zeka"],
  ];

  let result = text;
  for (const [pattern, replacement] of corrections) {
    result = result.replace(pattern, replacement);
  }

  // Preserve proper nouns that the engine correctly recognized — don't
  // auto-lowercase words that look like they were already correct.
  return result;
}

type AnalysisResult = {
  summary: string;
  keyPoints: string[];
  tone: string;
  toneLabel: string;
  wordCount: number;
  sentenceCount: number;
  language: string;
  languageLabel: string;
};

type VoiceResult = {
  transcription: string;
  analysis: AnalysisResult;
};

// Common English stop words for keyword extraction
const EN_STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "be",
  "been", "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "must", "shall", "can", "need", "dare",
  "ought", "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
  "as", "into", "through", "during", "before", "after", "above", "below",
  "between", "under", "further", "then", "once", "here", "there", "when",
  "where", "why", "how", "all", "both", "each", "few", "more", "most",
  "other", "some", "such", "no", "not", "only", "own", "same", "so", "than",
  "too", "very", "s", "t", "i", "me", "my", "myself", "we", "our", "ours",
  "you", "your", "yours", "he", "him", "his", "she", "her", "it", "its",
  "they", "them", "their", "what", "which", "who", "whom", "this", "that",
  "these", "those", "am", "if", "because", "while", "about", "against",
  "up", "down", "out", "off", "over", "under", "again", "any", "each",
]);

// Turkish stop words
const TR_STOPWORDS = new Set([
  "ve", "bir", "bu", "için", "ile", "ben", "sen", "o", "biz", "siz", "onlar",
  "de", "da", "ki", "mi", "mı", "mu", "mü", "the", "bir", "çok", "daha",
  "en", "kadar", "gibi", "şey", "yani", "şu", "her", "hiç", "bile", "artık",
  "ama", "fakat", "lakin", "ancak", "çünkü", "madem", "eğer", "halbuki",
  "şimdi", "sonra", "önce", "böyle", "öyle", "belki", "demek", "tabi",
]);

function detectLanguage(text: string): "tr" | "en" {
  const lower = text.toLowerCase();
  // Score by stop word presence
  const words = lower.split(/\s+/).filter((w) => w.length > 0);
  let enHits = 0;
  let trHits = 0;
  for (const w of words) {
    const clean = w.replace(/[^a-zçğıöşü]/g, "");
    if (EN_STOPWORDS.has(clean)) enHits++;
    if (TR_STOPWORDS.has(clean)) trHits++;
  }
  // Turkish-specific characters strongly indicate Turkish
  if (/[çğıöşüÇĞİÖŞÜ]/.test(text)) trHits += 3;
  return enHits > trHits ? "en" : "tr";
}

function analyzeText(text: string): AnalysisResult {
  const lang = detectLanguage(text);
  const tones = lang === "en" ? EN_TONES : TR_TONES;
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const wordCount = words.length;
  const sentenceCount = sentences.length;

  const meaningfulSentences = sentences
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= 3);
  const keyPoints: string[] = [];
  const pickCount = Math.min(5, meaningfulSentences.length);
  const step = Math.max(1, Math.floor(meaningfulSentences.length / pickCount));
  for (let i = 0; i < meaningfulSentences.length && keyPoints.length < pickCount; i += step) {
    const s = meaningfulSentences[i];
    keyPoints.push(s.length > 80 ? s.slice(0, 80) + "..." : s);
  }

  let toneId = "informative";
  const exclamationCount = (text.match(/!/g) || []).length;
  const questionCount = (text.match(/\?/g) || []).length;
  if (exclamationCount > wordCount * 0.03) toneId = "excited";
  else if (questionCount > wordCount * 0.04) toneId = "questioning";
  else if (text.length > 500) toneId = "detailed";
  else if (wordCount < 30) toneId = "concise";

  const summary = meaningfulSentences.slice(0, 2).join(" ") || text.slice(0, 150);

  const noPointsMsg =
    lang === "en"
      ? "Text too short to extract key points."
      : "Metin çok kısa, anahtar nokta çıkarılamadı.";

  return {
    summary,
    keyPoints: keyPoints.length > 0 ? keyPoints : [noPointsMsg],
    tone: toneId,
    toneLabel: toneLabelById(toneId, tones),
    wordCount,
    sentenceCount,
    language: lang,
    languageLabel: lang === "en" ? "İngilizce" : "Türkçe",
  };
}

export default function VoiceTool() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [activeTab, setActiveTab] = useState<"transcript" | "analysis">("transcript");
  const [isLoading, setIsLoading] = useState(false);
  const [recognitionLang, setRecognitionLang] = useState<"tr-TR" | "en-US">("tr-TR");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTranscriptRef = useRef("");

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const startRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Tarayıcınız ses tanımayı desteklemiyor. Chrome veya Edge kullanın.");
      return;
    }

    const recognition = new SpeechRecognition() as SpeechRecognitionLike;
    recognition.lang = recognitionLang;
    recognition.continuous = true;
    recognition.interimResults = true;

    finalTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setResult(null);

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += postProcessTranscript(transcriptPart, recognitionLang) + " ";
        } else {
          interim += postProcessTranscript(transcriptPart, recognitionLang);
        }
      }
      if (final) {
        finalTranscriptRef.current += final;
        setTranscript(finalTranscriptRef.current);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        toast.error("Mikrofon erişimi reddedildi. Tarayıcı ayarlarından izin verin.");
      } else if (event.error === "no-speech") {
        // ignore
      } else {
        toast.error("Ses tanıma hatası: " + event.error);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    toast.info(
      recognitionLang === "en-US"
        ? "Listening... start speaking in English."
        : "Dinleniyor... Konuşmaya başlayın."
    );
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAnalyze = () => {
    const fullText = finalTranscriptRef.current.trim();
    if (!fullText) {
      toast.error("Önce ses kaydı yapın veya metin yükleyin.");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      const analysis = analyzeText(fullText);
      const voiceResult: VoiceResult = { transcription: fullText, analysis };
      setResult(voiceResult);
      addHistoryItem({
        toolType: "voice",
        metadata: JSON.stringify({ transcription: fullText, analysis }),
      });
      setIsLoading(false);
      toast.success("Analiz tamamlandı!");
    }, 400);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      finalTranscriptRef.current = text;
      setTranscript(text);
      setResult(null);
      toast.info("Metin yüklendi. Analiz için butona tıklayın.");
    };
    reader.readAsText(file, "UTF-8");
  };

  const downloadTranscript = () => {
    if (!result) return;
    const content = `TRANSKRİPSİYON\n${"=".repeat(40)}\n\n${result.transcription}\n\nANALİZ\n${"=".repeat(40)}\n\nÖzet: ${result.analysis.summary}\n\nAnahtar Noktalar:\n${result.analysis.keyPoints.map((p) => `• ${p}`).join("\n")}\n\nSes Tonu: ${result.analysis.toneLabel}\nKelime Sayısı: ${result.analysis.wordCount}\nCümle Sayısı: ${result.analysis.sentenceCount}\nDil: ${result.analysis.languageLabel}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transkripsiyon.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Transkripsiyon indirildi!");
  };

  const fullDisplay = transcript + (interimTranscript ? " " + interimTranscript : "");

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50/30 to-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Mic className="w-8 h-8 text-emerald-600" />
            <h1 className="text-4xl font-bold text-gray-900">Ses Aracı</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Mikrofonla konuşun veya metin yükleyin — transkripsiyon ve analiz alın
          </p>
        </div>

        {/* Language selector */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <button
            onClick={() => setRecognitionLang("tr-TR")}
            disabled={isRecording}
            className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
              recognitionLang === "tr-TR"
                ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                : "border-border bg-white text-muted-foreground hover:border-emerald-300"
            }`}
          >
            Türkçe
          </button>
          <button
            onClick={() => setRecognitionLang("en-US")}
            disabled={isRecording}
            className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
              recognitionLang === "en-US"
                ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                : "border-border bg-white text-muted-foreground hover:border-emerald-300"
            }`}
          >
            English
          </button>
        </div>

        {/* Recording Section */}
        <Card className="border-emerald-200 bg-emerald-50/50 mb-6">
          <CardContent className="pt-6 pb-6">
            <div className="text-center space-y-6">
              {/* Mic Button */}
              <div className="relative inline-block">
                {isRecording && (
                  <div className="absolute inset-0 rounded-full bg-red-400/30 animate-ping" />
                )}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
                    isRecording
                      ? "bg-red-500 hover:bg-red-600 shadow-red-500/30"
                      : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30"
                  }`}
                >
                  {isRecording ? (
                    <Square className="w-7 h-7 text-white" fill="white" />
                  ) : (
                    <Mic className="w-8 h-8 text-white" />
                  )}
                </button>
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {isRecording ? "Dinleniyor... Durdurmak için tıklayın" : "Kayıt başlatmak için mikrofona tıklayın"}
                </p>
                {isRecording && (
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-emerald-500 rounded-full animate-pulse"
                        style={{
                          height: `${8 + Math.random() * 16}px`,
                          animationDelay: `${i * 0.15}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Live Transcript */}
              {(transcript || interimTranscript) && (
                <div className="bg-white rounded-lg p-4 border border-emerald-200 text-left max-h-48 overflow-y-auto">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {transcript}
                    {interimTranscript && (
                      <span className="text-gray-400 italic"> {interimTranscript}</span>
                    )}
                  </p>
                </div>
              )}

              {/* File Upload & Analyze */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".txt,.md"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white text-sm font-medium text-foreground hover:bg-muted transition-all">
                    <Upload className="w-4 h-4" />
                    Metin Yükle
                  </span>
                </label>
                <Button
                  onClick={handleAnalyze}
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                  disabled={isLoading || !transcript.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analiz Yapılıyor...
                    </>
                  ) : (
                    <>
                      <BarChart2 className="w-4 h-4" />
                      Analiz Et
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <>
            <Card className="border-green-200 bg-green-50 mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="w-5 h-5" />
                  Analiz Tamamlandı
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 mb-4">
              {(["transcript", "analysis"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? "border-emerald-600 text-emerald-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab === "transcript" && "Transkripsiyon"}
                  {tab === "analysis" && "Analiz"}
                </button>
              ))}
            </div>

            {activeTab === "transcript" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlignLeft className="w-5 h-5" />
                    Ses Transkripsiyon
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                    <p className="text-gray-700 whitespace-pre-wrap">{result.transcription}</p>
                  </div>
                  <Button
                    onClick={downloadTranscript}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Transkripsiyon İndir
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeTab === "analysis" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart2 className="w-5 h-5" />
                    İçerik Analizi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Özet</h4>
                    <p className="text-gray-700">{result.analysis.summary}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Anahtar Noktalar</h4>
                    <ul className="space-y-2">
                      {result.analysis.keyPoints.map((point, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg"
                        >
                          <span className="text-emerald-600 font-bold mt-1">•</span>
                          <span className="text-gray-700">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Ses Tonu</p>
                      <p className="text-base font-semibold text-gray-900">
                        {result.analysis.toneLabel}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Kelime</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {result.analysis.wordCount}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Cümle</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {result.analysis.sentenceCount}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Dil</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {result.analysis.languageLabel}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Browser support notice */}
        {!result && !transcript && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800 mb-1">Tarayıcı Uyumluluğu</p>
                  <p className="text-xs text-amber-700/80">
                    Ses tanıma özelliği Chrome ve Edge tarayıcılarında çalışır. Türkçe veya
                    İngilizce seçip konuşabilirsiniz. Alternatif olarak metin dosyası yükleyip
                    analiz edebilirsiniz — analiz dili otomatik algılanır (Türkçe/İngilizce).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-8 bg-slate-50/50">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2025 SMG Yapay Zeka. Öğrenciler için tasarlandı.</p>
          <span className="text-sm font-bold text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text" style={{fontFamily: "'Poppins', sans-serif", fontWeight: "800", letterSpacing: "-0.3px"}}>Made by @Beratkarabudak</span>
        </div>
      </footer>
    </div>
  );
}
