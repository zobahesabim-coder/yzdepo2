import { useState, useRef, useCallback } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  FileText,
  FileType,
  Upload,
  Download,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  FileCode,
  ScanLine,
  CheckCircle2,
  X,
  ArrowRight,
} from "lucide-react";
import { addHistoryItem } from "@/lib/history";

type ConversionCategory = "text" | "image" | "ocr";

type ConversionType = {
  id: string;
  label: string;
  fromExt: string[];
  toExt: string;
  toMime: string;
  category: ConversionCategory;
  desc: string;
};

const conversions: ConversionType[] = [
  // Text conversions
  { id: "txt-md", label: "TXT → Markdown", fromExt: ["txt"], toExt: "md", toMime: "text/markdown", category: "text", desc: "Düz metni Markdown formatına çevir" },
  { id: "md-txt", label: "Markdown → TXT", fromExt: ["md", "markdown"], toExt: "txt", toMime: "text/plain", category: "text", desc: "Markdown işaretlerini temizle" },
  { id: "txt-csv", label: "TXT → CSV", fromExt: ["txt"], toExt: "csv", toMime: "text/csv", category: "text", desc: "Satırları virgülle ayır" },
  { id: "csv-txt", label: "CSV → TXT", fromExt: ["csv"], toExt: "txt", toMime: "text/plain", category: "text", desc: "Virgülleri satıra çevir" },
  { id: "json-txt", label: "JSON → TXT", fromExt: ["json"], toExt: "txt", toMime: "text/plain", category: "text", desc: "JSON'u düz metne çevir" },
  { id: "html-txt", label: "HTML → TXT", fromExt: ["html", "htm"], toExt: "txt", toMime: "text/plain", category: "text", desc: "HTML etiketlerini temizle" },
  // Image conversions (via canvas)
  { id: "png-jpg", label: "PNG → JPG", fromExt: ["png"], toExt: "jpg", toMime: "image/jpeg", category: "image", desc: "Şeffaf arka planı beyaza çevir" },
  { id: "jpg-png", label: "JPG → PNG", fromExt: ["jpg", "jpeg"], toExt: "png", toMime: "image/png", category: "image", desc: "PNG formatına çevir" },
  { id: "webp-png", label: "WEBP → PNG", fromExt: ["webp"], toExt: "png", toMime: "image/png", category: "image", desc: "WEBP'i PNG'e çevir" },
  { id: "png-webp", label: "PNG → WEBP", fromExt: ["png"], toExt: "webp", toMime: "image/webp", category: "image", desc: "PNG'i WEBP'e çevir" },
  { id: "bmp-png", label: "BMP → PNG", fromExt: ["bmp"], toExt: "png", toMime: "image/png", category: "image", desc: "BMP'i PNG'e çevir" },
  // OCR
  { id: "img-txt-ocr", label: "Resim → TXT (OCR)", fromExt: ["png", "jpg", "jpeg", "webp", "bmp"], toExt: "txt", toMime: "text/plain", category: "ocr", desc: "Resimdeki yazıyı metne çevir (Tesseract)" },
];

const categoryLabels: Record<ConversionCategory, string> = {
  text: "Metin Dönüşümleri",
  image: "Görsel Dönüşümleri",
  ocr: "OCR (Yazı Tanıma)",
};

function getExt(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

function getBaseName(filename: string): string {
  const ext = getExt(filename);
  return ext ? filename.slice(0, -(ext.length + 1)) : filename;
}

// ===== Text conversions =====
function convertText(content: string, conv: ConversionType): string {
  switch (conv.id) {
    case "txt-md": {
      // First line as heading, blank lines as paragraphs
      const lines = content.split(/\r?\n/);
      if (lines.length === 0) return content;
      const out: string[] = [];
      out.push(`# ${lines[0].trim()}`);
      out.push("");
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === "") {
          out.push("");
        } else if (/^[-*]\s+/.test(line)) {
          out.push(line);
        } else {
          out.push(line);
        }
      }
      return out.join("\n");
    }
    case "md-txt":
      return content
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/`(.+?)`/g, "$1")
        .replace(/\[(.+?)\]\(.+?\)/g, "$1")
        .replace(/^>\s+/gm, "")
        .replace(/^[-*]\s+/gm, "• ");
    case "txt-csv": {
      const lines = content.split(/\r?\n/).filter((l) => l.trim());
      return lines.map((l) => l.split(/\s{2,}|\t/).map((c) => `"${c.trim()}"`).join(",")).join("\n");
    }
    case "csv-txt":
      return content
        .split(/\r?\n/)
        .map((line) => line.split(",").map((c) => c.replace(/^"|"$/g, "").trim()).join("\t"))
        .join("\n");
    case "json-txt": {
      try {
        const obj = JSON.parse(content);
        return JSON.stringify(obj, null, 2);
      } catch {
        return content;
      }
    }
    case "html-txt":
      return content
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    default:
      return content;
  }
}

