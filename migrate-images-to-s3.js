const AWS = require('aws-sdk');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// AWS S3 설정
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-northeast-2'
});

const prisma = new PrismaClient();
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'mingling-new';

// 파일 업로드 함수
async function uploadFileToS3(filePath, s3Key) {
  try {
    const fileContent = fs.readFileSync(filePath);
    const contentType = getContentType(filePath);
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: fileContent,
      ContentType: contentType
    };
    
    const result = await s3.upload(params).promise();
    console.log(`✅ Uploaded: ${filePath} → ${result.Location}`);
    return result.Location;
  } catch (error) {
    console.error(`❌ Failed to upload ${filePath}:`, error.message);
    return null;
  }
}

// Content Type 결정
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  return contentTypes[ext] || 'application/octet-stream';
}

// S3 키 생성 (폴더/파일명)
function generateS3Key(type, fileName) {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 10);
  const ext = path.extname(fileName);
  const baseName = path.basename(fileName, ext);
  
  const sanitizedName = baseName.replace(/[^a-zA-Z0-9가-힣]/g, '_');
  const newFileName = `${timestamp}_${randomId}_${sanitizedName}${ext}`;
  
  return `${type}/${newFileName}`;
}

// 사용자 아바타 마이그레이션
async function migrateUserAvatars() {
  console.log('🔄 Migrating user avatars...');
  
  const users = await prisma.user.findMany({
    where: {
      avatarUrl: {
        not: null,
        not: {
          startsWith: 'https://mingling-new.s3'
        }
      }
    }
  });
  
  for (const user of users) {
    if (!user.avatarUrl) continue;
    
    // 로컬 파일 경로 추정
    const localPaths = [
      `./uploads/users/${user.avatarUrl}`,
      `./backend/uploads/users/${user.avatarUrl}`,
      `./uploads/${user.avatarUrl}`,
      user.avatarUrl // 절대 경로인 경우
    ];
    
    let filePath = null;
    for (const path of localPaths) {
      if (fs.existsSync(path)) {
        filePath = path;
        break;
      }
    }
    
    if (!filePath) {
      console.log(`⚠️  User avatar not found: ${user.avatarUrl}`);
      continue;
    }
    
    const s3Key = generateS3Key('users', path.basename(filePath));
    const s3Url = await uploadFileToS3(filePath, s3Key);
    
    if (s3Url) {
      await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: s3Url }
      });
      console.log(`✅ Updated user ${user.id}: ${user.avatarUrl} → ${s3Url}`);
    }
  }
}

// 캐릭터 아바타 마이그레이션
async function migrateCharacterAvatars() {
  console.log('🔄 Migrating character avatars...');
  
  const characters = await prisma.character.findMany({
    where: {
      avatarUrl: {
        not: null,
        not: {
          startsWith: 'https://mingling-new.s3'
        }
      }
    }
  });
  
  for (const character of characters) {
    if (!character.avatarUrl) continue;
    
    const localPaths = [
      `./uploads/characters/${character.avatarUrl}`,
      `./backend/uploads/characters/${character.avatarUrl}`,
      `./uploads/${character.avatarUrl}`,
      character.avatarUrl
    ];
    
    let filePath = null;
    for (const path of localPaths) {
      if (fs.existsSync(path)) {
        filePath = path;
        break;
      }
    }
    
    if (!filePath) {
      console.log(`⚠️  Character avatar not found: ${character.avatarUrl}`);
      continue;
    }
    
    const s3Key = generateS3Key('characters', path.basename(filePath));
    const s3Url = await uploadFileToS3(filePath, s3Key);
    
    if (s3Url) {
      await prisma.character.update({
        where: { id: character.id },
        data: { avatarUrl: s3Url }
      });
      console.log(`✅ Updated character ${character.id}: ${character.avatarUrl} → ${s3Url}`);
    }
  }
}

// 페르소나 아바타 마이그레이션
async function migratePersonaAvatars() {
  console.log('🔄 Migrating persona avatars...');
  
  const personas = await prisma.persona.findMany({
    where: {
      avatarUrl: {
        not: null,
        not: {
          startsWith: 'https://mingling-new.s3'
        }
      }
    }
  });
  
  for (const persona of personas) {
    if (!persona.avatarUrl) continue;
    
    const localPaths = [
      `./uploads/personas/${persona.avatarUrl}`,
      `./backend/uploads/personas/${persona.avatarUrl}`,
      `./uploads/${persona.avatarUrl}`,
      persona.avatarUrl
    ];
    
    let filePath = null;
    for (const path of localPaths) {
      if (fs.existsSync(path)) {
        filePath = path;
        break;
      }
    }
    
    if (!filePath) {
      console.log(`⚠️  Persona avatar not found: ${persona.avatarUrl}`);
      continue;
    }
    
    const s3Key = generateS3Key('personas', path.basename(filePath));
    const s3Url = await uploadFileToS3(filePath, s3Key);
    
    if (s3Url) {
      await prisma.persona.update({
        where: { id: persona.id },
        data: { avatarUrl: s3Url }
      });
      console.log(`✅ Updated persona ${persona.id}: ${persona.avatarUrl} → ${s3Url}`);
    }
  }
}

// 메인 마이그레이션 함수
async function main() {
  console.log('🚀 Starting image migration to S3...');
  console.log(`📦 Target bucket: ${BUCKET_NAME}`);
  
  try {
    await migrateUserAvatars();
    await migrateCharacterAvatars();
    await migratePersonaAvatars();
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = {
  main,
  migrateUserAvatars,
  migrateCharacterAvatars,
  migratePersonaAvatars
}; 