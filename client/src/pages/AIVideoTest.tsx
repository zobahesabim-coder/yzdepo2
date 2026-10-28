import { useState, useRef } from "react";
import type { ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Zap,
  TrendingUp,
  TrendingDown,
  FileVideo,
  RefreshCw,
} from "lucide-react";
import { addHistoryItem } from "@/lib/history";

type Criterion = {
  name: string;
  humanProbability: number;
  aiProbability: number;
  explanation: string;
};

type AnalysisResult = {
  criteria: Criterion[];
  overall: {
    humanProbability: number;
    aiProbability: number;
    verdict: string;
    summary: string;
  };
};

type Step = "upload" | "analyzing" | "result";

/**
 * Heuristic analysis of a video file to estimate AI vs human origin.
 * Uses file metadata: size, duration, resolution, bitrate, codec.
 */
function analyzeVideoHeuristics(file: File, videoEl: HTMLVideoElement): AnalysisResult {
  const duration = videoEl.duration || 0;
  const width = videoEl.videoWidth || 0;
  const height = videoEl.videoHeight || 0;
  const sizeMB = file.size / 1024 / 1024;
  const bitrate = duration > 0 ? (file.size * 8) / duration / 1000 : 0; // kbps

  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const codecScore = ext === "mp4" ? 50 : ext === "webm" ? 55 : ext === "mov" ? 35 : 50;

  // Criterion 1: Bitrate analysis — AI videos often have unusually consistent/high bitrate
  let bitHuman = 60;
  let bitAI = 40;
  if (bitrate > 0) {
    if (bitrate > 20000) {
      bitAI = 65;
      bitHuman = 35;
    } else if (bitrate < 1000) {
      bitAI = 55;
      bitHuman = 45;
    } else if (bitrate > 5000 && bitrate < 15000) {
      bitHuman = 65;
      bitAI = 35;
    }
  }

  // Criterion 2: Resolution — AI videos often target exact 1920x1080 or 1280x720
  let resHuman = 55;
  let resAI = 45;
  if (width === 1920 && height === 1080) {
    resAI = 58;
    resHuman = 42;
  } else if (width === 1280 && height === 720) {
    resAI = 55;
    resHuman = 45;
  } else if (width === 3840 && height === 2160) {
    resHuman = 60;
    resAI = 40;
  } else if (width === 0 || height === 0) {
    resHuman = 50;
    resAI = 50;
  } else if (Math.abs(width / height - 16 / 9) > 0.01 && Math.abs(width / height - 9 / 16) > 0.01) {
    resHuman = 60;
    resAI = 40;
  }

  // Criterion 3: Duration — AI videos often very short (5-15s)
  let durHuman = 55;
  let durAI = 45;
  if (duration > 0 && duration < 10) {
    durAI = 62;
    durHuman = 38;
  } else if (duration > 60) {
    durHuman = 65;
    durAI = 35;
  } else if (duration === 0) {
    durHuman = 50;
    durAI = 50;
  }

  // Criterion 4: File size vs duration ratio — AI renders often have unusual compression
  let compHuman = 50;
  let compAI = 50;
  if (duration > 0) {
    const mbPerSec = sizeMB / duration;
    if (mbPerSec > 3) {
      compHuman = 55;
      compAI = 45;
    } else if (mbPerSec < 0.3) {
      compAI = 58;
      compHuman = 42;
    } else if (mbPerSec > 0.5 && mbPerSec < 1.5) {
      compHuman = 58;
      compAI = 42;
    }
  }

  // Criterion 5: Codec/container — certain formats more common in AI pipelines
  let codecHuman = 100 - codecScore;
  let codecAI = codecScore;

  const criteria: Criterion[] = [
    {
      name: "Bitrate Analizi",
      humanProbability: bitHuman,
      aiProbability: bitAI,
      explanation: `Video bitrate ${bitrate.toFixed(0)} kbps. Çok yüksek veya düzgün bitrate'ler AI render'larına işaret edebilir.`,
    },
    {
      name: "Çözünürlük Deseni",
      humanProbability: resHuman,
      aiProbability: resAI,
      explanation: width > 0 ? `${width}×${height} çözünürlük. Tam 1080p/720p AI üretiminde yaygındır.` : "Çözünürlük okunamadı.",
    },
    {
      name: "Süre Analizi",
      humanProbability: durHuman,
      aiProbability: durAI,
      explanation: `Video süresi ${duration.toFixed(1)} saniye. 10 saniyenin altındaki videolar AI üretiminde yaygındır.`,
    },
    {
      name: "Sıkıştırma Oranı",
      humanProbability: compHuman,
      aiProbability: compAI,
      explanation: `Dosya boyutu/süre oranı ${(duration > 0 ? sizeMB / duration : 0).toFixed(2)} MB/sn. Olağandışı oranlar AI'ya işaret edebilir.`,
    },
    {
      name: "Format/Codec",
      humanProbability: codecHuman,
      aiProbability: codecAI,
      explanation: `Dosya formatı: .${ext}. Bazı formatlar AI render pipeline'larında daha yaygındır.`,
    },
  ];

  // Weighted overall
  const weights = [0.25, 0.2, 0.2, 0.2, 0.15];
  let overallHuman = 0;
  let overallAI = 0;
  criteria.forEach((c, i) => {
    overallHuman += c.humanProbability * weights[i];
    overallAI += c.aiProbability * weights[i];
  });
  overallHuman = Math.round(overallHuman);
  overallAI = Math.round(overallAI);
  // Ensure they sum to 100
  if (overallHuman + overallAI !== 100) {
    overallAI = 100 - overallHuman;
  }

  let verdict = "Belirsiz";
  if (overallAI > 65) verdict = "Büyük olasılıkla AI Üretimi";
  else if (overallAI > 50) verdict = "Muhtemelen AI Üretimi";
  else if (overallHuman > 65) verdict = "Büyük olasılıkla Gerçek";
  else if (overallHuman > 50) verdict = "Muhtemelen Gerçek";

  const summary = `Bu analiz video dosyasının teknik metaverilerine (bitrate, çözünürlük, süre, sıkıştırma, format) dayanmaktadır. Sonuç ${overallAI}% AI olasılığı gösteriyor. Kesin sonuç için görsel içerik analizi gereklidir — bu araç dosya özelliklerine dayalı bir tahmin sağlar.`;

  return { criteria, overall: { humanProbability: overallHuman, aiProbability: overallAI, verdict, summary } };
}

