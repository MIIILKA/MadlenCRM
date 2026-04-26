const Service = require("../models/Service");

// Отримати всі послуги
exports.getAllServices = async (req, res) => {
    try {
        const services = await Service.find().populate('category', 'name color slug');
        res.status(200).json(services);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Створити нову послугу
exports.createService = async (req, res) => {
    try {
        const { name, price, duration, category, description } = req.body;
        const newService = new Service({ name, price, duration, category, description });
        await newService.save();
        res.status(201).json(newService);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Оновити послугу
exports.updateService = async (req, res) => {
    try {
        const updated = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate('category', 'name color slug');
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Видалення послуги
exports.deleteService = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedService = await Service.findByIdAndDelete(id);

        if (!deletedService) {
            return res.status(404).json({ message: "Послугу не знайдено" });
        }

        res.status(200).json({ message: "Послугу успішно видалено" });
    } catch (error) {
        res.status(500).json({ message: "Помилка при видаленні", error: error.message });
    }
};