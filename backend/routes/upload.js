const express = require('express');
const multer = require('multer');
const router = express.Router();
const { uploadMiddlewares, deleteFileFromS3, isLocal, getFileUrl } = require('../config/s3');

// 캐릭터 아바타 업로드
router.post('/character-avatar', uploadMiddlewares.character.single('avatar'), (req, res) => {
  try {
    console.log('📤 Character avatar upload request received');
    console.log('Request file:', req.file);
    console.log('Request body:', req.body);
    
    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // 로컬 환경에서는 파일 URL을 직접 생성
    const fileUrl = isLocal 
      ? `http://localhost:8001/uploads/characters/${req.file.filename}`
      : req.file.location;

    console.log('✅ Character avatar uploaded successfully:', fileUrl);
    res.json({
      success: true,
      message: 'Character avatar uploaded successfully',
      data: {
        url: fileUrl,
        key: req.file.key || req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('❌ Error uploading character avatar:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to upload character avatar', details: error.message });
  }
});

// 페르소나 아바타 업로드
router.post('/persona-avatar', uploadMiddlewares.persona.single('avatar'), (req, res) => {
  try {
    console.log('📤 Persona avatar upload request received');
    console.log('Request file:', req.file);
    
    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // 로컬 환경에서는 파일 URL을 직접 생성
    const fileUrl = isLocal 
      ? `http://localhost:8001/uploads/personas/${req.file.filename}`
      : req.file.location;

    console.log('✅ Persona avatar uploaded successfully:', fileUrl);
    res.json({
      success: true,
      message: 'Persona avatar uploaded successfully',
      data: {
        url: fileUrl,
        key: req.file.key || req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('❌ Error uploading persona avatar:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to upload persona avatar', details: error.message });
  }
});

// 사용자 프로필 이미지 업로드
router.post('/user-profile', uploadMiddlewares.user.single('profile'), (req, res) => {
  try {
    console.log('📤 User profile upload request received');
    console.log('Request file:', req.file);
    
    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // 로컬 환경에서는 파일 URL을 직접 생성
    const fileUrl = isLocal 
      ? `http://localhost:8001/uploads/users/${req.file.filename}`
      : req.file.location;

    console.log('✅ User profile uploaded successfully:', fileUrl);
    res.json({
      success: true,
      message: 'User profile image uploaded successfully',
      data: {
        url: fileUrl,
        key: req.file.key || req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('❌ Error uploading user profile image:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to upload user profile image', details: error.message });
  }
});

// 일반 이미지 업로드
router.post('/image', uploadMiddlewares.general.single('image'), (req, res) => {
  try {
    console.log('📤 General image upload request received');
    console.log('Request file:', req.file);
    
    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // 로컬 환경에서는 파일 URL을 직접 생성
    const fileUrl = isLocal 
      ? `http://localhost:8001/uploads/general/${req.file.filename}`
      : req.file.location;

    console.log('✅ General image uploaded successfully:', fileUrl);
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: fileUrl,
        key: req.file.key || req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to upload image', details: error.message });
  }
});

// 여러 이미지 업로드 (최대 5개)
router.post('/images', uploadMiddlewares.general.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = req.files.map(file => ({
      url: isLocal 
        ? `http://localhost:8001/uploads/general/${file.filename}`
        : file.location,
      key: file.key || file.filename,
      size: file.size,
      mimetype: file.mimetype
    }));

    res.json({
      success: true,
      message: `${req.files.length} images uploaded successfully`,
      data: uploadedFiles
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

// 파일 삭제
router.delete('/file', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'File URL is required' });
    }

    const deleted = await deleteFileFromS3(url);
    
    if (deleted) {
      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      res.status(500).json({ error: 'Failed to delete file' });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// 업로드 에러 핸들링 미들웨어
router.use((error, req, res, _next) => {
  console.error('🚨 Upload middleware error:', error);
  console.error('Error name:', error.name);
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  
  if (error instanceof multer.MulterError) {
    console.log('📋 Multer error details:', {
      code: error.code,
      field: error.field,
      message: error.message
    });
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File too large',
        message: 'File size exceeds the allowed limit',
        details: error.message
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        error: 'Too many files',
        message: 'Number of files exceeds the allowed limit',
        details: error.message
      });
    }
  }
  
  if (error.message.includes('Only image files')) {
    return res.status(400).json({ 
      error: 'Invalid file type',
      message: 'Only image files (JPEG, PNG, GIF, WebP) are allowed',
      details: error.message
    });
  }

  console.error('❌ Unknown upload error:', error);
  res.status(500).json({ 
    error: 'Upload failed', 
    message: error.message,
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

module.exports = router; 