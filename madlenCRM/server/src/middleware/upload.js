const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Налаштування
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'madlen_staff',
        // Ми прибрали трансформації звідси, щоб не було конфліктів підпису
        // Cloudinary все одно збереже файл як є
    }
});

const upload = multer({ storage: storage });

// Обробка помилок, щоб сервер не падав, а казав у чому справа
const uploadWithErrorHandling = (req, res, next) => {
    upload.single('avatar')(req, res, (err) => {
        if (err) {
            console.log("❌ CLOUDINARY ERROR:", err.message);
            return res.status(500).json({
                message: "Cloudinary Error",
                details: err.message
            });
        }
        next();
    });
};

module.exports = uploadWithErrorHandling;