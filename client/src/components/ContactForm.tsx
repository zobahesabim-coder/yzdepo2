import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mail, Send, CheckCircle, Loader } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { toast } from "sonner";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error("Lütfen tüm alanları doldurun");
      return;
    }

    setIsSubmitting(true);
    try {
      if (!isSupabaseConfigured) {
        toast.error("Veritabanı bağlantısı yapılmamış. Lütfen sayfayı yenileyin.");
        return;
      }
      const { error } = await supabase.from("feedbacks").insert({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      });

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }

      setIsSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });

      setTimeout(() => {
        setIsSubmitted(false);
      }, 6000);
    } catch (error: any) {
      console.error("Form submission error:", error);
      const msg =
        error?.message?.includes("rate limit")
          ? "Çok hızlı gönderim yapıyorsunuz, lütfen biraz bekleyin."
          : error?.message?.includes("permission")
          ? "İzin hatası: Veritabanı erişimi engellendi."
          : "Geri bildirim gönderme sırasında bir hata oluştu: " + (error?.message || "Bilinmeyen hata");
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-12 bg-gradient-to-b from-white to-slate-50 border-t border-border overflow-hidden">
      <div className="container">
        <div className="max-w-2xl mx-auto">
          {/* Header - Giriş animasyonu */}
          <div
            className={`text-center mb-8 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4 animate-pulse">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Bize Ulaşın</h2>
            <p className="text-muted-foreground">
              Geri bildiriminiz ve önerileriniz bizim için çok önemli. Lütfen aşağıdaki formu doldurun.
            </p>
          </div>

          {/* Form */}
          <Card
            className={`p-8 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {isSubmitted ? (
              // Başarılı onay mesajı - Havalı animasyon
              <div className="flex flex-col items-center justify-center py-12 animate-in fade-in zoom-in duration-500">
                {/* Başarı ikonu - Pulsating animasyon */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-green-400/20 rounded-full animate-pulse" style={{ animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50 animate-bounce" style={{ animationDuration: "1s" }}>
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                </div>

                {/* Başarı başlığı */}
                <h3 className="text-3xl font-bold text-foreground mb-2 animate-in slide-in-from-bottom duration-700">
                  Teşekkür Ederiz! 🎉
                </h3>

                {/* Başarı mesajı */}
                <p className="text-muted-foreground text-center max-w-sm animate-in slide-in-from-bottom duration-700 delay-100">
                  Geri bildiriminiz başarıyla gönderildi. En kısa sürede sizinle iletişime geçeceğiz.
                </p>

                {/* Konfetti efekti simülasyonu */}
                <div className="mt-8 flex gap-2 justify-center flex-wrap">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"
                      style={{
                        animation: `ping 2s cubic-bezier(0, 0, 0.2, 1) infinite`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name - Staggered animasyon */}
                <div
                  className={`transition-all duration-700 ${
                    isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                  }`}
                  style={{ transitionDelay: "100ms" }}
                >
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Adınız
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Adınızı girin"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 hover:border-primary/50"
                  />
                </div>

                {/* Email - Staggered animasyon */}
                <div
                  className={`transition-all duration-700 ${
                    isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                  }`}
                  style={{ transitionDelay: "150ms" }}
                >
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email Adresiniz
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@example.com"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 hover:border-primary/50"
                  />
                </div>

                {/* Subject - Staggered animasyon */}
                <div
                  className={`transition-all duration-700 ${
                    isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                  }`}
                  style={{ transitionDelay: "200ms" }}
                >
                  <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                    Konu
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Konuyu kısaca yazın"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 hover:border-primary/50"
                  />
                </div>

                {/* Message - Staggered animasyon */}
                <div
                  className={`transition-all duration-700 ${
                    isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                  }`}
                  style={{ transitionDelay: "250ms" }}
                >
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                    Mesajınız
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Mesajınızı yazın..."
                    rows={5}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 hover:border-primary/50 resize-none"
                  />
                </div>

                {/* Submit Button - Şık yükleme efekti */}
                <div
                  className={`transition-all duration-700 ${
                    isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                  }`}
                  style={{ transitionDelay: "300ms" }}
                >
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 text-base gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-primary/25"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span className="inline-block">Gönderiliyor</span>
                        <span className="inline-block ml-1 animate-pulse">...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Geri Bildirim Gönder
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </Card>

          {/* Info - Giriş animasyonu */}
          <p
            className={`text-center text-sm text-muted-foreground mt-6 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: "400ms" }}
          >
            Gönderdiğiniz geri bildirimler tamamen gizli tutulur ve sadece okul yönetimi tarafından görülebilir.
          </p>
        </div>
      </div>
    </section>
  );
}
