import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-black">개인정보 처리방침</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-8">
        {/* 기본 정보 */}
        <div className="bg-pink-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-pink-800 mb-2">💕 밍글링챗 개인정보 처리방침</h2>
          <p className="text-sm text-pink-700">
            <strong>시행일자:</strong> 2024년 1월 1일<br/>
            <strong>최종 수정일:</strong> {new Date().toLocaleDateString('ko-KR')}
          </p>
        </div>

        {/* 제1조 개인정보의 처리목적 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">제1조 (개인정보의 처리목적)</h3>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 mb-3">
              밍글링챗("https://www.minglingchat.com" 이하 "밍글링챗")은 다음의 목적을 위하여 개인정보를 처리하고 있으며, 
              다음의 목적 이외의 용도로는 이용하지 않습니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>회원가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증</li>
              <li>AI 캐릭터와의 채팅 서비스 제공 및 개선</li>
              <li>개인화된 AI 캐릭터 및 페르소나 생성 서비스</li>
              <li>하트 충전 및 결제 서비스 제공</li>
              <li>고객상담, 불만처리, 공지사항 전달</li>
              <li>서비스 이용기록과 접속빈도 분석, 서비스 이용에 대한 통계</li>
              <li>부정이용 방지 및 비인가 사용 방지</li>
            </ul>
          </div>
        </section>

        {/* 제2조 개인정보의 처리 및 보유기간 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">제2조 (개인정보의 처리 및 보유기간)</h3>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">회원 정보</h4>
              <p className="text-gray-700 text-sm">
                <strong>처리목적:</strong> 회원제 서비스 이용<br/>
                <strong>보유기간:</strong> 회원 탈퇴 후 즉시 삭제 (단, 관계법령에 따라 보존 필요시 해당 기간까지)
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">채팅 기록</h4>
              <p className="text-gray-700 text-sm">
                <strong>처리목적:</strong> 서비스 제공 및 개선<br/>
                <strong>보유기간:</strong> 3년 (사용자 동의 하에, 삭제 요청시 즉시 삭제)
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">결제 정보</h4>
              <p className="text-gray-700 text-sm">
                <strong>처리목적:</strong> 하트 충전 서비스 제공<br/>
                <strong>보유기간:</strong> 전자상거래법에 따라 5년
              </p>
            </div>
          </div>
        </section>

        {/* 제3조 처리하는 개인정보 항목 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">제3조 (처리하는 개인정보 항목)</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">필수항목</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                <li>Google 계정 정보 (이메일, 이름, 프로필 사진)</li>
                <li>서비스 이용 기록, 접속 로그, 접속 IP 정보</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">선택항목</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                <li>사용자가 생성한 AI 캐릭터 정보</li>
                <li>사용자가 생성한 페르소나 정보</li>
                <li>AI 캐릭터와의 채팅 내역</li>
                <li>결제 정보 (결제 승인번호, 결제일시)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 제4조 개인정보의 제3자 제공 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">제4조 (개인정보의 제3자 제공)</h3>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-blue-800 font-medium mb-2">🔒 개인정보 보호 원칙</p>
            <p className="text-blue-700 text-sm">
              밍글링챗은 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.<br/>
              다만, 아래의 경우에는 예외로 합니다:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-blue-700 text-sm">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
            </ul>
          </div>
        </section>

        {/* 제5조 개인정보처리의 위탁 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">제5조 (개인정보처리의 위탁)</h3>
          <div className="space-y-3">
            <p className="text-gray-700">밍글링챗은 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</p>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">위탁업체 현황</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li><strong>Google LLC:</strong> 로그인 인증 서비스</li>
                <li><strong>Amazon Web Services:</strong> 클라우드 인프라 및 데이터 저장</li>
                <li><strong>KG이니시스:</strong> 전자결제 서비스</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 제6조 이용자의 권리 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">제6조 (이용자의 권리)</h3>
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">✅ 귀하의 권리</h4>
            <ul className="list-disc list-inside space-y-1 text-green-700 text-sm">
              <li>개인정보 열람권</li>
              <li>오류 등이 있을 경우 정정·삭제권</li>
              <li>처리정지권</li>
              <li>동의철회권</li>
            </ul>
            <p className="text-green-700 text-sm mt-3">
              <strong>권리 행사 방법:</strong> 설정 메뉴 또는 고객센터를 통해 요청하실 수 있습니다.
            </p>
          </div>
        </section>

        {/* 제7조 개인정보의 안전성 확보조치 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">제7조 (개인정보의 안전성 확보조치)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">🔐 기술적 조치</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• 개인정보 암호화</li>
                <li>• 해킹 등에 대비한 기술적 대책</li>
                <li>• 보안프로그램 설치 및 갱신</li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">📋 관리적 조치</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• 개인정보 처리 직원의 최소화</li>
                <li>• 직원에 대한 교육</li>
                <li>• 개인정보 처리방침 수립·시행</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 제8조 개인정보 보호책임자 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">제8조 (개인정보 보호책임자)</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">📞 개인정보 보호책임자 연락처</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>이메일:</strong> privacy@minglingchat.com</p>
              <p><strong>처리부서:</strong> 밍글링챗 개발팀</p>
              <p className="text-xs text-gray-500 mt-2">
                개인정보의 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
              </p>
            </div>
          </div>
        </section>

        {/* 제9조 개인정보 처리방침 변경 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">제9조 (개인정보 처리방침 변경)</h3>
          <div className="border-l-4 border-pink-500 pl-4">
            <p className="text-gray-700 text-sm">
              이 개인정보 처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 
              변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
            </p>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6 text-center">
          <div className="text-sm text-gray-500">
            <p>밍글링챗 개인정보 처리방침</p>
            <p>최종 업데이트: {new Date().toLocaleDateString('ko-KR')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 