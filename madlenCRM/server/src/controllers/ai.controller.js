const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.getBeautyAdvice = async (req, res) => {
    console.log("\n--- 🚀 ЗАПУСК ЗАПИТУ ---");

    try {
        if (!req.file) return res.status(400).json({ error: "Файл не отримано" });

        const fileBuffer = fs.readFileSync(req.file.path);
        const base64Image = fileBuffer.toString("base64");

        // ВИКОРИСТОВУЄМО ТІЛЬКИ ЦЮ НАЗВУ
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });


        const prompt = `Ти свій чувак, крутий барбер/стиліст із Madlen. 
Аналізуй фото за категорією: ${req.body.category || 'загальне'}.

Дай дружню пораду в 2-3 реченнях. Пиши просто, без офіціозу і БЕЗ жодних символів розмітки (ніяких зірочок, решіток тощо).
Просто текст, як у месенджері. 

Наприклад: "Слухай, у тебе крута густота, але цей довгий чубчик трохи закриває обличчя. Спробуй текстурований кроп і фейд на скронях — буде виглядати набагато свіжіше!"`;
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: req.file.mimetype
                }
            }
        ]);

        const text = result.response.text();

        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        res.json({ advice: text });

    } catch (error) {
        console.error("❌ ПОМИЛКА ШІ:", error.message);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        res.status(500).json({
            error: "Помилка ШІ",
            details: error.message
        });
    }
};