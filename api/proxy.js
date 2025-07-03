export default async function handler(req, res) {
  const { method, url, headers, body } = req;
  
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-ID, X-User-Email');
  
  // OPTIONS 요청 처리 (CORS 프리플라이트)
  if (method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    // EC2 백엔드로 프록시
    const targetUrl = `http://13.35.49.211:8081${url.replace('/api/proxy', '')}`;
    
    const response = await fetch(targetUrl, {
      method,
      headers: {
        'Content-Type': headers['content-type'] || 'application/json',
        'X-User-ID': headers['x-user-id'] || '',
        'X-User-Email': headers['x-user-email'] || '',
      },
      body: method !== 'GET' && method !== 'HEAD' ? JSON.stringify(body) : undefined,
    });
    
    const data = await response.text();
    
    res.status(response.status);
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    res.send(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy failed', details: error.message });
  }
} 