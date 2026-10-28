import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Code2,
  Copy,
  Download,
  Loader2,
  Sparkles,
  Terminal,
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

/**
 * Interprets a free-text topic and produces a concrete code snippet in the
 * selected language. Matches common beginner requests ("hello world", "button",
 * "form", "counter", "list", etc.) and falls back to a generic template that
 * still reflects the topic the user typed.
 */
function generateCode(lang: Language, topic: string): { code: string; explanation: string } {
  const t = topic.trim();
  const lower = t.toLowerCase();

  // --- Hello World ---
  if (/(hello\s*world|merhaba\s*dünya)/.test(lower)) {
    if (lang === "javascript")
      return { code: `console.log("Hello, World!");`, explanation: "Ekrana 'Hello, World!' yazdırır." };
    if (lang === "python")
      return { code: `print("Hello, World!")`, explanation: "Ekrana 'Hello, World!' yazdırır." };
    if (lang === "html")
      return { code: `<!DOCTYPE html>\n<html>\n  <body>\n    <h1>Hello, World!</h1>\n  </body>\n</html>`, explanation: "Hello, World! başlığını gösteren HTML sayfası." };
    if (lang === "css")
      return { code: `body {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n  font-size: 2rem;\n}`, explanation: "İçeriği ekranın ortasına hizalar (Hello, World için)." };
    if (lang === "sql")
      return { code: `SELECT 'Hello, World!' AS greeting;`, explanation: "'Hello, World!' metnini bir sorgu sonucu olarak döndürür." };
    return { code: `#!/bin/bash\necho "Hello, World!"`, explanation: "Terminale 'Hello, World!' yazdırır." };
  }

  // --- Counter / Sayaç ---
  if (/(counter|sayaç|sayac)/.test(lower)) {
    if (lang === "javascript")
      return {
        code: `let count = 0;

function increment() {
  count++;
  console.log("Sayı:", count);
}

function decrement() {
  count--;
  console.log("Sayı:", count);
}

increment(); // 1
increment(); // 2
decrement(); // 1`,
        explanation: "Artır/azalt fonksiyonlarıyla basit bir sayaç.",
      };
    if (lang === "python")
      return {
        code: `count = 0

def increment():
    global count
    count += 1
    print("Sayı:", count)

def decrement():
    global count
    count -= 1
    print("Sayı:", count)

increment()  # 1
increment()  # 2
decrement()  # 1`,
        explanation: "Artır/azalt fonksiyonlarıyla basit bir sayaç.",
      };
    if (lang === "html")
      return {
        code: `<!DOCTYPE html>
<html>
  <body>
    <h1>Sayaç: <span id="count">0</span></h1>
    <button onclick="increment()">+ Artır</button>
    <button onclick="decrement()">- Azalt</button>
    <script>
      let count = 0;
      function update() { document.getElementById("count").textContent = count; }
      function increment() { count++; update(); }
      function decrement() { count--; update(); }
    </script>
  </body>
</html>`,
        explanation: "Çalışan bir HTML sayaç — butonlara basınca sayı değişir.",
      };
    return { code: `#!/bin/bash\ncount=0\n((count++))\necho "Sayı: $count"`, explanation: "Bash'te basit sayaç." };
  }

  // --- Button / Buton ---
  if (/(button|buton)/.test(lower)) {
    if (lang === "html")
      return {
        code: `<button id="myBtn" onclick="alert('Tıklandı!')">Tıkla</button>`,
        explanation: "Tıklanınca uyarı gösteren bir buton.",
      };
    if (lang === "css")
      return {
        code: `button {\n  padding: 12px 24px;\n  font-size: 16px;\n  border: none;\n  border-radius: 8px;\n  background: #2563eb;\n  color: white;\n  cursor: pointer;\n}\nbutton:hover {\n  background: #1e40af;\n}`,
        explanation: "Mavi, hover efektli bir buton stili.",
      };
    if (lang === "javascript")
      return {
        code: `document.getElementById("myBtn").addEventListener("click", () => {\n  console.log("Butona tıklandı");\n});`,
        explanation: "Bir butona tıklama olayı ekler.",
      };
    return {
      code: `# ${t} için Python örneği\nclass Button:\n    def __init__(self, label):\n        self.label = label\n    def click(self):\n        print(f"{self.label} tıklandı")\n\nbtn = Button("Gönder")\nbtn.click()`,
      explanation: "Basit bir Button sınıfı örneği.",
    };
  }

  // --- Form ---
  if (/(form|iletişim|contact|kayıt|register|login|giriş)/.test(lower)) {
    if (lang === "html")
      return {
        code: `<!DOCTYPE html>
<html>
  <body>
    <form id="myForm">
      <label>Ad: <input type="text" name="name" required></label><br>
      <label>E-posta: <input type="email" name="email" required></label><br>
      <textarea name="message" placeholder="Mesaj"></textarea><br>
      <button type="submit">Gönder</button>
    </form>
    <script>
      document.getElementById("myForm").addEventListener("submit", (e) => {
        e.preventDefault();
        alert("Form gönderildi!");
      });
    </script>
  </body>
</html>`,
        explanation: "Ad, e-posta ve mesaj alanlı çalışan bir form.",
      };
    if (lang === "css")
      return {
        code: `form {\n  max-width: 400px;\n  margin: 20px auto;\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n}\ninput, textarea {\n  padding: 10px;\n  border: 1px solid #ccc;\n  border-radius: 6px;\n}\nbutton {\n  padding: 12px;\n  background: #2563eb;\n  color: white;\n  border: none;\n  border-radius: 6px;\n  cursor: pointer;\n}`,
        explanation: "Form alanları için temiz, düzenli bir stil.",
      };
    return { code: `-- Kullanıcı kayıtlarını tutan tablo\nCREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  name VARCHAR(100) NOT NULL,\n  email VARCHAR(255) UNIQUE NOT NULL,\n  created_at TIMESTAMP DEFAULT NOW()\n);`, explanation: "Form verilerini kaydetmek için users tablosu." };
  }

  // --- List / Liste / Array ---
  if (/(list|liste|array|dizi|to.do|yapılacak)/.test(lower)) {
    if (lang === "javascript")
      return {
        code: `const todos = ["Ödev yap", "E-posta gönder", "Koşuya çık"];

todos.forEach((item, i) => {
  console.log(\`\${i + 1}. \${item}\`);
});

// Yeni öğe ekle
todos.push("Kitap oku");
console.log("Güncel liste:", todos);`,
        explanation: "Bir yapılacaklar listesi — ekrana yazdırma ve öğe ekleme.",
      };
    if (lang === "python")
      return {
        code: `todos = ["Ödev yap", "E-posta gönder", "Koşuya çık"]

for i, item in enumerate(todos, 1):
    print(f"{i}. {item}")

# Yeni öğe ekle
todos.append("Kitap oku")
print("Güncel liste:", todos)`,
        explanation: "Bir yapılacaklar listesi — ekrana yazdırma ve öğe ekleme.",
      };
    return {
      code: `const list = document.getElementById("list");\nconst items = ["Elma", "Armut", "Muz"];\nitems.forEach(item => {\n  const li = document.createElement("li");\n  li.textContent = item;\n  list.appendChild(li);\n});`,
      explanation: "JS ile bir listeye öğe ekleme.",
    };
  }

  // --- Calculator / Hesap makinesi ---
  if (/(calculator|hesap\s*makine)/.test(lower)) {
    if (lang === "python")
      return {
        code: `def calculator(a, b, op):\n    if op == "+": return a + b\n    if op == "-": return a - b\n    if op == "*": return a * b\n    if op == "/": return a / b if b != 0 else "Sıfıra bölme"\n    return "Geçersiz işlem"\n\nprint(calculator(10, 5, "+"))  # 15\nprint(calculator(10, 5, "*"))  # 50`,
        explanation: "Toplama, çıkarma, çarpma, bölme yapan bir hesap makinesi.",
      };
    if (lang === "javascript")
      return {
        code: `function calculator(a, b, op) {\n  switch (op) {\n    case "+": return a + b;\n    case "-": return a - b;\n    case "*": return a * b;\n    case "/": return b !== 0 ? a / b : "Sıfıra bölme";\n    default: return "Geçersiz işlem";\n  }\n}\n\nconsole.log(calculator(10, 5, "+")); // 15\nconsole.log(calculator(10, 5, "*")); // 50`,
        explanation: "Dört işlem yapan bir hesap makinesi fonksiyonu.",
      };
    if (lang === "html")
      return {
        code: `<!DOCTYPE html>\n<html>\n  <body>\n    <input id="a" type="number" value="10">\n    <select id="op"><option>+</option><option>-</option><option>*</option><option>/</option></select>\n    <input id="b" type="number" value="5">\n    <button onclick="calc()">Hesapla</button>\n    <p id="result"></p>\n    <script>\n      function calc() {\n        const a = +document.getElementById("a").value;\n        const b = +document.getElementById("b").value;\n        const op = document.getElementById("op").value;\n        const r = eval(a + op + b);\n        document.getElementById("result").textContent = r;\n      }\n    </script>\n  </body>\n</html>`,
        explanation: "Çalışan bir HTML hesap makinesi.",
      };
    return { code: `-- Hesap geçmişi tablosu\nCREATE TABLE calc_history (\n  id SERIAL PRIMARY KEY,\n  expression TEXT,\n  result NUMERIC,\n  created_at TIMESTAMP DEFAULT NOW()\n);`, explanation: "Hesap işlemlerini saklayan tablo." };
  }

  // --- Timer / Zamanlayıcı ---
  if (/(timer|zamanlayıcı|kronometre|stopwatch)/.test(lower)) {
    if (lang === "javascript")
      return {
        code: `let seconds = 0;\nconst timer = setInterval(() => {\n  seconds++;\n  console.log(\`Geçen süre: \${seconds}sn\`);\n  if (seconds >= 10) clearInterval(timer);\n}, 1000);`,
        explanation: "Saniyede bir artan, 10 saniye sonra duran bir zamanlayıcı.",
      };
    if (lang === "python")
      return {
        code: `import time\n\nseconds = 0\nwhile seconds < 10:\n    seconds += 1\n    print(f"Geçen süre: {seconds}sn")\n    time.sleep(1)`,
        explanation: "Saniyede bir artan, 10 saniye sonra duran bir zamanlayıcı.",
      };
    if (lang === "html")
      return {
        code: `<!DOCTYPE html>\n<html>\n  <body>\n    <h1 id="timer">0sn</h1>\n    <button onclick="start()">Başlat</button>\n    <script>\n      let s = 0, id;\n      function start() {\n        id = setInterval(() => {\n          s++;\n          document.getElementById("timer").textContent = s + "sn";\n          if (s >= 10) clearInterval(id);\n        }, 1000);\n      }\n    </script>\n  </body>\n</html>`,
        explanation: "Çalışan bir HTML zamanlayıcı.",
      };
    return { code: `#!/bin/bash\ns=0\nwhile [ $s -lt 10 ]; do\n  ((s++))\n  echo "Geçen süre: \${s}sn"\n  sleep 1\ndone`, explanation: "Bash zamanlayıcı." };
  }

  // --- Fetch / API ---
  if (/(fetch|api|http|request|istek)/.test(lower)) {
    if (lang === "javascript")
      return {
        code: `async function fetchData(url) {\n  try {\n    const res = await fetch(url);\n    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);\n    return await res.json();\n  } catch (e) {\n    console.error("İstek başarısız:", e);\n  }\n}\n\nfetchData("https://api.example.com/${snakeCase(t)}").then(console.log);`,
        explanation: "async/await ile GET isteği, hata yönetimi içerir.",
      };
    if (lang === "python")
      return {
        code: `import urllib.request, json\n\ndef fetch_data(url):\n    with urllib.request.urlopen(url) as r:\n        return json.loads(r.read().decode())\n\ndata = fetch_data("https://api.example.com/${snakeCase(t)}")\nprint(data)`,
        explanation: "urllib ile GET isteği.",
      };
    return { code: `-- API log tablosu\nCREATE TABLE api_logs (\n  id SERIAL PRIMARY KEY,\n  endpoint TEXT,\n  status INT,\n  created_at TIMESTAMP DEFAULT NOW()\n);`, explanation: "API isteklerini loglayan tablo." };
  }

  // --- Loop / Döngü ---
  if (/(loop|döngü|for|while|yinele)/.test(lower)) {
    if (lang === "javascript")
      return {
        code: `for (let i = 1; i <= 5; i++) {\n  console.log(\`Sayı: \${i}\`);\n}`,
        explanation: "1'den 5'e kadar yazdıran for döngüsü.",
      };
    if (lang === "python")
      return {
        code: `for i in range(1, 6):\n    print(f"Sayı: {i}")`,
        explanation: "1'den 5'e kadar yazdıran for döngüsü.",
      };
    return { code: `#!/bin/bash\nfor i in 1 2 3 4 5; do\n  echo "Sayı: $i"\ndone`, explanation: "Bash for döngüsü." };
  }

  // --- Generic fallback: build a working snippet from the topic ---
  if (lang === "javascript") {
    return {
      code: `// ${t} için JavaScript örneği
function ${snakeCase(t) || "run"}() {
  console.log("${t} çalıştı");
  return "${t}";
}

${snakeCase(t) || "run"}();`,
      explanation: `"${t}" konusu için temel bir JavaScript fonksiyonu. Çalıştığında konsola mesaj yazar.`,
    };
  }
  if (lang === "python") {
    return {
      code: `# ${t} için Python örneği
def ${snakeCase(t) || "run"}():
    print("${t} çalıştı")
    return "${t}"

${snakeCase(t) || "run"}()`,
      explanation: `"${t}" konusu için temel bir Python fonksiyonu. Çalıştığında ekrana mesaz yazar.`,
    };
  }
  if (lang === "html") {
    return {
      code: `<!DOCTYPE html>
<html>
  <head><title>${capitalize(t)}</title></head>
  <body>
    <h1>${capitalize(t)}</h1>
    <p>${t} hakkında bir sayfa.</p>
  </body>
</html>`,
      explanation: `"${t}" konulu basit bir HTML sayfası.`,
    };
  }
  if (lang === "css") {
    return {
      code: `/* ${t} için CSS */
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: sans-serif;
}

.${snakeCase(t) || "box"} {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
}`,
      explanation: `"${t}" için temel bir CSS düzeni.`,
    };
  }
  if (lang === "sql") {
    return {
      code: `-- ${t} için SQL
CREATE TABLE ${snakeCase(t) || "items"} (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

SELECT * FROM ${snakeCase(t) || "items"};`,
      explanation: `"${t}" için bir tablo oluşturup veri çeken SQL.`,
    };
  }
  // bash
  return {
    code: `#!/bin/bash
# ${t} için bash script
echo "${t} başlıyor..."
echo "Tamamlandı."`,
    explanation: `"${t}" için temel bir bash betiği.`,
  };
}

