import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  Download,
  Loader2,
  Sparkles,
  Wand2,
  Languages,
} from "lucide-react";
import { addHistoryItem } from "@/lib/history";

const POLLINATIONS_API_KEY = "sk_1zl0iJqBjHz8AzzHFp4anukql4ECFB0U";

type LogoStyle = {
  id: string;
  label: string;
  desc: string;
  promptKeyword: string;
};

const logoStyles: LogoStyle[] = [
  { id: "geometric", label: "Geometrik", desc: "Keskin şekiller ve sembol", promptKeyword: "geometric logo with sharp shapes, clean polygons, professional brand mark" },
  { id: "minimal", label: "Minimal", desc: "Sade, az detay", promptKeyword: "minimalist logo, clean simple design, flat vector, lots of whitespace" },
  { id: "badge", label: "Rozet", desc: "Daire içinde marka adı", promptKeyword: "badge emblem logo, circular emblem with brand name inside, vintage style" },
  { id: "modern", label: "Modern", desc: "Gradyan ve kalın tipografi", promptKeyword: "modern logo with gradient colors, bold typography, sleek contemporary design" },
  { id: "tech", label: "Teknoloji", desc: "Kod/dijital temalı ikon", promptKeyword: "tech startup logo, digital futuristic icon, circuit or code themed, blue tones" },
  { id: "elegant", label: "Zarif", desc: "İnce çizgi, serif tipografi", promptKeyword: "elegant luxury logo, fine line art, serif typography, sophisticated premium brand" },
];

type LogoResult = {
  imageUrl: string;
  brandName: string;
  style: string;
  englishPrompt: string;
  translatedName: string;
};

/**
 * Translates Turkish text to English using Pollinations.ai text API.
 * Returns the English translation, or the original text if translation fails.
 */
