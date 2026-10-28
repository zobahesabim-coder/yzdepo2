import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Code2,
  Copy,
  Download,
  Loader2,
  Sparkles,
} from "lucide-react";
import { addHistoryItem } from "@/lib/history";

type Language = "javascript" | "python" | "html" | "css" | "sql" | "bash";

const languages: { id: Language; label: string; icon: string }[] = [
  { id: "javascript", label: "JavaScript", icon: "JS" },
  { id: "python", label: "Python", icon: "PY" },
  { id: "html", label: "HTML", icon: "HTML" },
  { id: "css", label: "CSS", icon: "CSS" },
  { id: "sql", label: "SQL", icon: "SQL" },
  { id: "bash", label: "Bash", icon: "$" },
];

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/\s+/g, "");
}

function snakeCase(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

const langFullNames: Record<Language, string> = {
  javascript: "JavaScript",
  python: "Python",
  html: "HTML",
  css: "CSS",
  sql: "SQL (PostgreSQL)",
  bash: "Bash",
};

const POLLINATIONS_API_KEY = "sk_1zl0iJqBjHz8AzzHFp4anukql4ECFB0U";

/**
 * Calls Pollinations.ai text generation API with API key for higher limits.
 * Uses the OpenAI-compatible POST endpoint for better model access.
 */
async function fetchAiCode(prompt: string): Promise<string> {
  const res = await fetch("https://text.pollinations.ai/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${POLLINATIONS_API_KEY}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-5.4-nano",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    throw new Error(`AI API hatası: HTTP ${res.status}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text || text.trim().length < 5) {
    throw new Error("AI API boş yanıt döndürdü");
  }
  return text.trim();
}

/**
 * Strips markdown code fences (```lang ... ```) from AI output and
 * extracts just the code.
 */
function extractCode(raw: string): string {
  // Try to extract from ```lang\n...\n``` blocks
  const fenceMatch = raw.match(/```(?:[a-zA-Z]+)?\n([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  // If no fence, return as-is but strip leading/trailing whitespace
  return raw.trim();
}

/**
 * Local fallback code generation (used if AI API fails).
 */
function generateFallbackCode(lang: Language, topic: string): { code: string; explanation: string } {
  const t = topic.trim();

  if (lang === "javascript") {
    return {
      code: `// ${t} için JavaScript örneği\nfunction ${snakeCase(t) || "run"}() {\n  console.log("${t} çalıştı");\n  return "${t}";\n}\n\n${snakeCase(t) || "run"}();`,
      explanation: `"${t}" konusu için temel bir JavaScript fonksiyonu (AI bağlanamadı, yedek şablon kullanıldı).`,
    };
  }
  if (lang === "python") {
    return {
      code: `# ${t} için Python örneği\ndef ${snakeCase(t) || "run"}():\n    print("${t} çalıştı")\n    return "${t}"\n\n${snakeCase(t) || "run"}()`,
      explanation: `"${t}" konusu için temel bir Python fonksiyonu (AI bağlanamadı, yedek şablon kullanıldı).`,
    };
  }
  if (lang === "html") {
    return {
      code: `<!DOCTYPE html>\n<html>\n  <head><title>${capitalize(t)}</title></head>\n  <body>\n    <h1>${capitalize(t)}</h1>\n    <p>${t} hakkında bir sayfa.</p>\n  </body>\n</html>`,
      explanation: `"${t}" konulu basit bir HTML sayfası (AI bağlanamadı, yedek şablon kullanıldı).`,
    };
  }
  if (lang === "css") {
    return {
      code: `/* ${t} için CSS */\n.container {\n  max-width: 800px;\n  margin: 0 auto;\n  padding: 20px;\n  font-family: sans-serif;\n}\n\n.${snakeCase(t) || "box"} {\n  background: #f5f5f5;\n  border-radius: 8px;\n  padding: 20px;\n}`,
      explanation: `"${t}" için temel bir CSS düzeni (AI bağlanamadı, yedek şablon kullanıldı).`,
    };
  }
  if (lang === "sql") {
    return {
      code: `-- ${t} için SQL\nCREATE TABLE ${snakeCase(t) || "items"} (\n  id SERIAL PRIMARY KEY,\n  name VARCHAR(100),\n  created_at TIMESTAMP DEFAULT NOW()\n);\n\nSELECT * FROM ${snakeCase(t) || "items"};`,
      explanation: `"${t}" için bir tablo oluşturup veri çeken SQL (AI bağlanamadı, yedek şablon kullanıldı).`,
    };
  }
  return {
    code: `#!/bin/bash\n# ${t} için bash script\necho "${t} başlıyor..."\necho "Tamamlandı."`,
    explanation: `"${t}" için temel bir bash betiği (AI bağlanamadı, yedek şablon kullanıldı).`,
  };
}

type CodingResult = {
  code: string;
  explanation: string;
  language: Language;
  topic: string;
  aiModel: string;
  usedFallback: boolean;
};

export default function CodingAssistant() {
  const [topic, setTopic] = useState("");
  const [selectedLang, setSelectedLang] = useState<Language>("javascript");
  const [result, setResult] = useState<CodingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Lütfen bir konu girin.");
      return;
    }
    setIsProcessing(true);

    const prompt = `You are a code generator. Write working, clean code in ${langFullNames[selectedLang]} for this request: "${topic.trim()}". Return ONLY the code with no explanation, no markdown fences, no commentary. The code should be complete and ready to run.`;

    try {
      const rawAi = await fetchAiCode(prompt);
      const code = extractCode(rawAi);

      // Also get a short explanation
      const explanationPrompt = `Write a one-sentence Turkish explanation (max 100 characters) of what this code does: "${topic.trim()}" in ${langFullNames[selectedLang]}. Reply with only the explanation, no code.`;
      let explanation = `AI tarafından üretilen ${langFullNames[selectedLang]} kodu.`;
      try {
        const aiExplanation = await fetchAiCode(explanationPrompt);
        explanation = aiExplanation.slice(0, 200);
      } catch {
        // keep default explanation
      }

      const codingResult: CodingResult = {
        code,
        explanation,
        language: selectedLang,
        topic: topic.trim(),
        aiModel: "Pollinations.ai (openai/gpt-5.4-nano)",
        usedFallback: false,
      };
      setResult(codingResult);
      addHistoryItem({
        toolType: "coding",
        metadata: JSON.stringify({
          language: selectedLang,
          explanation,
          code,
        }),
      });
      setIsProcessing(false);
      toast.success("AI kodu oluşturuldu! (Pollinations.ai)");
    } catch (err) {
      console.error("AI API error, falling back:", err);
      const { code, explanation } = generateFallbackCode(selectedLang, topic);
      const codingResult: CodingResult = {
        code,
        explanation,
        language: selectedLang,
        topic: topic.trim(),
        aiModel: "Yedek şablon (AI bağlanamadı)",
        usedFallback: true,
      };
      setResult(codingResult);
      addHistoryItem({
        toolType: "coding",
        metadata: JSON.stringify({
          language: selectedLang,
          explanation,
          code,
        }),
      });
      setIsProcessing(false);
      toast.warning("AI'ya ulaşılamadı, yedek şablon kullanıldı.");
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.code);
    toast.success("Kod kopyalandı!");
  };

  const handleDownload = () => {
    if (!result) return;
    const ext: Record<Language, string> = {
      javascript: "js",
      python: "py",
      html: "html",
      css: "css",
      sql: "sql",
      bash: "sh",
    };
    const blob = new Blob([result.code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${snakeCase(result.topic)}.${ext[result.language]}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Kod indirildi!");
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-10">
      <div className="container max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
            <Code2 className="w-6 h-6 text-pink-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Kodlama Asistanı</h1>
            <p className="text-muted-foreground text-sm">
              Ne yapmak istediğini yaz, dil seç — AI gerçek kod üretsin
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Ayarlar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Language */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Dil</label>
                  <div className="grid grid-cols-3 gap-2">
                    {languages.map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => setSelectedLang(lang.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all ${
                          selectedLang === lang.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <span className="w-6 h-6 rounded bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center">
                          {lang.icon}
                        </span>
                        <span className="text-xs font-medium text-foreground">{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topic */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Ne yapmak istiyorsun?
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="örn: hello world, sayaç, hesap makinesi, form"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    maxLength={100}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isProcessing && topic.trim()) handleGenerate();
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    İpucu: İstediğin her şeyi yazabilirsin — AI kodu senin için üretir.
                  </p>
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={handleGenerate}
                  disabled={isProcessing || !topic.trim()}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      AI düşünüyor...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      AI ile Kod Oluştur
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    Ücretsiz & Limitsiz AI (Pollinations.ai)
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
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                      </div>
                      <span className="text-slate-300 text-xs font-mono ml-2">
                        {snakeCase(result.topic)}.{result.language === "javascript" ? "js" : result.language}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopy}
                        className="text-slate-300 hover:text-white transition-colors p-1"
                        title="Kopyala"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleDownload}
                        className="text-slate-300 hover:text-white transition-colors p-1"
                        title="İndir"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <pre className="code-block !rounded-none !m-0 max-h-[400px] overflow-auto">
                    <code>{result.code}</code>
                  </pre>
                </Card>

                <Card className="shadow-sm bg-blue-50/40">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-1">Açıklama</p>
                        <p className="text-sm text-muted-foreground">{result.explanation}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI model info */}
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 ${
                    result.usedFallback
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}>
                    <Sparkles className="w-3 h-3" />
                    {result.usedFallback ? "Yedek şablon (AI bağlanamadı)" : `AI: ${result.aiModel}`}
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleCopy} className="gap-2">
                      <Copy className="w-4 h-4" />
                      Kopyala
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleDownload} className="gap-2">
                      <Download className="w-4 h-4" />
                      İndir
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Card className="border-dashed border-2 border-border h-full min-h-[300px] flex items-center justify-center bg-white shadow-sm">
                <CardContent className="text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center mx-auto mb-4">
                    <Code2 className="w-8 h-8 text-pink-400" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Kod Hazır Değil</h3>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    Ne yapmak istediğini yaz (örn: "hello world"), dil seç ve "AI ile Kod Oluştur"a tıkla.
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
