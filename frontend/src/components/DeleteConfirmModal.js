import React, { useState } from 'react';
import { ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/24/outline';
import Avatar from './Avatar';

const DeleteConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  character,
  loading = false 
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [agreed, setAgreed] = useState(false);

  if (!isOpen || !character) return null;

  const isValidConfirm = confirmText === character.name && agreed;

  const handleConfirm = () => {
    if (isValidConfirm && !loading) {
      onConfirm();
    }
  };

  const handleClose = () => {
    if (!loading) {
      setConfirmText('');
      setAgreed(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-red-100 rounded-full">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">캐릭터 삭제</h3>
            <p className="text-sm text-gray-500">이 작업은 되돌릴 수 없습니다</p>
          </div>
        </div>

        {/* Character Info */}
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg mb-4">
          <Avatar 
            src={character.avatarUrl}
            alt={character.name}
            name={character.name}
            size="md"
            fallbackType="emoji"
          />
          <div>
            <h4 className="font-medium text-gray-900">{character.name}</h4>
            <p className="text-sm text-gray-500">{character.description || '설명 없음'}</p>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">다음 데이터가 함께 삭제됩니다:</p>
              <ul className="text-xs space-y-0.5 ml-4">
                <li>• 이 캐릭터와의 모든 대화 기록</li>
                <li>• 관계 진전 히스토리 및 추억</li>
                <li>• 성취 및 특별 이벤트 기록</li>
                <li>• 캐릭터 프로필 이미지</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Confirmation Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            삭제를 확인하려면 캐릭터 이름을 정확히 입력하세요:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={character.name}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            disabled={loading}
          />
          {confirmText && confirmText !== character.name && (
            <p className="text-sm text-red-600 mt-1">이름이 일치하지 않습니다</p>
          )}
        </div>

        {/* Agreement Checkbox */}
        <div className="mb-6">
          <label className="flex items-start space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              disabled={loading}
            />
            <span className="text-sm text-gray-700">
              위험성을 이해했으며, 이 캐릭터와 모든 관련 데이터를 영구적으로 삭제하는 것에 동의합니다.
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            disabled={loading}
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValidConfirm || loading}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>삭제 중...</span>
              </>
            ) : (
              <>
                <TrashIcon className="w-4 h-4" />
                <span>영구 삭제</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal; 