// ===== Image conversions (canvas) =====
function convertImage(file: File, conv: ConversionType): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas desteklenmiyor"));
        return;
      }
      // For JPG, fill white background (no transparency)
      if (conv.toMime === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Dönüşüm başarısız"));
        },
        conv.toMime,
        0.92
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Görsel yüklenemedi"));
    };
    img.src = url;
  });
}

// ===== OCR preprocessing: enhance image for better accuracy =====
function preprocessImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      // Upscale small images (Tesseract works best at 300+ DPI equivalent)
      const scale = img.naturalWidth < 1000 ? Math.ceil(1000 / img.naturalWidth) : 1;
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas desteklenmiyor"));
        return;
      }
      // Draw upscaled
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);

      // Get pixel data for grayscale + contrast
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;
      const contrast = 1.5; // increase contrast
      const intercept = 128 * (1 - contrast);

      for (let i = 0; i < data.length; i += 4) {
        // Grayscale (luminosity method)
        let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        // Apply contrast
        gray = gray * contrast + intercept;
        // Clamp
        gray = Math.max(0, Math.min(255, gray));
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }
      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Görüntü önişleme başarısız"));
        },
        "image/png"
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Görsel yüklenemedi"));
    };
    img.src = url;
  });
}

// ===== OCR via Tesseract.js with image preprocessing =====
async function runOcr(file: File, onProgress: (p: number) => void): Promise<string> {
  const { default: Tesseract } = await import("tesseract.js");

  // Preprocess the image for better OCR accuracy
  const processedBlob = await preprocessImage(file);

  const result = await Tesseract.recognize(processedBlob, "tur+eng", {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  // Post-process: clean up common OCR artifacts
  let text = result.data.text.trim();
  // Remove excessive blank lines
  text = text.replace(/\n{3,}/g, "\n\n");
  // Fix spacing around words that got merged
  text = text.replace(/([a-zçğıöşü])([A-ZÇĞİÖŞÜ])/g, "$1 $2");
  // Remove stray single characters on their own lines
  text = text.replace(/^\s*[a-z]\s*$/gim, "");

  return text;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 200);
}

type ResultItem = {
  id: string;
  conv: ConversionType;
  blob: Blob;
  filename: string;
  preview?: string;
};

export default function Converter() {
  const [selectedConv, setSelectedConv] = useState<ConversionType>(conversions[0]);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [textPreview, setTextPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((selected: File) => {
    if (!selectedConv.fromExt.includes(getExt(selected.name))) {
      toast.error(`Bu dönüşüm ${selectedConv.fromExt.join(", ")} dosyaları gerektirir. Seçilen: .${getExt(selected.name)}`);
      return;
    }
    if (selected.size > 20 * 1024 * 1024) {
      toast.error("Dosya boyutu 20MB'ı geçemez.");
      return;
    }
    setFile(selected);
    setTextPreview(null);
  }, [selectedConv]);

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFileSelect(f);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove("border-amber-400", "bg-amber-50");
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileSelect(f);
  };

  const handleConvert = async () => {
    if (!file) {
      toast.error("Lütfen bir dosya seçin.");
      return;
    }
    setIsProcessing(true);
    setProgress(0);
    try {
      let blob: Blob;
      let preview: string | undefined;

      if (selectedConv.category === "text") {
        const text = await file.text();
        const converted = convertText(text, selectedConv);
        blob = new Blob([converted], { type: selectedConv.toMime + ";charset=utf-8" });
        preview = converted;
      } else if (selectedConv.category === "image") {
        blob = await convertImage(file, selectedConv);
      } else {
        // OCR
        const text = await runOcr(file, (p) => setProgress(p));
        blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        preview = text;
      }

      const filename = `${getBaseName(file.name)}.${selectedConv.toExt}`;
      const item: ResultItem = {
        id: `${Date.now()}`,
        conv: selectedConv,
        blob,
        filename,
        preview,
      };
      setResults((prev) => [item, ...prev].slice(0, 5));
      if (preview !== undefined) setTextPreview(preview);
      addHistoryItem({
        toolType: "converter",
        metadata: JSON.stringify({
          conversion: selectedConv.label,
          filename,
        }),
      });
      toast.success("Dönüşüm tamamlandı!");
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Bilinmeyen hata";
      toast.error("Dönüşüm hatası: " + msg);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const reset = () => {
    setFile(null);
    setTextPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const availableConversions = (cat: ConversionCategory) =>
    conversions.filter((c) => c.category === cat);

  return (
    <div className="min-h-screen bg-slate-50/50 py-10">
      <div className="container max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <FileType className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dönüştürücü</h1>
            <p className="text-muted-foreground text-sm">
              Dosya formatını değiştir veya kağıda yazılan yazıyı metne çevir
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Controls */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Dönüşüm Seç</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[420px] overflow-y-auto">
                {(Object.keys(categoryLabels) as ConversionCategory[]).map((cat) => (
                  <div key={cat}>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      {cat === "text" && <FileText className="w-3.5 h-3.5" />}
                      {cat === "image" && <ImageIcon className="w-3.5 h-3.5" />}
                      {cat === "ocr" && <ScanLine className="w-3.5 h-3.5" />}
                      {categoryLabels[cat]}
                    </h4>
                    <div className="space-y-1.5">
                      {availableConversions(cat).map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => {
                            setSelectedConv(conv);
                            setFile(null);
                            setTextPreview(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-lg border-2 transition-all text-left ${
                            selectedConv.id === conv.id
                              ? "border-amber-500 bg-amber-50"
                              : "border-border hover:border-amber-300"
                          }`}
                        >
                          <div>
                            <span className="font-semibold text-sm text-foreground">{conv.label}</span>
                            <span className="text-xs text-muted-foreground block mt-0.5">{conv.desc}</span>
                          </div>
                          {selectedConv.id === conv.id && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right: Upload + Result */}
          <div className="lg:col-span-3 space-y-4">
            {/* Upload */}
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add("border-amber-400", "bg-amber-50");
                  }}
                  onDragLeave={(e) => e.currentTarget.classList.remove("border-amber-400", "bg-amber-50")}
                  onDrop={onDrop}
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center transition-all"
                >
                  <Upload className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                  <p className="font-medium text-foreground mb-1">
                    Dosya sürükle veya tıkla
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Kabul edilen: .{selectedConv.fromExt.join(", .")}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={selectedConv.fromExt.map((e) => "." + e).join(",")}
                    onChange={onInputChange}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Dosya Seç
                  </Button>
                </div>

                {file && (
                  <div className="mt-4 flex items-center justify-between p-3 bg-amber-50/60 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCode className="w-5 h-5 text-amber-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button onClick={reset} className="p-1 hover:bg-amber-100 rounded">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                )}

                <Separator className="my-4" />

                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <ArrowRight className="w-3 h-3" />
                    {selectedConv.label}
                  </Badge>
                  <div className="flex-1" />
                  <Button
                    onClick={handleConvert}
                    disabled={isProcessing || !file}
                    className="bg-amber-600 hover:bg-amber-700 gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {selectedConv.category === "ocr" ? `OCR %${progress}` : "Dönüştürülüyor..."}
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Dönüştür
                      </>
                    )}
                  </Button>
                </div>

                {isProcessing && selectedConv.category === "ocr" && (
                  <div className="mt-3 w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Text Preview (for text/ocr) */}
            {textPreview !== null && (selectedConv.category === "text" || selectedConv.category === "ocr") && (
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Metin Önizleme
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-slate-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
                      {textPreview || "(boş çıktı)"}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {results.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Son Dönüşümler</h3>
                {results.map((r) => (
                  <Card key={r.id} className="shadow-sm">
                    <CardContent className="p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                          {r.conv.category === "image" ? (
                            <ImageIcon className="w-4 h-4 text-amber-600" />
                          ) : (
                            <FileText className="w-4 h-4 text-amber-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{r.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.conv.label} · {(r.blob.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => downloadBlob(r.blob, r.filename)}
                        className="gap-2 shrink-0"
                      >
                        <Download className="w-4 h-4" />
                        İndir
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-8 bg-slate-50/50">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2025 SMG Yapay Zeka. Öğrenciler için tasarlandı.</p>
          <span className="text-sm font-bold text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, letterSpacing: "-0.3px" }}>
            Made by @Beratkarabudak
          </span>
        </div>
      </footer>
    </div>
  );
}
