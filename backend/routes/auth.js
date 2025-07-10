const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 네이티브 앱용 간단한 로그인
router.post('/native-login', async (req, res) => {
  try {
    const { deviceId, email, name } = req.body;
    
    console.log('📱 네이티브 앱 로그인 요청:', { deviceId, email, name });
    
    if (!deviceId) {
      return res.status(400).json({
        success: false,
        error: 'Device ID is required'
      });
    }

    // 디바이스 ID 기반으로 사용자 찾기 또는 생성
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: deviceId },
          { email: email }
        ]
      }
    });

    if (!user && email) {
      // 새 사용자 생성
      const username = name || email?.split('@')[0] || `user_${Date.now()}`;
      
      user = await prisma.user.create({
        data: {
          id: deviceId,
          email: email || `${deviceId}@app.mingling`,
          username: username,
          hearts: 150 // 기본 하트
        }
      });
      
      console.log('✅ 새 네이티브 사용자 생성:', user);
    } else if (!user) {
      // 이메일 없이 디바이스 ID만 있는 경우
      user = await prisma.user.create({
        data: {
          id: deviceId,
          email: `${deviceId}@app.mingling`,
          username: `guest_${Date.now()}`,
          hearts: 150
        }
      });
      
      console.log('✅ 게스트 사용자 생성:', user);
    }

    // 간단한 토큰 생성 (실제로는 JWT 사용 권장)
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        hearts: user.hearts,
        createdAt: user.createdAt
      },
      token: token
    });

  } catch (error) {
    console.error('❌ 네이티브 로그인 실패:', error);
    res.status(500).json({
      success: false,
      error: '로그인 처리 중 오류가 발생했습니다.'
    });
  }
});

// 토큰 검증
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    // 간단한 토큰 디코딩
    const decoded = Buffer.from(token, 'base64').toString();
    const [userId] = decoded.split(':');

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // 사용자 존재 확인
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        hearts: user.hearts
      }
    });

  } catch (error) {
    console.error('❌ 토큰 검증 실패:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

// 로그아웃
router.post('/logout', async (req, res) => {
  try {
    // 실제 구현에서는 세션 무효화나 토큰 블랙리스트 처리
    // 현재는 간단히 성공 응답만 반환
    res.status(200).json({ 
      success: true, 
      message: '로그아웃되었습니다.' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      error: '로그아웃에 실패했습니다.' 
    });
  }
});

// 회원탈퇴
router.delete('/withdraw', async (req, res) => {
  try {
    const userId = 1; // 실제로는 인증된 사용자 ID

    // 사용자와 관련된 모든 데이터 삭제
    await prisma.$transaction(async (prisma) => {
      // 1. 사용자가 만든 캐릭터들의 메시지 삭제
      await prisma.message.deleteMany({
        where: {
          chat: {
            character: {
              userId: userId
            }
          }
        }
      });

      // 2. 사용자가 만든 캐릭터들의 채팅 삭제
      await prisma.chat.deleteMany({
        where: {
          character: {
            userId: userId
          }
        }
      });

      // 3. 사용자가 참여한 메시지 삭제 (다른 캐릭터와의 대화)
      await prisma.message.deleteMany({
        where: {
          chat: {
            userId: userId
          }
        }
      });

      // 4. 사용자가 참여한 채팅 삭제
      await prisma.chat.deleteMany({
        where: {
          userId: userId
        }
      });

      // 5. 하트 거래 내역 삭제
      await prisma.heartTransaction.deleteMany({
        where: {
          userId: userId
        }
      });

      // 6. 사용자가 만든 페르소나 삭제
      await prisma.persona.deleteMany({
        where: {
          userId: userId
        }
      });

      // 7. 사용자가 만든 캐릭터 삭제
      await prisma.character.deleteMany({
        where: {
          userId: userId
        }
      });

      // 8. 사용자 삭제
      await prisma.user.delete({
        where: {
          id: userId
        }
      });
    });

    res.status(200).json({ 
      success: true, 
      message: '회원탈퇴가 완료되었습니다.' 
    });
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({ 
      success: false, 
      error: '회원탈퇴에 실패했습니다.' 
    });
  }
});

module.exports = router; 