import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Image,
  Mic,
  FileType,
  Code2,
  Sparkles,
  ArrowRight,
  Zap,
  Shield,
  Users,
  ChevronRight,
  ExternalLink,
  X,
} from "lucide-react";
import ContactForm from "@/components/ContactForm";

const tools = [
  {
    id: "logo",
    href: "/logo",
    icon: Image,
    label: "Logo Üreteci",
    description:
      "Okul veya marka adını gir, AI ile modern, temiz ve profesyonel logolar oluştur. PNG formatında indir.",
    badge: "PNG İndir",
    color: "from-purple-500 to-purple-700",
    bg: "bg-purple-50",
    iconColor: "text-purple-600",
    borderColor: "hover:border-purple-300",
  },
  {
    id: "voice",
    href: "/voice",
    icon: Mic,
    label: "Ses Değiştirici",
    description:
      "Ses veya video dosyası yükle, AI ile ses tonunu değiştir. Otomatik transkripsiyon ve içerik analizi.",
    badge: "Transkripsiyon",
    color: "from-emerald-500 to-emerald-700",
    bg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    borderColor: "hover:border-emerald-300",
  },
  {
    id: "converter",
    href: "/converter",
    icon: FileType,
    label: "Dönüştürücü",
    description:
      "Dosya formatını değiştir: TXT, PDF, JPG, PNG ve daha fazlası. Kağıda yazılan yazıyı resimden metne çevir (OCR).",
    badge: "Format + OCR",
    color: "from-orange-500 to-orange-600",
    bg: "bg-orange-50",
    iconColor: "text-orange-600",
    borderColor: "hover:border-orange-300",
  },
  {
    id: "coding",
    href: "/coding",
    icon: Code2,
    label: "Kodlama Asistanı",
    description:
      "HTML, CSS, JS ve Python kod üret. Kodu sade dille açıkla, hataları bul ve iyileştirme önerileri al.",
    badge: "4 Dil",
    color: "from-pink-500 to-rose-600",
    bg: "bg-pink-50",
    iconColor: "text-pink-600",
    borderColor: "hover:border-pink-300",
  },
  {
    id: "video-test",
    href: "/ai-video-test",
    icon: Zap,
    label: "AI Test",
    description:
      "Yüklenen video yapay zeka tarafından oluşturulmuş mu yoksa gerçek insan videosu mu? AI ile ayırt et.",
    badge: "Analiz",
    color: "from-cyan-500 to-blue-600",
    bg: "bg-cyan-50",
    iconColor: "text-cyan-600",
    borderColor: "hover:border-cyan-300",
  },
];

const features = [
  {
    icon: Zap,
    title: "Hızlı İşlem",
    desc: "Saniyeler içinde AI destekli sonuçlar",
    color: "text-yellow-500",
    bg: "bg-yellow-50",
  },
  {
    icon: Shield,
    title: "Güvenli Depolama",
    desc: "Tüm verileriniz güvenli ve gizli",
    color: "text-green-500",
    bg: "bg-green-50",
  },
  {
    icon: Users,
    title: "Öğrenciler İçin",
    desc: "Eğitim ve yaratıcılık için tasarlandı",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
];

export default function Home() {
  const [showTools, setShowTools] = useState(false);

  if (showTools) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Tools Section */}
        <section className="py-16 flex-1">
          <div className="container">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-2">AI Araçları</h1>
                  <p className="text-muted-foreground">
                    Öğrenciler için tasarlanmış güçlü AI araçlarını keşfet
                  </p>
                </div>
                <button
                  onClick={() => setShowTools(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-6 h-6 text-foreground" />
                </button>
              </div>

              {/* Tools Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Link key={tool.id} href={tool.href}>
                      <Card
                        className={`tool-card h-full border-2 border-border ${tool.borderColor} cursor-pointer bg-white shadow-sm transition-all duration-300 hover:shadow-lg`}
                      >
                        <CardContent className="p-6 flex flex-col h-full">
                          {/* Icon */}
                          <div
                            className={`w-12 h-12 rounded-xl ${tool.bg} flex items-center justify-center mb-4 shadow-sm`}
                          >
                            <Icon className={`w-6 h-6 ${tool.iconColor}`} />
                          </div>

                          {/* Header */}
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-semibold text-foreground">{tool.label}</h3>
                            <Badge variant="secondary" className="text-xs shrink-0 ml-2">
                              {tool.badge}
                            </Badge>
                          </div>

                          {/* Description */}
                          <p className="text-muted-foreground text-sm leading-relaxed flex-1 mb-4">
                            {tool.description}
                          </p>

                          {/* CTA */}
                          <div
                            className={`flex items-center gap-2 text-sm font-medium bg-gradient-to-r ${tool.color} bg-clip-text text-transparent`}
                          >
                            Kullanmaya Başla
                            <ArrowRight className="w-4 h-4 text-current" style={{ color: "inherit" }} />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}

                {/* Coming Soon card */}
                <Card className="border-2 border-dashed border-border bg-slate-50/50 flex items-center justify-center min-h-[220px]">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-muted-foreground">Yakında Yeni Araçlar</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">Daha fazlası geliyor...</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8 bg-slate-50/50">
          <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-medium text-foreground">SMG Yapay Zeka</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <p>© 2025 SMG Yapay Zeka. Öğrenciler için tasarlandı.</p>
              <span
                className="text-sm font-bold text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: "800", letterSpacing: "-0.3px", fontSize: "14px" }}
              >
                ✨ Made by @Beratkarabudak
              </span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      {/* Hero Section */}
      <section className="w-full max-w-2xl text-center">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-b from-blue-50/80 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-10 w-32 h-32 bg-purple-100/60 rounded-full blur-2xl" />
          <div className="absolute top-1/2 left-10 w-24 h-24 bg-emerald-100/60 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Öğrenciler için AI Platformu
          </div>

          {/* Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            SMG Yapay Zeka ile{" "}
            <span className="gradient-text">Üretkenliğini</span>
            <br />
            Bir Üst Seviyeye Taşı
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-12 leading-relaxed">
            Logo üret, ses ve video düzenle, kod yaz — hepsi tek platformda,
            tek tıkla. Öğrenciler için tasarlanmış güçlü AI araçları.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button
              size="lg"
              className="gap-2 px-8 shadow-lg shadow-primary/25 w-full sm:w-auto"
              onClick={() => setShowTools(true)}
            >
              Başlayın
              <ArrowRight className="w-4 h-4" />
            </Button>
            <a href="https://smgmtal.meb.k12.tr/" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="gap-2 px-8 w-full sm:w-auto">
                Okulumuz Hakkında
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground text-base">5</span> AI Araç
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground text-base">100%</span> Ücretsiz
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground text-base">4</span> Programlama Dili
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <ContactForm />

      {/* Features */}
      <section className="py-16 bg-slate-50/50 w-full">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="flex items-start gap-4 p-6 rounded-2xl bg-white border border-border shadow-sm"
                >
                  <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-slate-50/50 w-full">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-medium text-foreground">SMG Yapay Zeka</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <p>© 2025 SMG Yapay Zeka. Öğrenciler için tasarlandı.</p>
            <span
              className="text-sm font-bold text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: "800", letterSpacing: "-0.3px", fontSize: "14px" }}
            >
              ✨ Made by @Beratkarabudak
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
