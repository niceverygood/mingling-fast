export default async function handler(req, res) {
  const { slug } = req.query;
  const { method, headers, body } = req;
  
  // CORS 헤더 설정
  const origin = headers.origin || headers.referer;
  const allowedOrigins = [
    'https://minglingchat.com',
    'https://www.minglingchat.com',
    'https://mingling-new.vercel.app'
  ];
  
  if (allowedOrigins.includes(origin) || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-ID, X-User-Email');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // OPTIONS 요청 처리 (CORS 프리플라이트)
  if (method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    // EC2 백엔드로 프록시
    const path = Array.isArray(slug) ? slug.join('/') : slug;
    const targetUrl = `http://3.35.49.121:8001/api/${path}`;
    
    console.log('Proxying to:', targetUrl);
    
    const response = await fetch(targetUrl, {
      method,
      headers: {
        'Content-Type': headers['content-type'] || 'application/json',
        'X-User-ID': headers['x-user-id'] || '',
        'X-User-Email': headers['x-user-email'] || '',
      },
      body: method !== 'GET' && method !== 'HEAD' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
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