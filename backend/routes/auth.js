const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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