async function translateToEnglish(text: string): Promise<string> {
  const prompt = `Translate the following Turkish text to English. Return ONLY the English translation, nothing else. Text: "${text}"`;
  const doFetch = async () => {
    const res = await fetch("https://text.pollinations.ai/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${POLLINATIONS_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai-fast",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (res.status === 402) {
      let wait = 32;
      try {
        const body = await res.json();
        const m = body?.error?.message?.match(/Retry after (\d+)s/i);
        if (m) wait = Math.min(Number(m[1]) + 2, 60);
      } catch { /* ignore */ }
      const err = new Error("RATE_LIMIT");
      (err as any).retryAfter = wait;
      throw err;
    }
    if (!res.ok) throw new Error(`Translation API error: HTTP ${res.status}`);
    const data = await res.json();
    const msg = data?.choices?.[0]?.message;
    let translated = msg?.content?.trim();
    if (!translated && Array.isArray(msg?.tool_calls) && msg.tool_calls.length > 0) {
      translated = msg.tool_calls[0]?.function?.arguments?.trim();
    }
    if (!translated || translated.length < 2) return text;
    return translated.replace(/^["']|["']$/g, "").trim();
  };
  try {
    return await doFetch();
  } catch (err: any) {
    if (err?.retryAfter) {
      await new Promise((r) => setTimeout(r, err.retryAfter * 1000));
      return await doFetch();
    }
    throw err;
  }
}

/**
 * Generates a logo image URL using Pollinations.ai image API (flux model).
 * The prompt is constructed from the translated brand name and selected style.
 */
function buildLogoImageUrl(englishPrompt: string, seed: number): string {
  const encoded = encodeURIComponent(englishPrompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&model=flux&seed=${seed}&nologo=true&safe=true`;
}

export default function LogoGenerator() {
  const [brandName, setBrandName] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("geometric");
  const [result, setResult] = useState<LogoResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const handleGenerate = async () => {
    if (!brandName.trim()) {
      toast.error("Lütfen marka adını girin.");
      return;
    }
    setIsProcessing(true);
    setIsTranslating(true);

    let translatedName = brandName.trim();
    try {
      // Step 1: Translate Turkish brand name/description to English
      translatedName = await translateToEnglish(brandName.trim());
    } catch (err) {
      console.warn("Translation failed, using original text:", err);
    }
    setIsTranslating(false);

    try {
      // Step 2: Build the AI image prompt
      const styleInfo = logoStyles.find((s) => s.id === selectedStyle) || logoStyles[0];
      const fullPrompt = `Professional ${styleInfo.promptKeyword} for "${translatedName}". White background, high quality, centered composition, vector style logo.`;
      const seed = Math.floor(Math.random() * 1000000);
      const imageUrl = buildLogoImageUrl(fullPrompt, seed);

      // Step 3: Preload the image to ensure it's ready before showing
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Görsel yüklenemedi"));
        // Timeout after 30 seconds — flux can take a while
        const timeout = setTimeout(() => reject(new Error("Zaman aşımı")), 30000);
        img.onload = () => {
          clearTimeout(timeout);
          resolve();
        };
        img.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("Görsel yüklenemedi"));
        };
        img.src = imageUrl;
      });

      const logoResult: LogoResult = {
        imageUrl,
        brandName: brandName.trim(),
        style: styleInfo.label,
        englishPrompt: fullPrompt,
        translatedName,
      };
      setResult(logoResult);
      addHistoryItem({
        toolType: "logo",
        outputUrl: imageUrl,
        metadata: JSON.stringify({
          brandName: brandName.trim(),
          style: styleInfo.label,
          translatedName,
        }),
      });
      toast.success("AI logosu oluşturuldu! (Pollinations.ai - Flux)");
    } catch (err) {
      console.error("Logo generation error:", err);
      toast.error("Logo oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsProcessing(false);
      setIsTranslating(false);
    }
  };

  const handleDownload = async () => {
    if (!result) return;
    try {
      const res = await fetch(result.imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${result.brandName.replace(/\s+/g, "_")}_logo.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Logo indirildi!");
    } catch {
      toast.error("İndirme sırasında hata oluştu.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-10">
      <div className="container max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Logo Oluşturucu</h1>
            <p className="text-muted-foreground text-sm">
              Marka adını gir, stil seç — AI gerçek logo üretsin
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Marka Bilgisi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Marka Adı / Açıklama
                  </label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="örn: SMG Studio, kahve dükkanı, teknoloji şirketi"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    maxLength={80}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isProcessing && brandName.trim()) handleGenerate();
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                    <Languages className="w-3 h-3" />
                    Türkçe yaz — AI otomatik İngilizce'ye çevirip daha iyi logo üretir
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Logo Stili
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {logoStyles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          selectedStyle === style.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <div className="font-semibold text-sm text-foreground">{style.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{style.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={handleGenerate}
                  disabled={isProcessing || !brandName.trim()}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isTranslating ? "Çevriliyor..." : "AI çiziyor..."}
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      {result ? "Yeni Logo Oluştur" : "AI ile Logo Oluştur"}
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    Ücretsiz AI (Flux) — 30 sn'de 1 istek limiti
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Result Panel */}
          <div className="lg:col-span-3">
            {result ? (
              <div className="space-y-4">
                <Card className="shadow-sm overflow-hidden">
                  <div className="bg-white p-8 flex items-center justify-center min-h-[340px]">
                    <img
                      src={result.imageUrl}
                      alt={`${result.brandName} logo`}
                      className="max-w-full max-h-[320px] object-contain rounded-lg"
                    />
                  </div>
                  <CardContent className="p-4 border-t border-border">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge variant="secondary">{result.style}</Badge>
                      <Badge variant="outline">AI: Flux</Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Languages className="w-3 h-3" />
                        {result.translatedName}
                      </Badge>
                    </div>
                    <div className="flex justify-end">
                      <Button size="sm" onClick={handleDownload} className="gap-2">
                        <Download className="w-4 h-4" />
                        PNG İndir
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm bg-purple-50/40">
                  <CardContent className="p-4">
                    <p className="text-xs text-purple-800/80">
                      <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                      AI, "{result.brandName}" metnini İngilizce'ye çevirdi ve "{result.style}" stiline göre logo üretti.
                      Her "Yeni Logo Oluştur" basışında farklı bir tasarım gelir.
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-dashed border-2 border-border h-full min-h-[300px] flex items-center justify-center bg-white shadow-sm">
                <CardContent className="text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Logo Hazır Değil</h3>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    Marka adını gir (Türkçe yazabilirsin), stil seç ve "AI ile Logo Oluştur"a tıkla.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
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
