const Category = require('../models/Category');

// Отримати всі
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.status(200).json(categories);
    } catch (error) {
        console.error("❌ ERROR IN getAllCategories:", error);
        res.status(500).json({ message: "Помилка сервера при читанні категорій" });
    }
};

// Створити нову
exports.createCategory = async (req, res) => {
    try {
        const { name, color, slug } = req.body;

        if (!name) return res.status(400).json({ message: "Назва категорії обов'язкова" });

        // Генеруємо slug, якщо він не прийшов з фронта
        const finalSlug = slug || name.toLowerCase().trim().replace(/\s+/g, '-');

        const newCategory = new Category({
            name,
            slug: finalSlug,
            color: color || '#D4AF37'
        });

        await newCategory.save();
        res.status(201).json(newCategory);
    } catch (error) {
        console.error("❌ ERROR IN createCategory:", error);
        if (error.code === 11000) {
            return res.status(400).json({ message: "Така категорія вже існує (дублікат slug)" });
        }
        res.status(500).json({ message: "Помилка сервера при створенні категорії" });
    }
};

// Оновити категорію
exports.updateCategory = async (req, res) => {
    try {
        const { name, color } = req.body;
        // { new: true } повертає вже оновлений об'єкт, а не старий
        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            { name, color },
            { new: true, runValidators: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({ message: "Категорію не знайдено" });
        }

        res.json(updatedCategory);
    } catch (err) {
        res.status(400).json({ message: "Помилка оновлення", error: err.message });
    }
};

// Видалити категорію
exports.deleteCategory = async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: "Категорію видалено" });
    } catch (err) {
        res.status(500).json({ message: "Помилка при видаленні" });
    }
};
