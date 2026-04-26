const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');

// Отримати всі (публічно)
router.get('/', categoryController.getAllCategories);

// Створити (тільки адмін)
router.post('/', authMiddleware, adminMiddleware, categoryController.createCategory);

// Оновити (тільки адмін) - ТУТ МОГЛА БУТИ ПОМИЛКА
router.put('/:id', authMiddleware, adminMiddleware, categoryController.updateCategory);

// Видалити (тільки адмін)
router.delete('/:id', authMiddleware, adminMiddleware, categoryController.deleteCategory);

module.exports = router;