export default function AIVideoTest() {
  const [step, setStep] = useState<Step>("upload");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("video/")) {
      toast.error("Lütfen bir video dosyası seçin");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Dosya boyutu 50MB'ı geçemez.");
      return;
    }
    setUploadedFile(file);
    setStep("upload");
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("border-purple-500", "bg-purple-50");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("border-purple-500", "bg-purple-50");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("border-purple-500", "bg-purple-50");
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleTest = () => {
    if (!uploadedFile || !videoRef.current) {
      toast.error("Lütfen bir video seçin");
      return;
    }

    setStep("analyzing");
    const video = videoRef.current;

    const doAnalyze = () => {
      setTimeout(() => {
        try {
          const analysisResult = analyzeVideoHeuristics(uploadedFile, video);
          setResult(analysisResult);
          setStep("result");
          addHistoryItem({
            toolType: "ai-video-test",
            metadata: JSON.stringify({
              overall: analysisResult.overall,
              criteria: analysisResult.criteria,
            }),
          });
          toast.success("Analiz tamamlandı!");
        } catch (error) {
          console.error("Analiz hatası:", error);
          toast.error("Analiz sırasında hata oluştu");
          setStep("upload");
        }
      }, 800);
    };

    if (video.readyState >= 1) {
      doAnalyze();
    } else {
      video.onloadedmetadata = doAnalyze;
    }
  };

  const resetTest = () => {
    setStep("upload");
    setUploadedFile(null);
    setResult(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getVerdictColor = (verdict: string) => {
    if (verdict.includes("AI")) return "bg-red-50 border-red-200";
    if (verdict.includes("Gerçek")) return "bg-green-50 border-green-200";
    return "bg-yellow-50 border-yellow-200";
  };

  const getVerdictIcon = (verdict: string) => {
    if (verdict.includes("AI")) return <TrendingUp className="w-5 h-5 text-red-600" />;
    if (verdict.includes("Gerçek")) return <TrendingDown className="w-5 h-5 text-green-600" />;
    return <AlertCircle className="w-5 h-5 text-yellow-600" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-900">AI Video Test</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Videonun yapay zeka ile üretilmiş mi yoksa gerçek mi olduğunu teknik metaverilere göre analiz edin
          </p>
        </div>

        {/* Hidden video element for metadata loading */}
        {videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            className="hidden"
            preload="metadata"
          />
        )}

        {/* Upload Section */}
        {step === "upload" && (
          <Card className="border-2 border-dashed border-gray-300 hover:border-purple-400 transition-colors">
            <CardContent className="pt-12 pb-12">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className="text-center cursor-pointer p-8 rounded-lg border-2 border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-all"
              >
                <Upload className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Video Yükleyin
                </h3>
                <p className="text-gray-600 mb-4">
                  Videoyu sürükleyip bırakın veya tıklayarak seçin
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Video Seç
                </Button>
              </div>

              {uploadedFile && (
                <div className="mt-8">
                  <div className="bg-purple-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3">
                      <FileVideo className="w-8 h-8 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Dosya:</span> {uploadedFile.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Boyut:</span>{" "}
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={handleTest}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      Test Et
                    </Button>
                    <Button
                      onClick={resetTest}
                      variant="outline"
                      className="gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Temizle
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Analyzing Section */}
        {step === "analyzing" && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Loader2 className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Video Analiz Ediliyor
              </h3>
              <p className="text-gray-600">
                Video metaverileri inceleniyor: bitrate, çözünürlük, süre, sıkıştırma...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Result Section */}
        {step === "result" && result && (
          <div className="space-y-6">
            {/* Overall Verdict */}
            <Card className={`border-2 ${getVerdictColor(result.overall.verdict)}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getVerdictIcon(result.overall.verdict)}
                    <CardTitle>Analiz Sonucu</CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-base">
                    {result.overall.verdict}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Overall Probabilities */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-semibold text-gray-700">
                        İnsan Yapımı
                      </label>
                      <span className="text-2xl font-bold text-green-600">
                        %{result.overall.humanProbability}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${result.overall.humanProbability}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-semibold text-gray-700">
                        AI Üretimi
                      </label>
                      <span className="text-2xl font-bold text-red-600">
                        %{result.overall.aiProbability}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${result.overall.aiProbability}%` }}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Summary */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start gap-3">
                    <BarChart3 className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Genel Yorum
                      </h4>
                      <p className="text-gray-600 text-sm">{result.overall.summary}</p>
                    </div>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-800">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Bu analiz dosya metaverilerine dayalı bir tahmindir ve %100 kesin değildir.
                    Görsel/içerik analizi için özel araçlar kullanmanız önerilir.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Criteria */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Detaylı Kriter Analizi
              </h2>
              <div className="grid gap-4">
                {result.criteria.map((criterion, idx) => (
                  <Card key={idx} className="border border-gray-200">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">
                            {idx + 1}. {criterion.name}
                          </h4>
                          <p className="text-sm text-gray-600 mb-4">
                            {criterion.explanation}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-semibold text-gray-600 uppercase">
                                İnsan
                              </span>
                              <span className="text-sm font-bold text-green-600">
                                %{criterion.humanProbability}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-green-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${criterion.humanProbability}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-semibold text-gray-600 uppercase">
                                AI
                              </span>
                              <span className="text-sm font-bold text-red-600">
                                %{criterion.aiProbability}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-red-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${criterion.aiProbability}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={resetTest}
                className="flex-1 bg-purple-600 hover:bg-purple-700 gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Başka Video Test Et
              </Button>
              <Button
                onClick={() => {
                  const text = `AI Video Test Sonucu:\n\nGenel Sonuç:\nİnsan Yapımı: %${result.overall.humanProbability}\nAI Üretimi: %${result.overall.aiProbability}\nVerdikt: ${result.overall.verdict}\n\nÖzet: ${result.overall.summary}`;
                  navigator.clipboard.writeText(text);
                  toast.success("Sonuç kopyalandı!");
                }}
                variant="outline"
                className="gap-2"
              >
                Sonucu Kopyala
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
