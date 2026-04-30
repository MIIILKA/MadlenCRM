const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.getBeautyAdvice = async (req, res) => {

    try {
        if (!req.file) return res.status(400).json({ message: "Будь ласка, завантажте фото" });

        const { category } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const imageData = {
            inlineData: {
                data: Buffer.from(fs.readFileSync(req.file.path)).toString("base64"),
                mimeType: req.file.mimetype,
            },
        };

        let dynamicPrompt = "";
        if (category === 'nails') {
            dynamicPrompt = `Ти експерт з манікюру салону "Madlen". Проаналізуй фото рук. Порадь ідеальну форму нігтів та колір/дизайн, враховуючи довжину пальців та тон шкіри.`;
        } else if (category === 'color') {
            dynamicPrompt = `Ти топ-колорист "Madlen". Проаналізуй обличчя на фото. Порадь техніку фарбування та конкретні відтінки, які підкреслять колір очей та підтон шкіри.`;
        } else {
            dynamicPrompt = `Ти стиліст-перукар "Madlen". Проаналізуй форму обличчя на фото. Порадь найкращу стрижку, яка збалансує риси обличчя.`;
        }

        const result = await model.generateContent([
            `${dynamicPrompt} Пиши українською мовою, аргументуй пораду професійно, але лаконічно.`,
            imageData
        ]);

        const response = await result.response;

        // Видаляємо тимчасовий файл
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.json({ advice: response.text() });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ message: "Помилка ШІ-аналізу" });
    }
};