type CodingResult = {
  code: string;
  explanation: string;
  language: Language;
  topic: string;
};

export default function CodingAssistant() {
  const [topic, setTopic] = useState("");
  const [selectedLang, setSelectedLang] = useState<Language>("javascript");
  const [result, setResult] = useState<CodingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGenerate = () => {
    if (!topic.trim()) {
      toast.error("Lütfen bir konu girin.");
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      const { code, explanation } = generateCode(selectedLang, topic);
      const codingResult: CodingResult = { code, explanation, language: selectedLang, topic: topic.trim() };
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
      toast.success("Kod oluşturuldu!");
    }, 400);
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
              Ne yapmak istediğini yaz, dil seç — hazır kod anında oluşsun
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
                    maxLength={60}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isProcessing && topic.trim()) handleGenerate();
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    İpucu: "hello world", "sayaç", "hesap makinesi", "form", "timer", "liste" gibi yazabilirsin.
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
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Kod Oluştur
                    </>
                  )}
                </Button>
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
            ) : (
              <Card className="border-dashed border-2 border-border h-full min-h-[300px] flex items-center justify-center bg-white shadow-sm">
                <CardContent className="text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center mx-auto mb-4">
                    <Code2 className="w-8 h-8 text-pink-400" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Kod Hazır Değil</h3>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    Ne yapmak istediğini yaz (örn: "hello world"), dil seç ve "Kod Oluştur"a tıkla.
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
