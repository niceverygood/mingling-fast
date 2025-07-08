# 🚨 긴급 캐시 문제 해결 방법

## 만약 브라우저에서 여전히 1.0.7이 응답된다면

### 1. 즉시 Cloudflare 완전 캐시 삭제
1. Cloudflare 대시보드 → minglingchat.com
2. **Caching** → **Purge Cache**
3. **Purge Everything** 선택
4. 확인 후 **Purge** 클릭

### 2. 브라우저 강제 새로고침
- **Chrome/Edge**: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
- **Firefox**: Ctrl+F5 (Windows) / Cmd+Shift+R (Mac)
- **Safari**: Cmd+Option+R

### 3. 개발자 도구 캐시 비활성화
1. F12 → Network 탭
2. **Disable cache** 체크
3. 새로고침

### 4. 시크릿 모드 테스트
- 새 시크릿/프라이빗 브라우저 창에서 테스트
- `https://api.minglingchat.com/api/health`

### 5. 만약 여전히 문제가 있다면
```bash
# EC2에서 강제 버전 업데이트
cd /home/ec2-user/mingling_new/backend
sed -i 's/"version": "1.0.0"/"version": "1.1.1"/' package.json
pm2 restart mingling-backend
```

### 6. 최종 응급 조치 - DNS 직접 변경
Cloudflare에서 프록시를 잠시 비활성화:
1. DNS → api 레코드 → 🟠 **클릭하여 회색**으로 변경
2. 5분 대기 후 다시 🟠 활성화

### 7. 확인 방법
```bash
curl -s "https://api.minglingchat.com/api/health" | grep version
```

**예상 응답**: `"version":"1.1.0"` 또는 `"version":"1.1.1"`

---

## 🎯 성공 확인 체크리스트
- [ ] 브라우저에서 api.minglingchat.com/api/health 접근 시 1.1.0 응답
- [ ] 개발자 도구에서 Network 탭 확인
- [ ] 시크릿 모드에서도 동일한 응답
- [ ] 결제 API 정상 응답 확인
- [ ] 프론트엔드 www.minglingchat.com에서 API 호출 성공

**모든 체크리스트 완료 시 → 완전 해결! 🎉** 