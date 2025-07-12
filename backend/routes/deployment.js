/* eslint-env node */
const express = require('express');
const router = express.Router();
const { execSync } = require('child_process');
const crypto = require('crypto');

// GitHub Webhook Secret (환경변수에서 가져오기)
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'mingling-deploy-secret-2025';

/**
 * GitHub Webhook 서명 검증
 */
const verifySignature = (req, res, next) => {
  const signature = req.headers['x-hub-signature-256'];
  const payload = JSON.stringify(req.body);
  
  if (!signature) {
    return res.status(401).json({ error: 'No signature provided' });
  }
  
  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex')}`;
  
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  next();
};

/**
 * 자동 배포 실행 함수
 */
const executeDeployment = async () => {
  const deploymentLog = [];
  
  try {
    deploymentLog.push('🔄 Starting automatic deployment...');
    deploymentLog.push(`📅 Deployment time: ${new Date().toISOString()}`);
    
    // 1. Git pull
    deploymentLog.push('📥 Pulling latest code...');
    execSync('git pull origin main', { 
      cwd: '/home/ec2-user/mingling_new',
      stdio: 'pipe'
    });
    deploymentLog.push('✅ Git pull completed');
    
    // 2. Install dependencies
    deploymentLog.push('📦 Installing dependencies...');
    execSync('npm install --production', { 
      cwd: '/home/ec2-user/mingling_new/backend',
      stdio: 'pipe'
    });
    deploymentLog.push('✅ Dependencies installed');
    
    // 3. Stop existing server
    deploymentLog.push('🛑 Stopping existing server...');
    try {
      execSync('pkill -f \'node.*index.js\'', { stdio: 'pipe' });
      deploymentLog.push('✅ Existing server stopped');
    } catch {
      deploymentLog.push('ℹ️ No existing server to stop');
    }
    
    // Wait a moment
    await new Promise(resolve => global.setTimeout(resolve, 3000));
    
    // 4. Start new server
    deploymentLog.push('🚀 Starting new server...');
    execSync('nohup node index.js > /home/ec2-user/backend.log 2>&1 &', { 
      cwd: '/home/ec2-user/mingling_new/backend',
      stdio: 'pipe',
      detached: true
    });
    deploymentLog.push('✅ New server started');
    
    // Wait for server to start
    await new Promise(resolve => global.setTimeout(resolve, 5000));
    
    // 5. Health check
    deploymentLog.push('🔍 Running health check...');
    try {
      execSync('curl -s http://localhost:8001/api/health', { stdio: 'pipe' });
      deploymentLog.push('✅ Health check passed');
    } catch {
      deploymentLog.push('⚠️ Health check failed, but server might still be starting');
    }
    
    deploymentLog.push('🎉 Deployment completed successfully!');
    
    return {
      success: true,
      message: 'Deployment completed successfully',
      log: deploymentLog,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    deploymentLog.push(`❌ Deployment failed: ${error.message}`);
    
    return {
      success: false,
      message: 'Deployment failed',
      error: error.message,
      log: deploymentLog,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * GitHub Webhook 엔드포인트
 */
router.post('/webhook', verifySignature, async (req, res) => {
  try {
    const { ref, repository, commits } = req.body;
    
    console.log('📨 GitHub Webhook received:', {
      ref,
      repository: repository?.name,
      commits: commits?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    // main 브랜치에 push된 경우에만 배포 실행
    if (ref === 'refs/heads/main') {
      console.log('🚀 Main branch updated, starting deployment...');
      
      // 비동기로 배포 실행 (응답은 즉시 반환)
      global.setTimeout(async () => {
        const result = await executeDeployment();
        console.log('📋 Deployment result:', result);
      }, 1000);
      
      res.json({
        success: true,
        message: 'Deployment triggered successfully',
        ref,
        repository: repository?.name,
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        success: true,
        message: 'Webhook received but no deployment needed',
        ref,
        reason: 'Not main branch'
      });
    }
    
  } catch (error) {
    console.error('❌ Webhook processing failed:', error);
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed',
      details: error.message
    });
  }
});

/**
 * 수동 배포 트리거 엔드포인트
 */
router.post('/deploy', async (req, res) => {
  try {
    const { secret } = req.body;
    
    // 간단한 인증
    if (secret !== WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Invalid secret' });
    }
    
    console.log('🔧 Manual deployment triggered');
    
    const result = await executeDeployment();
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Manual deployment failed:', error);
    res.status(500).json({
      success: false,
      error: 'Deployment failed',
      details: error.message
    });
  }
});

/**
 * 배포 상태 확인 엔드포인트
 */
router.get('/status', (req, res) => {
  try {
    // 서버 프로세스 확인
    const processes = execSync("ps aux | grep 'node.*index.js' | grep -v grep", { 
      stdio: 'pipe',
      encoding: 'utf8'
    }).trim();
    
    // 마지막 배포 로그 확인 (최근 100줄)
    let recentLogs = '';
    try {
      recentLogs = execSync('tail -100 /home/ec2-user/backend.log', { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
    } catch (error) {
      recentLogs = 'No logs available';
    }
    
    res.json({
      success: true,
      status: processes ? 'running' : 'stopped',
      processes: processes.split('\n').filter(line => line.trim()),
      timestamp: new Date().toISOString(),
      recentLogs: recentLogs.split('\n').slice(-20) // 최근 20줄만
    });
    
  } catch (error) {
    res.json({
      success: false,
      status: 'unknown',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 