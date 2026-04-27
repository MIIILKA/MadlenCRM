const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Налаштування
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
console.log("☁️ Cloudinary ENV check:", {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "❌ ВІДСУТНІЙ",
    api_key: process.env.CLOUDINARY_API_KEY ? "✅ є" : "❌ ВІДСУТНІЙ",
    api_secret: process.env.CLOUDINARY_API_SECRET ? "✅ є" : "❌ ВІДСУТНІЙ",
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'madlen_staff',
        format: async (req, file) => {
            const extension = file.mimetype.split('/')[1];
            return ['jpeg', 'png', 'jpg', 'webp'].includes(extension) ? extension : 'jpg';
        },
        public_id: (req, file) => `avatar-${Date.now()}`,
    },
});

const upload = multer({ storage: storage });

// Обробка помилок, щоб сервер не падав, а казав у чому справа
const uploadWithErrorHandling = (req, res, next) => {
    console.log("📥 [BACKEND MIDDLEWARE] Отримано запит на завантаження файлу");

    upload.single('avatar')(req, res, (err) => {
        if (err) {
            console.error("❌ [CLOUDINARY ERROR] message:", err.message);
            console.error("❌ [CLOUDINARY ERROR] http_code:", err.http_code);
            console.error("❌ [CLOUDINARY ERROR] name:", err.name);
            console.error("❌ [CLOUDINARY ERROR] stack:", err.stack);
            return res.status(500).json({
                message: "Cloudinary Error",
                details: err.message
            });
        }

        if (req.file) {
            console.log("✅ [BACKEND MIDDLEWARE] Файл успішно прийнято Multer:", req.file.path);
        } else {
            console.log("ℹ️ [BACKEND MIDDLEWARE] Файл у запиті відсутній");
        }
        next();
    });
};


module.exports = uploadWithErrorHandling;