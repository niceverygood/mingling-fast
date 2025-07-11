import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto bg-white min-h-screen p-6">
      <div className="prose max-w-none">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">개인정보처리방침</h1>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. 개인정보의 수집 및 이용목적</h2>
            <p className="text-gray-700 leading-relaxed">
              밍글링(Mingling)은 다음과 같은 목적으로 개인정보를 수집 및 이용합니다:
            </p>
            <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
              <li>서비스 제공 및 계정 관리</li>
              <li>AI 캐릭터와의 대화 서비스 제공</li>
              <li>사용자 맞춤형 서비스 제공</li>
              <li>서비스 개선 및 고객 지원</li>
              <li>결제 및 정산 서비스</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. 수집하는 개인정보의 항목</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-800">필수정보</h3>
                <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                  <li>이메일 주소 (Google OAuth)</li>
                  <li>사용자 이름</li>
                  <li>프로필 정보</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-800">선택정보</h3>
                <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                  <li>캐릭터 생성 정보</li>
                  <li>채팅 기록</li>
                  <li>서비스 이용 기록</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. 개인정보의 보유 및 이용기간</h2>
            <p className="text-gray-700 leading-relaxed">
              개인정보는 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 
              단, 관련 법령에 의해 보존할 필요가 있는 경우에는 해당 기간 동안 보관합니다.
            </p>
            <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
              <li>회원 탈퇴 시: 즉시 삭제</li>
              <li>서비스 이용기록: 1년</li>
              <li>결제 기록: 5년 (전자상거래법)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. 개인정보의 제3자 제공</h2>
            <p className="text-gray-700 leading-relaxed">
              회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 
              다만, 다음의 경우에는 예외로 합니다:
            </p>
            <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. 개인정보 보호를 위한 기술적·관리적 대책</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>개인정보 암호화</li>
              <li>해킹 등에 대비한 기술적 대책</li>
              <li>개인정보 취급 직원의 최소화 및 교육</li>
              <li>개인정보보호 전담기구의 운영</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. 이용자의 권리</h2>
            <p className="text-gray-700 leading-relaxed">
              이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며, 
              가입해지를 요청할 수도 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. 개인정보보호책임자</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>담당자:</strong> 개인정보보호책임자<br/>
                <strong>연락처:</strong> privacy@minglingchat.com<br/>
                <strong>처리시간:</strong> 평일 9:00~18:00
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. 고지의 의무</h2>
            <p className="text-gray-700 leading-relaxed">
              현 개인정보처리방침은 2025년 7월 12일부터 적용되며, 
              법령·정책 또는 보안기술의 변경에 따라 내용의 추가·삭제 및 수정이 있을 시에는 
              변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
            </p>
            <p className="text-gray-600 text-sm mt-4">
              <strong>공고일자:</strong> 2025년 7월 12일<br/>
              <strong>시행일자:</strong> 2025년 7월 12일
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 