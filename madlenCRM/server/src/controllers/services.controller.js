const Service = require("../models/Service");

// Отримати всі послуги
exports.getAllServices = async (req, res) => {
    try {
        const services = await Service.find();
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