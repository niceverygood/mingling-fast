import React, { useState, useRef } from 'react';
import { CameraIcon, XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { uploadAPI } from '../services/api';

const ImageUpload = ({ 
  type = 'image', // 'character', 'persona', 'user', 'image'
  currentImage = null,
  onUploadSuccess = () => {},
  onUploadError = () => {},
  maxSize = 2, // MB
  className = '',
  placeholder = '이미지를 업로드하세요'
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // 파일 유효성 검사
  const validateFile = (file) => {
    // 파일 타입 검사
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('JPEG, PNG, GIF, WebP 파일만 업로드 가능합니다.');
    }

    // 파일 크기 검사
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new Error(`파일 크기는 ${maxSize}MB 이하여야 합니다.`);
    }

    return true;
  };

  // 업로드 API 선택
  const getUploadAPI = (type) => {
    switch (type) {
      case 'character':
        return uploadAPI.characterImage;
      case 'persona':
        return uploadAPI.personaImage;
      case 'user':
        return uploadAPI.userProfile;
      default:
        return uploadAPI.image;
    }
  };

  // 파일 업로드 처리
  const handleUpload = async (file) => {
    try {
      setUploading(true);
      
      // 파일 유효성 검사
      validateFile(file);

      // 미리보기 설정
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);

      // FormData 생성
      const formData = new FormData();
      const fieldName = type === 'character' ? 'avatar' : 
                        type === 'persona' ? 'avatar' : 
                        type === 'user' ? 'profile' : 'image';
      formData.append(fieldName, file);

      // S3 업로드
      const uploadFunc = getUploadAPI(type);
      const response = await uploadFunc(formData);

      if (response.data.success) {
        setPreview(response.data.data.url);
        onUploadSuccess(response.data.data);
      } else {
        throw new Error('업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setPreview(currentImage);
      
      let errorMessage = '업로드에 실패했습니다.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      onUploadError(errorMessage);
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // 파일 선택 처리
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleUpload(file);
    }
  };

  // 드래그 앤 드롭 처리
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleUpload(files[0]);
    }
  };

  // 이미지 제거
  const handleRemove = () => {
    setPreview(null);
    onUploadSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 클릭으로 파일 선택
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      <div
        className={`
          relative border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer
          ${dragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${preview ? 'border-solid border-gray-200' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {preview ? (
          // 이미지 미리보기
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            
            {/* 오버레이 */}
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
              <div className="opacity-0 hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick();
                  }}
                  className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
                  title="이미지 변경"
                >
                  <CameraIcon className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                  className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
                  title="이미지 제거"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* 업로딩 상태 */}
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm">업로드 중...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // 업로드 영역
          <div className="p-8 text-center">
            <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">{placeholder}</p>
            <p className="text-sm text-gray-400">
              클릭하거나 파일을 드래그하세요
            </p>
            <p className="text-xs text-gray-400 mt-2">
              JPEG, PNG, GIF, WebP (최대 {maxSize}MB)
            </p>

            {/* 업로딩 상태 */}
            {uploading && (
              <div className="mt-4">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-blue-600">업로드 중...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload; 