import React from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon, 
  InformationCircleIcon,
  XMarkIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

const CustomPopup = ({ 
  isOpen, 
  onClose, 
  type = 'info', 
  title, 
  message, 
  confirmText = '확인', 
  cancelText = '취소', 
  onConfirm, 
  onCancel,
  showCancel = false,
  icon: customIcon,
  className = ''
}) => {
  if (!isOpen) return null;

  // 팝업 타입별 스타일과 아이콘 설정
  const popupStyles = {
    success: {
      iconColor: 'text-green-500',
      buttonColor: 'bg-green-500 hover:bg-green-600',
      borderColor: 'border-green-100',
      bgColor: 'bg-green-50',
      icon: CheckCircleIcon
    },
    error: {
      iconColor: 'text-red-500',
      buttonColor: 'bg-red-500 hover:bg-red-600',
      borderColor: 'border-red-100',
      bgColor: 'bg-red-50',
      icon: XCircleIcon
    },
    warning: {
      iconColor: 'text-yellow-500',
      buttonColor: 'bg-yellow-500 hover:bg-yellow-600',
      borderColor: 'border-yellow-100',
      bgColor: 'bg-yellow-50',
      icon: ExclamationTriangleIcon
    },
    info: {
      iconColor: 'text-blue-500',
      buttonColor: 'bg-blue-500 hover:bg-blue-600',
      borderColor: 'border-blue-100',
      bgColor: 'bg-blue-50',
      icon: InformationCircleIcon
    },
    heart: {
      iconColor: 'text-pink-500',
      buttonColor: 'bg-pink-500 hover:bg-pink-600',
      borderColor: 'border-pink-100',
      bgColor: 'bg-pink-50',
      icon: HeartIcon
    }
  };

  const currentStyle = popupStyles[type] || popupStyles.info;
  const IconComponent = customIcon || currentStyle.icon;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 오버레이 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={showCancel ? handleCancel : handleConfirm}
      />
      
      {/* 팝업 컨테이너 */}
      <div className={`
        relative bg-white rounded-2xl shadow-2xl 
        max-w-sm w-full mx-4 overflow-hidden
        transform transition-all duration-300 ease-out
        scale-100 opacity-100 translate-y-0
        ${className}
      `}>
        {/* 헤더 영역 */}
        <div className={`px-6 pt-6 pb-4 ${currentStyle.bgColor} ${currentStyle.borderColor} border-b`}>
          <div className="flex items-center justify-center mb-4">
            <div className={`
              w-16 h-16 rounded-full bg-white shadow-md 
              flex items-center justify-center
            `}>
              <IconComponent className={`w-8 h-8 ${currentStyle.iconColor}`} />
            </div>
          </div>
          
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              {title}
            </h3>
          )}
        </div>

        {/* 메시지 영역 */}
        <div className="px-6 py-4">
          <p className="text-gray-600 text-center leading-relaxed">
            {message}
          </p>
        </div>

        {/* 버튼 영역 */}
        <div className="px-6 pb-6">
          {showCancel ? (
            // 확인/취소 버튼
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 px-4 py-3 text-white rounded-xl font-medium transition-colors duration-200 ${currentStyle.buttonColor}`}
              >
                {confirmText}
              </button>
            </div>
          ) : (
            // 단일 확인 버튼
            <button
              onClick={handleConfirm}
              className={`w-full px-4 py-3 text-white rounded-xl font-medium transition-colors duration-200 ${currentStyle.buttonColor}`}
            >
              {confirmText}
            </button>
          )}
        </div>

        {/* 닫기 버튼 (우상단) */}
        {!showCancel && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

// 특별한 팝업 타입들
export const SuccessPopup = (props) => (
  <CustomPopup {...props} type="success" />
);

export const ErrorPopup = (props) => (
  <CustomPopup {...props} type="error" />
);

export const WarningPopup = (props) => (
  <CustomPopup {...props} type="warning" />
);

export const InfoPopup = (props) => (
  <CustomPopup {...props} type="info" />
);

export const HeartPopup = (props) => (
  <CustomPopup {...props} type="heart" />
);

export const ConfirmPopup = (props) => (
  <CustomPopup {...props} showCancel={true} />
);

export default CustomPopup; 