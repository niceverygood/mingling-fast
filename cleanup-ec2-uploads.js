const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 안전하게 디렉토리 삭제
function safeDeleteDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`📂 Directory not found: ${dirPath}`);
    return false;
  }

  try {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        safeDeleteDirectory(filePath);
      } else {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Deleted file: ${filePath}`);
      }
    }
    
    fs.rmdirSync(dirPath);
    console.log(`🗑️  Deleted directory: ${dirPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to delete ${dirPath}:`, error.message);
    return false;
  }
}

// 백업 생성
function createBackup(sourceDir, backupDir) {
  if (!fs.existsSync(sourceDir)) {
    console.log(`📂 Source directory not found: ${sourceDir}`);
    return false;
  }

  try {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const files = fs.readdirSync(sourceDir);
    
    for (const file of files) {
      const sourcePath = path.join(sourceDir, file);
      const backupPath = path.join(backupDir, file);
      const stat = fs.statSync(sourcePath);
      
      if (stat.isDirectory()) {
        createBackup(sourcePath, backupPath);
      } else {
        fs.copyFileSync(sourcePath, backupPath);
        console.log(`💾 Backed up: ${sourcePath} → ${backupPath}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to create backup:`, error.message);
    return false;
  }
}

// S3 마이그레이션 완료 확인
async function verifyMigration() {
  console.log('🔍 Verifying S3 migration completion...');
  
  try {
    // S3 URL이 아닌 avatarUrl 확인
    const [users, characters, personas] = await Promise.all([
      prisma.user.count({
        where: {
          avatarUrl: {
            not: null,
            not: { startsWith: 'https://mingling-new.s3' }
          }
        }
      }),
      prisma.character.count({
        where: {
          avatarUrl: {
            not: null,
            not: { startsWith: 'https://mingling-new.s3' }
          }
        }
      }),
      prisma.persona.count({
        where: {
          avatarUrl: {
            not: null,
            not: { startsWith: 'https://mingling-new.s3' }
          }
        }
      })
    ]);

    const totalNonS3 = users + characters + personas;
    
    if (totalNonS3 > 0) {
      console.log(`⚠️  Warning: ${totalNonS3} records still have non-S3 URLs:`);
      console.log(`   - Users: ${users}`);
      console.log(`   - Characters: ${characters}`);
      console.log(`   - Personas: ${personas}`);
      return false;
    } else {
      console.log('✅ All avatarUrl records are using S3 URLs');
      return true;
    }
  } catch (error) {
    console.error('❌ Failed to verify migration:', error);
    return false;
  }
}

// 메인 클린업 함수
async function main() {
  console.log('🧹 Starting EC2 uploads cleanup...');
  
  const uploadPaths = [
    './uploads',
    './backend/uploads',
    '/home/ubuntu/uploads',
    '/home/ubuntu/mingling_new/uploads',
    '/home/ubuntu/mingling_new/backend/uploads'
  ];

  // 1. 마이그레이션 완료 확인
  const migrationComplete = await verifyMigration();
  
  if (!migrationComplete) {
    console.log('❌ Migration not complete. Aborting cleanup.');
    console.log('💡 Please run the migration script first: node migrate-images-to-s3.js');
    return;
  }

  // 2. 백업 생성 (선택사항)
  const createBackupConfirm = process.argv.includes('--backup');
  
  if (createBackupConfirm) {
    console.log('💾 Creating backup before cleanup...');
    const backupDir = `./uploads-backup-${Date.now()}`;
    
    for (const uploadPath of uploadPaths) {
      if (fs.existsSync(uploadPath)) {
        const backupPath = path.join(backupDir, path.basename(uploadPath));
        createBackup(uploadPath, backupPath);
      }
    }
  }

  // 3. uploads 디렉토리 삭제
  let deletedCount = 0;
  
  for (const uploadPath of uploadPaths) {
    if (safeDeleteDirectory(uploadPath)) {
      deletedCount++;
    }
  }

  // 4. 결과 보고
  console.log('\n📊 Cleanup Summary:');
  console.log(`✅ Deleted ${deletedCount} upload directories`);
  console.log('🎉 EC2 cleanup completed successfully!');
  
  if (createBackupConfirm) {
    console.log(`💾 Backup created in: ./uploads-backup-${Date.now()}`);
  }

  await prisma.$disconnect();
}

// 도움말 출력
function showHelp() {
  console.log(`
🧹 EC2 Uploads Cleanup Script

Usage:
  node cleanup-ec2-uploads.js [options]

Options:
  --backup    Create backup before deletion
  --help      Show this help message

Examples:
  node cleanup-ec2-uploads.js                    # Clean without backup
  node cleanup-ec2-uploads.js --backup           # Clean with backup
  
⚠️  Warning: This script will permanently delete upload directories.
   Make sure S3 migration is complete before running!
`);
}

// 스크립트 실행
if (require.main === module) {
  if (process.argv.includes('--help')) {
    showHelp();
  } else {
    main();
  }
}

module.exports = { main, verifyMigration, createBackup, safeDeleteDirectory }; 