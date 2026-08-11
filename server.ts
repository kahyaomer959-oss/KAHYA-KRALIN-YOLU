import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "5mb" }));

  // Initialize Gemini AI client safely
  const getAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables.");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // API Route: Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // API Route: AI Royal Advisor / Sadrazam Danışmanı
  app.post("/api/gemini/advisor", async (req, res) => {
    try {
      const { userMessage, gameContext, promptType } = req.body;

      const ai = getAiClient();

      const lang = gameContext?.language || "Turkish";
      const rulerTitle = gameContext?.rulerTitle || "Hükümdar";
      const rulerName = gameContext?.heroName || "Sultan";
      const country = gameContext?.countryName || "Devlet-i Aliyye";
      const gold = gameContext?.gold ?? 1000;
      const manpower = gameContext?.manpower ?? 5000;
      const happiness = gameContext?.happiness ?? 75;
      const difficulty = gameContext?.difficulty || "Normal";
      const activeWar = gameContext?.activeWar ? "Savaştayız!" : "Barış Dönemi";
      const dateStr = `${gameContext?.month || 'Ocak'} ${gameContext?.year || 1520}`;

      let systemInstruction = "";
      if (lang === "English") {
        systemInstruction = `You are the Grand Vizier & Royal AI Advisor in the historical grand strategy game 'KAHYA: Way of the Ruler'.
You advise ${rulerTitle} ${rulerName} of ${country}.
Date: ${dateStr}.
Current State of the Empire:
- Treasury Gold: ${gold}
- Military Manpower: ${manpower}
- Population Loyalty/Happiness: %${happiness}
- Difficulty: ${difficulty}
- War Status: ${activeWar}

Your tone must be authoritative, deeply loyal, strategic, and atmospheric like a medieval Ottoman Grand Vizier.
Provide concise, sharp, actionable strategic counsel (max 3 short paragraphs). Adapt to user's questions or state analysis requests. Use rich historical statecraft vocabulary.`;
      } else if (lang === "Arabic") {
        systemInstruction = `أنت الصدر الأعظم والمستشار الملكي في لعبة الاستراتيجية التاريخية 'KAHYA: Way of the Ruler'.
أنت تُسدي النصيحة لـ ${rulerTitle} ${rulerName} حاكم ${country}.
التاريخ: ${dateStr}.
حالة الدولة الحالية:
- الخزينة: ${gold} ذهب
- القوة العسكرية: ${manpower} جندي
- ولاء ورضا الشعب: %${happiness}
- مستوى الصعوبة: ${difficulty}
- حالة الحرب: ${activeWar}

استخدم أسلوباً ملكياً، مخلصاً، وتاريخياً بليغاً. قدم نصائح استراتيجية حكيمة وموجزة (3 فقرات قصيرة كحد أقصى).`;
      } else {
        // Turkish Default
        systemInstruction = `Sen 'KAHYA: Kralın Yolu' adlı tarihi devlet yönetimi strateji oyunundaki bilge ve sadık Baş Sadrazamsın.
Hükümdarın: ${rulerTitle} ${rulerName} (${country} Devleti).
Tarih: ${dateStr}.
Mevcut Devlet Durumu:
- Hazine Altını: ${gold} Altın
- Asker Sayısı / İnsan Gücü: ${manpower} Asker
- Halkın Sadakati ve Huzuru: %${happiness}
- Zorluk Derecesi: ${difficulty}
- Askeri Durum: ${activeWar}

Üslubun: Derin, sadık, ferman ve divan adabına uygun, vakur ve bilge bir Osmanlı Sadrazamı.
Hükümdara (oyuncuya) sorusuna veya duruma göre en doğru, somut ve stratejik devlet tavsiyelerini ver.
Metin maksimum 3 kısa paragraf olsun. Akıcı, etkileyici ve tarihi heybeti hissettiren Türkçe kullan.`;
      }

      let userPrompt = userMessage;
      if (promptType === "analyze") {
        userPrompt = lang === "English" 
          ? "Analyze the overall situation of our Empire and give me 3 priority decrees to execute immediately."
          : lang === "Arabic"
          ? "حلل الوضع العام لإمبراطوريتنا وقدم لي 3 قرارات أولوية للتنفيذ فوراً."
          : "Devletimizin genel durumunu analiz et ve hemen uygulamam gereken 3 öncelikli devlet hamlesini söyle.";
      } else if (promptType === "military") {
        userPrompt = lang === "English"
          ? "What should be our military strategy right now?"
          : lang === "Arabic"
          ? "ما هي استراتيجيتنا العسكرية في الوقت الحالي؟"
          : "Mevcut askeri gücümüz ve savaş durumumuz ışığında ordu stratejimiz ne olmalı?";
      } else if (promptType === "economy") {
        userPrompt = lang === "English"
          ? "How can we maximize our treasury income and trade stability?"
          : lang === "Arabic"
          ? "كيف يمكننا تعظيم دخل الخزينة واستقرار التجارة؟"
          : "Hazinedeki altınımızı artırmak ve ticareti güçlendirmek için ne yapmalıyız?";
      } else if (promptType === "decree") {
        userPrompt = lang === "English"
          ? "Draft a grand Imperial Royal Decree for the empire."
          : lang === "Arabic"
          ? "اكتب فراماناً شاهانياً ملكياً مهيباً للإمبراطورية."
          : "Devletimiz için halka ilan edilecek heybetli bir Hümayun Fermanı kaleme al.";
      }

      // Try generating content with model fallback
      let response;
      const modelsToTry = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-2.5-flash-lite"];
      let lastError: any = null;

      for (const modelName of modelsToTry) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: userPrompt,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          });
          break;
        } catch (mErr: any) {
          lastError = mErr;
          console.warn(`Model ${modelName} failed, trying next...`, mErr?.message);
        }
      }

      if (!response || !response.text) {
        throw lastError || new Error("All Gemini models failed to generate response.");
      }

      res.json({
        success: true,
        advice: response.text,
      });
    } catch (err: any) {
      console.error("Gemini Advisor API Error:", err);
      res.status(500).json({
        success: false,
        error: err?.message || "Sadrazam şu an divanda meşgul. Lütfen tekrar deneyin.",
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
