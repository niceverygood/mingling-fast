import React from 'react';

const TestPage = () => {
  return (
    <div className="min-h-screen bg-blue-500 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">🎉 Mingling Fast</h1>
        <p className="text-xl mb-4">Vercel 배포 성공!</p>
        <p className="text-lg">AI 캐릭터 채팅 앱</p>
        
        <div className="mt-8 p-6 bg-white rounded-lg text-black max-w-md mx-auto">
          <h2 className="text-xl font-bold mb-4">✅ 배포 상태</h2>
          <ul className="text-left space-y-2">
            <li>✅ React 앱 로딩 완료</li>
            <li>✅ Tailwind CSS 적용</li>
            <li>✅ Vercel 배포 성공</li>
            <li>⏳ Firebase 설정 진행 예정</li>
            <li>⏳ 백엔드 연결 진행 예정</li>
          </ul>
          
          <div className="mt-6">
            <button 
              onClick={() => window.location.href = '/app'}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              메인 앱으로 이동
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage; 