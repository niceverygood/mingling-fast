const express = require('express');
const { exec } = require('child_process');
const crypto = require('crypto');

const app = express();
const PORT = 9000;
const SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret';

app.use(express.json());

// GitHub 웹훅 검증
function verifySignature(payload, signature) {
  const hmac = crypto.createHmac('sha256', SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// 배포 실행 함수
function deploy() {
  return new Promise((resolve, reject) => {
    const deployScript = `
      cd /home/ec2-user/mingling_new
      git pull origin main
      cd backend
      pm2 delete all || true
      sleep 2
      PORT=8001 pm2 start index.js --name "mingling-backend"
      pm2 status
    `;
    
    exec(deployScript, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Deployment failed:', error);
        reject(error);
      } else {
        console.log('✅ Deployment successful:', stdout);
        resolve(stdout);
      }
    });
  });
}

// 웹훅 엔드포인트
app.post('/webhook', async (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const payload = JSON.stringify(req.body);
  
  // 서명 검증
  if (!verifySignature(payload, signature)) {
    return res.status(401).send('Unauthorized');
  }
  
  // main 브랜치에 push된 경우에만 배포
  if (req.body.ref === 'refs/heads/main') {
    console.log('🚀 Deploying from main branch...');
    
    try {
      await deploy();
      res.status(200).send('Deployment successful');
    } catch (error) {
      res.status(500).send('Deployment failed');
    }
  } else {
    res.status(200).send('Not main branch, skipping deployment');
  }
});

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🎣 Webhook server running on port ${PORT}`);
  console.log(`🔗 Webhook URL: http://your-ec2-ip:${PORT}/webhook`);
}); 