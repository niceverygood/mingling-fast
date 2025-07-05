import React, { useState } from 'react';
import ImageUpload from '../components/ImageUpload';

const TestUpload = () => {
  const [uploadResults, setUploadResults] = useState([]);

  const handleUploadSuccess = (uploadData) => {
    console.log('Upload success:', uploadData);
    setUploadResults(prev => [...prev, {
      type: 'success',
      message: `이미지 업로드 성공: ${uploadData.url}`,
      data: uploadData,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const handleUploadError = (error) => {
    console.error('Upload error:', error);
    setUploadResults(prev => [...prev, {
      type: 'error',
      message: `업로드 실패: ${error}`,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const clearResults = () => {
    setUploadResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">S3 이미지 업로드 테스트</h1>
        <p className="text-gray-600">AWS S3 연동이 정상적으로 작동하는지 테스트해보세요.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 업로드 테스트 영역 */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">캐릭터 아바타 업로드</h2>
            <ImageUpload
              type="character"
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              maxSize={2}
              placeholder="캐릭터 이미지를 업로드하세요 (최대 2MB)"
            />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">페르소나 아바타 업로드</h2>
            <ImageUpload
              type="persona"
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              maxSize={2}
              placeholder="페르소나 이미지를 업로드하세요 (최대 2MB)"
            />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">사용자 프로필 업로드</h2>
            <ImageUpload
              type="user"
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              maxSize={2}
              placeholder="프로필 이미지를 업로드하세요 (최대 2MB)"
            />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">일반 이미지 업로드</h2>
            <ImageUpload
              type="image"
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              maxSize={5}
              placeholder="일반 이미지를 업로드하세요 (최대 5MB)"
            />
          </div>
        </div>

        {/* 결과 표시 영역 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">업로드 결과</h2>
            <button
              onClick={clearResults}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
            >
              결과 지우기
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            {uploadResults.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                이미지를 업로드하면 결과가 여기에 표시됩니다.
              </p>
            ) : (
              <div className="space-y-3">
                {uploadResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-l-4 ${
                      result.type === 'success'
                        ? 'bg-green-50 border-green-400'
                        : 'bg-red-50 border-red-400'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          result.type === 'success' ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {result.message}
                        </p>
                        {result.data && (
                          <div className="mt-2 text-xs text-gray-600">
                            <p>파일 크기: {(result.data.size / 1024).toFixed(1)} KB</p>
                            <p>파일 타입: {result.data.mimetype}</p>
                            <p>S3 키: {result.data.key}</p>
                            {result.data.url && (
                              <a
                                href={result.data.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                이미지 보기 →
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 ml-2">
                        {result.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* S3 연동 상태 체크 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">S3 연동 체크리스트</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>✅ IAM 사용자 생성 및 S3 권한 부여</li>
              <li>✅ 버킷 이름: mingling-new</li>
              <li>✅ 리전: ap-northeast-2 (서울)</li>
              <li>✅ CORS 설정 완료</li>
              <li>✅ 퍼블릭 읽기 권한 설정</li>
              <li>⚠️ 환경 변수 설정 필요 (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 사용 안내 */}
      <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">사용 안내</h3>
        <div className="text-sm text-yellow-700 space-y-2">
          <p>1. <strong>IAM 설정:</strong> AWS 콘솔에서 IAM 사용자를 생성하고 S3 권한을 부여하세요.</p>
          <p>2. <strong>환경 변수:</strong> backend/.env 파일에 AWS 자격 증명을 설정하세요.</p>
          <p>3. <strong>버킷 정책:</strong> S3 버킷에 퍼블릭 읽기 권한과 CORS 설정을 추가하세요.</p>
          <p>4. <strong>테스트:</strong> 위의 업로드 영역에서 이미지를 드래그하거나 클릭해서 업로드하세요.</p>
        </div>
      </div>
    </div>
  );
};

export default TestUpload; 