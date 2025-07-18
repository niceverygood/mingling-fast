const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// 로컬 환경 체크
const isLocal = process.env.NODE_ENV === 'development' && !process.env.AWS_ACCESS_KEY_ID;

// AWS S3 설정 (프로덕션용)
let s3;
if (!isLocal) {
  s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'ap-northeast-2'
  });
}

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'mingling-new';

// 로컬 업로드 디렉토리 생성
const LOCAL_UPLOAD_DIR = path.join(__dirname, '../uploads');
if (isLocal && !fs.existsSync(LOCAL_UPLOAD_DIR)) {
  fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
  console.log('📁 Created local upload directory:', LOCAL_UPLOAD_DIR);
}

// 이미지 파일 필터
const imageFilter = (req, file, cb) => {
  // 허용되는 이미지 타입
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed!'), false);
  }
};

// 파일명 생성 함수
const generateFileName = (originalname, folder = '') => {
  const timestamp = Date.now();
  const randomId = uuidv4().slice(0, 8);
  const extension = path.extname(originalname);
  const baseName = path.basename(originalname, extension);
  
  // 한글 파일명 처리
  const sanitizedName = baseName.replace(/[^a-zA-Z0-9가-힣]/g, '_');
  
  return folder 
    ? `${folder}/${timestamp}_${randomId}_${sanitizedName}${extension}`
    : `${timestamp}_${randomId}_${sanitizedName}${extension}`;
};

// 로컬 스토리지 설정
const createLocalStorage = (folder = 'uploads') => {
  const localDir = path.join(LOCAL_UPLOAD_DIR, folder);
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }
  
  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, localDir);
    },
    filename: function (req, file, cb) {
      const fileName = generateFileName(file.originalname);
      cb(null, fileName);
    }
  });
};

// Multer 설정 (S3 또는 로컬)
const createUploadMiddleware = (folder = 'uploads', maxSize = 5 * 1024 * 1024) => {
  const config = {
    limits: {
      fileSize: maxSize // 기본 5MB
    },
    fileFilter: imageFilter
  };

  if (isLocal) {
    // 로컬 환경: 디스크 스토리지 사용
    config.storage = createLocalStorage(folder);
    console.log(`📁 Using local storage for ${folder}`);
  } else {
    // 프로덕션 환경: S3 스토리지 사용
    config.storage = multerS3({
      s3: s3,
      bucket: BUCKET_NAME,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: function (req, file, cb) {
        const fileName = generateFileName(file.originalname, folder);
        cb(null, fileName);
      }
    });
    console.log(`☁️ Using S3 storage for ${folder}`);
  }

  return multer(config);
};

// 특정 용도별 업로드 미들웨어
const uploadMiddlewares = {
  // 캐릭터 아바타 (2MB 제한)
  character: createUploadMiddleware('characters', 2 * 1024 * 1024),
  
  // 페르소나 아바타 (2MB 제한)
  persona: createUploadMiddleware('personas', 2 * 1024 * 1024),
  
  // 사용자 프로필 (2MB 제한)
  user: createUploadMiddleware('users', 2 * 1024 * 1024),
  
  // 일반 이미지 (5MB 제한)
  general: createUploadMiddleware('general', 5 * 1024 * 1024)
};

// S3에서 파일 삭제 (프로덕션용)
const deleteFileFromS3 = async (fileUrl) => {
  if (isLocal) {
    // 로컬 환경에서는 로컬 파일 삭제
    try {
      const filePath = fileUrl.replace('http://localhost:8001/', path.join(__dirname, '../'));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ Local file deleted: ${filePath}`);
        return true;
      }
    } catch (error) {
      console.error('❌ Error deleting local file:', error);
      return false;
    }
  }

  try {
    // URL에서 키 추출
    const urlParts = fileUrl.split('/');
    const key = urlParts.slice(-2).join('/'); // folder/filename
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: key
    };
    
    await s3.deleteObject(params).promise();
    console.log(`✅ File deleted from S3: ${key}`);
    return true;
  } catch (error) {
    console.error('❌ Error deleting file from S3:', error);
    return false;
  }
};

// URL 생성
const getFileUrl = (filePath, folder) => {
  if (isLocal) {
    return `http://localhost:8001/uploads/${folder}/${path.basename(filePath)}`;
  } else {
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-northeast-2'}.amazonaws.com/${filePath}`;
  }
};

// S3 URL 생성 (하위 호환성)
const getS3Url = (key) => {
  return getFileUrl(key);
};

// 파일 존재 여부 확인
const checkFileExists = async (key) => {
  if (isLocal) {
    const filePath = path.join(LOCAL_UPLOAD_DIR, key);
    return fs.existsSync(filePath);
  }

  try {
    await s3.headObject({
      Bucket: BUCKET_NAME,
      Key: key
    }).promise();
    return true;
  } catch {
    return false;
  }
};

module.exports = {
  s3,
  BUCKET_NAME,
  uploadMiddlewares,
  deleteFileFromS3,
  getS3Url,
  getFileUrl,
  checkFileExists,
  generateFileName,
  isLocal,
  LOCAL_UPLOAD_DIR
}; 