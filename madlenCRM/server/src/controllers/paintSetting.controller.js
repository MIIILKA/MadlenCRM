const PaintSetting = require('../models/PaintSetting');

exports.getSettings = async (req, res) => {
    try {
        let settings = await PaintSetting.findOne();
        if (!settings) {
            settings = await PaintSetting.create({
                pricing: { dye: 15, oxid: 5, supplies: 50 }
            });
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: "Помилка сервера" });
    }
};

// server/src/controllers/paintSetting.controller.js
exports.updateSettings = async (req, res) => {
    try {
        let settings = await PaintSetting.findOne();
        if (!settings) settings = new PaintSetting();

        // Просто присвоюємо весь об'єкт pricing з тіла запиту
        settings.pricing = req.body;
        settings.updatedAt = Date.now();

        await settings.save();
        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: "Помилка збереження" });
    }
};

