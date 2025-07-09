import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const TermsOfService = () => {
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
          <h1 className="text-xl font-bold text-black">서비스 이용약관</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-8">
        {/* 기본 정보 */}
        <div className="bg-pink-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-pink-800 mb-2">💕 밍글링챗 서비스 이용약관</h2>
          <p className="text-sm text-pink-700">
            <strong>시행일자:</strong> 2024년 1월 1일<br/>
            <strong>최종 수정일:</strong> {new Date().toLocaleDateString('ko-KR')}
          </p>
        </div>

        {/* 제1조 목적 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">제1조 (목적)</h3>
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-700 mb-3">
              이 약관은 밍글링챗("https://www.minglingchat.com" 이하 "회사")이 제공하는 AI 캐릭터 채팅 서비스(이하 "서비스")의 
              이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </div>
        </section>

        {/* 제2조 정의 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">제2조 (정의)</h3>
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">주요 용어</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li><strong>1. "서비스":</strong> 회사가 제공하는 AI 캐릭터와의 채팅 서비스 일체</li>
                <li><strong>2. "이용자":</strong> 회사의 약관에 동의하고 서비스를 이용하는 자</li>
                <li><strong>3. "AI 캐릭터":</strong> 인공지능 기술을 활용한 대화형 캐릭터</li>
                <li><strong>4. "페르소나":</strong> 이용자가 생성하는 자신만의 캐릭터 정보</li>
                <li><strong>5. "하트":</strong> 서비스 내에서 사용되는 가상화폐</li>
                <li><strong>6. "콘텐츠":</strong> 서비스에서 제공하거나 이용자가 생성하는 모든 정보</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 제3조 약관의 효력 및 변경 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">제3조 (약관의 효력 및 변경)</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-gray-700 text-sm">
                <strong>약관의 효력:</strong> 이 약관은 서비스를 이용하고자 하는 모든 이용자에게 그 효력이 발생합니다.
              </p>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4">
              <p className="text-gray-700 text-sm">
                <strong>약관의 변경:</strong> 회사는 필요한 경우 이 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지 후 
                7일이 경과한 날부터 효력이 발생합니다.
              </p>
            </div>
          </div>
        </section>

        {/* 제4조 서비스의 제공 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">제4조 (서비스의 제공)</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">제공 서비스</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                <li>AI 캐릭터와의 실시간 채팅 서비스</li>
                <li>개인화된 AI 캐릭터 생성 및 관리</li>
                <li>이용자 페르소나 생성 및 관리</li>
                <li>하트 충전 및 결제 서비스</li>
                <li>관계 발전 및 호감도 시스템</li>
                <li>기타 회사가 추가로 개발하는 서비스</li>
              </ul>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">⚠️ 서비스 제공 제한</h4>
              <p className="text-yellow-700 text-sm">
                회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신두절 등의 사유가 발생한 경우에는 
                서비스의 제공을 일시적으로 중단할 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        {/* 제5조 이용자의 의무 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">제5조 (이용자의 의무)</h3>
          <div className="space-y-4">
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">🚫 금지사항</h4>
              <ul className="list-disc list-inside space-y-1 text-red-700 text-sm">
                <li>타인의 정보를 도용하거나 허위 정보를 입력하는 행위</li>
                <li>서비스의 안정적 운영을 방해하는 행위</li>
                <li>다른 이용자의 서비스 이용을 방해하는 행위</li>
                <li>공공질서 및 미풍양속에 위반되는 내용의 정보 등을 타인에게 유포하는 행위</li>
                <li>회사의 지적재산권을 침해하는 행위</li>
                <li>해킹, 악성프로그램 배포 등 서비스를 악용하는 행위</li>
                <li>미성년자에게 유해한 내용을 전송하는 행위</li>
              </ul>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">✅ 준수사항</h4>
              <ul className="list-disc list-inside space-y-1 text-green-700 text-sm">
                <li>서비스 이용 시 관련 법령과 이 약관을 준수할 것</li>
                <li>다른 이용자들과 상호 존중하는 태도로 서비스를 이용할 것</li>
                <li>개인정보 보호 및 보안에 유의할 것</li>
                <li>서비스 내 가이드라인을 준수할 것</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 제6조 결제 및 환불 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">제6조 (결제 및 환불)</h3>
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">💳 결제 서비스</h4>
              <ul className="list-disc list-inside space-y-1 text-blue-700 text-sm">
                <li>하트 충전을 위한 결제 서비스를 제공합니다</li>
                <li>결제는 신용카드, 간편결제 등 다양한 방법을 지원합니다</li>
                <li>결제 완료 후 하트는 즉시 지급됩니다</li>
                <li>미성년자의 결제 시 법정대리인의 동의가 필요합니다</li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">🔄 환불 정책</h4>
              <p className="text-gray-700 text-sm mb-2">
                <strong>환불 가능 사유:</strong> 결제 오류, 시스템 장애, 서비스 중단 등
              </p>
              <p className="text-gray-700 text-sm mb-2">
                <strong>환불 기준:</strong> 전자상거래 등에서의 소비자보호에 관한 법률에 따름
              </p>
              <p className="text-gray-700 text-sm">
                <strong>환불 신청:</strong> 고객센터 또는 설정 메뉴를 통해 신청 가능
              </p>
            </div>
          </div>
        </section>

        {/* 제7조 지적재산권 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">제7조 (지적재산권)</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-purple-500 pl-4">
              <p className="text-gray-700 text-sm mb-2">
                <strong>회사의 지적재산권:</strong> 서비스에 관한 저작권 및 지적재산권은 회사에 귀속됩니다.
              </p>
              <p className="text-gray-700 text-sm">
                <strong>이용자의 콘텐츠:</strong> 이용자가 생성한 캐릭터, 페르소나, 채팅 내용 등에 대한 권리는 이용자에게 있으나, 
                서비스 제공을 위해 필요한 범위 내에서 회사가 이용할 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        {/* 제8조 개인정보 보호 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">제8조 (개인정보 보호)</h3>
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">🔒 개인정보 보호</h4>
            <p className="text-green-700 text-sm">
              회사는 관련 법령이 정하는 바에 따라 이용자의 개인정보를 보호하기 위해 노력하며, 
              개인정보의 보호 및 사용에 대해서는 관련 법령 및 회사의 개인정보 처리방침이 적용됩니다.
            </p>
          </div>
        </section>

        {/* 제9조 책임제한 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">제9조 (책임제한)</h3>
          <div className="space-y-4">
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">⚠️ 회사의 책임제한</h4>
              <ul className="list-disc list-inside space-y-1 text-yellow-700 text-sm">
                <li>천재지변, 전쟁, 기타 불가항력적 사유로 인한 서비스 중단</li>
                <li>이용자의 귀책사유로 인한 서비스 이용 장애</li>
                <li>이용자가 서비스를 이용하여 얻은 정보로 인한 손해</li>
                <li>이용자 간 또는 이용자와 제3자 간의 상호작용으로 인한 손해</li>
                <li>무료로 제공되는 서비스의 이용과 관련된 손해</li>
              </ul>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">🛡️ 이용자 책임</h4>
              <p className="text-blue-700 text-sm">
                이용자는 본 약관에 따라 서비스를 이용해야 하며, 약관 위반으로 인한 모든 책임은 이용자에게 있습니다.
              </p>
            </div>
          </div>
        </section>

        {/* 제10조 분쟁해결 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">제10조 (분쟁해결)</h3>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">🏛️ 준거법 및 관할법원</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li><strong>준거법:</strong> 대한민국 법률</li>
                <li><strong>관할법원:</strong> 서울중앙지방법원</li>
                <li><strong>분쟁해결:</strong> 회사와 이용자 간 발생한 분쟁은 상호 협의를 통해 해결하되, 
                    협의가 이루어지지 않을 경우 관할법원에서 해결합니다.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 제11조 기타 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">제11조 (기타)</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-pink-500 pl-4">
              <p className="text-gray-700 text-sm">
                <strong>연락처:</strong> 서비스 이용 관련 문의사항은 고객센터(support@minglingchat.com)로 연락바랍니다.
              </p>
            </div>
            <div className="border-l-4 border-gray-500 pl-4">
              <p className="text-gray-700 text-sm">
                이 약관에서 정하지 아니한 사항과 이 약관의 해석에 관하여는 관련 법령 또는 상관례에 따릅니다.
              </p>
            </div>
          </div>
        </section>

        {/* 부칙 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">부칙</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">📅 시행일</h4>
            <p className="text-gray-700 text-sm">
              이 약관은 2024년 1월 1일부터 시행됩니다.<br/>
              개정된 약관은 공지 후 7일이 경과한 날부터 효력이 발생합니다.
            </p>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6 text-center">
          <div className="text-sm text-gray-500">
            <p>밍글링챗 서비스 이용약관</p>
            <p>최종 업데이트: {new Date().toLocaleDateString('ko-KR')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService; 