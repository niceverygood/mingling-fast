import React, { createContext, useContext, useState } from 'react';
import CustomPopup from '../components/CustomPopup';

const PopupContext = createContext();

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error('usePopup must be used within a PopupProvider');
  }
  return context;
};

export const PopupProvider = ({ children }) => {
  const [popups, setPopups] = useState([]);

  // 팝업 추가 함수
  const showPopup = (popupConfig) => {
    const id = Date.now().toString();
    const popup = {
      id,
      ...popupConfig,
      onClose: () => {
        removePopup(id);
        if (popupConfig.onClose) popupConfig.onClose();
      },
      onConfirm: () => {
        removePopup(id);
        if (popupConfig.onConfirm) popupConfig.onConfirm();
      },
      onCancel: () => {
        removePopup(id);
        if (popupConfig.onCancel) popupConfig.onCancel();
      }
    };
    
    setPopups(prev => [...prev, popup]);
    return id;
  };

  // 팝업 제거 함수
  const removePopup = (id) => {
    setPopups(prev => prev.filter(popup => popup.id !== id));
  };

  // 모든 팝업 제거
  const clearPopups = () => {
    setPopups([]);
  };

  // 편의 함수들
  const showAlert = (message, title = '알림', options = {}) => {
    return showPopup({
      type: 'info',
      title,
      message,
      ...options
    });
  };

  const showSuccess = (message, title = '성공', options = {}) => {
    return showPopup({
      type: 'success',
      title,
      message,
      ...options
    });
  };

  const showError = (message, title = '오류', options = {}) => {
    return showPopup({
      type: 'error',
      title,
      message,
      ...options
    });
  };

  const showWarning = (message, title = '경고', options = {}) => {
    return showPopup({
      type: 'warning',
      title,
      message,
      ...options
    });
  };

  const showHeartAlert = (message, title = '하트', options = {}) => {
    return showPopup({
      type: 'heart',
      title,
      message,
      ...options
    });
  };

  const showConfirm = (message, title = '확인', options = {}) => {
    return new Promise((resolve) => {
      showPopup({
        type: 'warning',
        title,
        message,
        showCancel: true,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
        ...options
      });
    });
  };

  // 결제 성공 전용 팝업
  const showPaymentSuccess = (amount, newBalance, options = {}) => {
    return showPopup({
      type: 'success',
      title: '결제 성공! 🎉',
      message: `${amount}개의 하트가 충전되었습니다!\n현재 하트: ${newBalance}개`,
      confirmText: '확인',
      ...options
    });
  };

  // 캐릭터 생성 성공 팝업
  const showCharacterSuccess = (characterName, title = '캐릭터 생성 완료! ✨', options = {}) => {
    return showPopup({
      type: 'success',
      title,
      message: options.message || `"${characterName}" 캐릭터가 성공적으로 생성되었습니다!`,
      confirmText: '확인',
      ...options
    });
  };

  // 페르소나 생성 성공 팝업
  const showPersonaSuccess = (personaName, title = '페르소나 생성 완료! ✨', options = {}) => {
    return showPopup({
      type: 'success',
      title,
      message: options.message || `"${personaName}" 페르소나가 성공적으로 생성되었습니다!`,
      confirmText: '확인',
      ...options
    });
  };

  // 캐릭터 삭제 확인 팝업
  const showCharacterDeleteConfirm = (characterName, options = {}) => {
    return new Promise((resolve) => {
      showPopup({
        type: 'warning',
        title: '캐릭터 삭제',
        message: `"${characterName}" 캐릭터를 삭제하시겠습니까?\n\n⚠️ 삭제된 캐릭터와의 모든 대화 기록이 함께 삭제됩니다.`,
        showCancel: true,
        confirmText: '삭제',
        cancelText: '취소',
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
        ...options
      });
    });
  };

  // 하트 부족 알림 팝업
  const showInsufficientHearts = (currentHearts = 0, options = {}) => {
    return showPopup({
      type: 'heart',
      title: '하트가 부족해요! 💔',
      message: `현재 하트: ${currentHearts}개\n\n메시지를 보내려면 하트가 필요합니다.\n하트샵에서 충전하시겠습니까?`,
      confirmText: '하트샵 가기',
      showCancel: true,
      cancelText: '나중에',
      ...options
    });
  };

  // 네트워크 에러 팝업
  const showNetworkError = (options = {}) => {
    return showPopup({
      type: 'error',
      title: '연결 실패',
      message: '네트워크 연결을 확인하고 다시 시도해주세요.',
      confirmText: '다시 시도',
      ...options
    });
  };

  const value = {
    showPopup,
    removePopup,
    clearPopups,
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showHeartAlert,
    showConfirm,
    showPaymentSuccess,
    showCharacterSuccess,
    showPersonaSuccess,
    showCharacterDeleteConfirm,
    showInsufficientHearts,
    showNetworkError
  };

  return (
    <PopupContext.Provider value={value}>
      {children}
      
      {/* 팝업 렌더링 */}
      {popups.map(popup => (
        <CustomPopup
          key={popup.id}
          isOpen={true}
          {...popup}
        />
      ))}
    </PopupContext.Provider>
  );
};

export default PopupContext; 