"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUploadError = exports.uploadAvatar = exports.uploadLogo = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const env_1 = __importDefault(require("../config/env"));
const uuid_1 = require("uuid");
// Créer le dossier uploads s'il n'existe pas
const uploadDir = env_1.default.UPLOAD_DIR || './uploads';
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// Configuration storage pour logos
const logoStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const logoDir = path_1.default.join(uploadDir, 'logos');
        if (!fs_1.default.existsSync(logoDir)) {
            fs_1.default.mkdirSync(logoDir, { recursive: true });
        }
        cb(null, logoDir);
    },
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const filename = `logo-${(0, uuid_1.v4)()}${ext}`;
        cb(null, filename);
    },
});
// Filtre pour les images
const imageFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only images are allowed.'));
    }
};
// Configuration multer pour logos
exports.uploadLogo = (0, multer_1.default)({
    storage: logoStorage,
    fileFilter: imageFilter,
    limits: {
        fileSize: typeof env_1.default.MAX_FILE_SIZE === 'number' ? env_1.default.MAX_FILE_SIZE : parseInt(String(env_1.default.MAX_FILE_SIZE) || '5242880'), // 5MB par défaut
    },
});
// Storage pour avatars / photos de profil
const avatarStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const avatarDir = path_1.default.join(uploadDir, 'avatars');
        if (!fs_1.default.existsSync(avatarDir)) {
            fs_1.default.mkdirSync(avatarDir, { recursive: true });
        }
        cb(null, avatarDir);
    },
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname) || '.jpg';
        const filename = `avatar-${(0, uuid_1.v4)()}${ext}`;
        cb(null, filename);
    },
});
exports.uploadAvatar = (0, multer_1.default)({
    storage: avatarStorage,
    fileFilter: imageFilter,
    limits: {
        fileSize: typeof env_1.default.MAX_FILE_SIZE === 'number' ? env_1.default.MAX_FILE_SIZE : parseInt(String(env_1.default.MAX_FILE_SIZE) || '5242880'),
    },
});
// Middleware pour gérer les erreurs multer
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 5MB.',
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
    next();
};
exports.handleUploadError = handleUploadError;
//# sourceMappingURL=upload.middleware.js.map