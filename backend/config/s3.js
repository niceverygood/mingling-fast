const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// AWS S3 설정
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-northeast-2'
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'mingling-new';

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

// Multer S3 설정
const createUploadMiddleware = (folder = 'uploads', maxSize = 5 * 1024 * 1024) => {
  return multer({
    storage: multerS3({
      s3: s3,
      bucket: BUCKET_NAME,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: function (req, file, cb) {
        const fileName = generateFileName(file.originalname, folder);
        cb(null, fileName);
      }
    }),
    limits: {
      fileSize: maxSize // 기본 5MB
    },
    fileFilter: imageFilter
  });
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

// S3에서 파일 삭제
const deleteFileFromS3 = async (fileUrl) => {
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

// S3 URL 생성
const getS3Url = (key) => {
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-northeast-2'}.amazonaws.com/${key}`;
};

// 파일 존재 여부 확인
const checkFileExists = async (key) => {
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
  checkFileExists,
  generateFileName
}; 