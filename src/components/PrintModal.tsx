import React, { useState, useEffect } from 'react';
import { X, Printer, Download, ExternalLink, CheckCircle2, Heart, Award, Sparkles, HelpCircle, FileText, Share2 } from 'lucide-react';
import { CHO, syl, MISSIONS, THEMES } from '../data/hangulData';
import { DailyMomDiary } from '../types';
import { playSfx } from '../utils/sound';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  childName: string;
  childAge: string;
  diaries: Record<number, DailyMomDiary>;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  childName,
  childAge,
  diaries,
}) => {
  const [printType, setPrintType] = useState<'chart' | 'diary' | 'certificate' | 'sticker_sheet'>('chart');
  const [stickerThemeIdx, setStickerThemeIdx] = useState(0);
  const [showPrintGuideModal, setShowPrintGuideModal] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const writtenDays = Object.keys(diaries).map(Number).sort((a, b) => a - b);
  const selectedTheme = THEMES[stickerThemeIdx % THEMES.length];

  // Consonant list with sample words for the poster
  const CONSONANTS_INFO = [
    { char: 'ㄱ', name: '기역', word: '기린', emoji: '🦒' },
    { char: 'ㄴ', name: '니은', word: '나비', emoji: '🦋' },
    { char: 'ㄷ', name: '디귿', word: '다람쥐', emoji: '🐿️' },
    { char: 'ㄹ', name: '리을', word: '라디오', emoji: '📻' },
    { char: 'ㅁ', name: '미음', word: '모자', emoji: '🧢' },
    { char: 'ㅂ', name: '비읍', word: '바나나', emoji: '🍌' },
    { char: 'ㅅ', name: '시옷', word: '사자', emoji: '🦁' },
    { char: 'ㅇ', name: '이응', word: '오리', emoji: '🦆' },
    { char: 'ㅈ', name: '지읒', word: '자동차', emoji: '🚗' },
    { char: 'ㅊ', name: '치읓', word: '치즈', emoji: '🧀' },
    { char: 'ㅋ', name: '키읗', word: '코끼리', emoji: '🐘' },
    { char: 'ㅌ', name: '티읕', word: '토끼', emoji: '🐰' },
    { char: 'ㅍ', name: '피읖', word: '포도', emoji: '🍇' },
    { char: 'ㅎ', name: '히읗', word: '하마', emoji: '🦛' },
  ];

  const VOWELS_INFO = [
    { char: 'ㅏ', sound: '아', word: '아이', emoji: '👶' },
    { char: 'ㅑ', sound: '야', word: '야구', emoji: '⚾' },
    { char: 'ㅓ', sound: '어', word: '어머니', emoji: '👩' },
    { char: 'ㅕ', sound: '여', word: '여우', emoji: '🦊' },
    { char: 'ㅗ', sound: '오', word: '오이', emoji: '🥒' },
    { char: 'ㅛ', sound: '요', word: '요리', emoji: '🍳' },
    { char: 'ㅜ', sound: '우', word: '우유', emoji: '🥛' },
    { char: 'ㅠ', sound: '유', word: '유리', emoji: '🪟' },
    { char: 'ㅡ', sound: '으', word: '으뜸', emoji: '👍' },
    { char: 'ㅣ', sound: '이', word: '이야기', emoji: '📖' },
  ];

  // Helper to generate full standalone HTML for printing & PDF saving
  const generateStandaloneHtml = (type: typeof printType): string => {
    const name = childName || '우리 아이';
    const age = childAge || '5세';

    let contentHtml = '';
    let docTitle = '';

    if (type === 'chart') {
      docTitle = `${name}_한글자음모음탐험판_A4포스터`;
      contentHtml = `
        <div class="header-box">
          <div class="badge">벽 & 냉장고 부착용 매일 한글 포스터</div>
          <h1 class="main-title">🔤 ${name}의 한글 자음·모음 탐험판</h1>
          <p class="subtitle">손가락으로 콕콕 짚으며 매일 소리내어 읽어요! ✨</p>
        </div>

        <div class="card-box">
          <div class="box-title" style="color: #c9502f;">
            <span>① 기본 자음 14자 (기역부터 히읗까지)</span>
            <span class="desc">입과 목구멍의 모양을 본떠 만들었어요</span>
          </div>
          <div class="grid-7">
            ${CONSONANTS_INFO.map(
              (c) => `
              <div class="item-tile">
                <div class="char">${c.char}</div>
                <div class="char-name" style="color: #c9502f;">${c.name}</div>
                <div class="char-sample">${c.emoji} ${c.word}</div>
              </div>
            `
            ).join('')}
          </div>
        </div>

        <div class="card-box" style="margin-top: 14px;">
          <div class="box-title" style="color: #2b6cb0;">
            <span>② 기본 모음 10자 (하늘 · 땅 · 사람의 조화)</span>
            <span class="desc">입을 크게 벌리고 예쁜 소리를 내요</span>
          </div>
          <div class="grid-10">
            ${VOWELS_INFO.map(
              (v) => `
              <div class="item-tile">
                <div class="char">${v.char}</div>
                <div class="char-name" style="color: #2b6cb0;">[${v.sound}]</div>
                <div class="char-sample">${v.emoji} ${v.word}</div>
              </div>
            `
            ).join('')}
          </div>
        </div>

        <div class="card-box" style="margin-top: 14px; background: #faf8f5;">
          <div class="box-title" style="color: #1b1917;">
            <span>③ 소리 합체표 (자음 + 모음 = 글자!)</span>
            <span class="desc">예: ㄱ + ㅏ = '가'</span>
          </div>
          <table class="gagya-table">
            <thead>
              <tr>
                <th style="background:#f0ebe1;">자\\모</th>
                ${['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ']
                  .map((m) => `<th style="color:#2b6cb0;">${m}</th>`)
                  .join('')}
              </tr>
            </thead>
            <tbody>
              ${['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅎ']
                .map((c) => {
                  const cIdx = CHO.indexOf(c);
                  return `
                  <tr>
                    <td style="font-weight:bold; color:#c9502f; background:#fbf8f2;">${c}</td>
                    ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
                      .map((vIdx) => `<td>${syl(cIdx, vIdx)}</td>`)
                      .join('')}
                  </tr>
                `;
                })
                .join('')}
            </tbody>
          </table>
        </div>

        <div class="footer-sign">
          <span>"엄마와 함께 짚어보며 하루 한 글자씩 알아가요!"</span>
          <span style="font-weight:bold;">칭찬 도장 찍는 곳: [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]</span>
        </div>
      `;
    } else if (type === 'diary') {
      docTitle = `${name}_엄마의30일한글일기장_A4`;
      contentHtml = `
        <div class="header-box">
          <div class="badge">세상에 단 하나뿐인 추억 선물</div>
          <h1 class="main-title">📖 ${name}와 함께한 엄마의 30일 한글 일기장</h1>
          <p class="subtitle">아이: ${name} (${age}) • 기록한 일기: 총 ${writtenDays.length}편</p>
        </div>

        ${
          writtenDays.length === 0
            ? `<div style="padding:40px; text-align:center; color:#888; border:2px dashed #ccc; border-radius:16px;">
                아직 기록된 날짜별 일기가 없습니다. 30일 체크 화면에서 일기를 작성해보세요!
              </div>`
            : `
          <div class="diary-grid">
            ${writtenDays
              .map((dNum) => {
                const entry = diaries[dNum];
                const mission = MISSIONS[dNum - 1] || { t: '한글 놀이' };
                return `
                <div class="diary-card">
                  <div class="diary-card-header">
                    <div>
                      <span class="day-tag">D+${dNum}</span>
                      <span style="font-size:14px; margin-left:4px;">${entry.mood}</span>
                      <strong style="margin-left:6px; font-size:12px;">${mission.t}</strong>
                    </div>
                    <span style="font-size:11px; color:#8a8178;">${entry.date}</span>
                  </div>
                  <div class="diary-body">${entry.content}</div>
                  ${
                    entry.photoUrl
                      ? `<div style="text-align:center; margin-top:8px;"><img src="${entry.photoUrl}" style="max-height:90px; border-radius:8px; border:1px solid #ddd;" /></div>`
                      : ''
                  }
                </div>
              `;
              })
              .join('')}
          </div>
        `
        }

        <div class="footer-sign" style="margin-top:20px; text-align:center;">
          "매일 10분, 너와 함께 눈 맞추며 웃었던 소중한 시간들을 평생 간직할게." - 사랑하는 엄마가
        </div>
      `;
    } else if (type === 'certificate') {
      docTitle = `${name}_30일완주_공식상장_A4`;
      contentHtml = `
        <div class="cert-border">
          <div class="cert-corner corner-tl">⚜️</div>
          <div class="cert-corner corner-tr">⚜️</div>
          <div class="cert-corner corner-bl">⚜️</div>
          <div class="cert-corner corner-br">⚜️</div>

          <div style="text-align:center; margin-bottom:12px;">
            <div class="badge" style="background:#fef3c7; color:#b45309; border-color:#fde68a;">✨ 제 2026 - 30 일 완주 공식 인증서 ✨</div>
            <h1 style="font-family:'Jua',sans-serif; font-size:48px; margin:10px 0; letter-spacing:14px; color:#1b1917;">상&nbsp;&nbsp;장</h1>
            <div style="font-family:'Jua',sans-serif; font-size:18px; color:#c9502f; font-weight:bold;">🏆 슈퍼 한글 탐험 마스터 상 🏆</div>
          </div>

          <div style="text-align:center; font-size:26px; margin: 10px 0;">
            🐻 &nbsp; 🦁 &nbsp; 🐰 &nbsp; 🐱 &nbsp; 🦖
          </div>

          <div class="cert-recipient-box">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f0ebe1; padding-bottom:6px;">
              <span style="color:#8a8178; font-size:15px;">성&nbsp;&nbsp;&nbsp;&nbsp;명:</span>
              <span style="font-size:26px; color:#c9502f; font-family:'Jua',sans-serif; font-weight:bold;">${name}</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; padding-top:4px;">
              <span style="color:#8a8178; font-size:15px;">연&nbsp;&nbsp;&nbsp;&nbsp;령:</span>
              <span style="font-size:17px; font-family:'Jua',sans-serif; color:#1b1917;">${age} 어린이</span>
            </div>
          </div>

          <p class="cert-body">
            위 어린이는 엄마와 함께한 30일 동안<br />
            매일 포기하지 않고 씩씩하고 즐겁게 놀며<br />
            아름다운 한글의 소리와 글자 모양을 훌륭하게 깨쳤으므로<br />
            온 가족의 큰 사랑과 넘치는 자랑스러움을 담아<br />
            이 빛나는 상장을 수여합니다.
          </p>

          <div class="cert-bottom-row">
            <div style="text-align:left; font-size:13px; color:#8a8178; line-height:1.6;">
              <div>수여일: ${new Date().toLocaleDateString('ko-KR')}</div>
              <div>장소: 우리 집 따뜻한 공부 책상</div>
              <div style="color:#c9502f; font-weight:bold;">평생 칭찬 보증 ✨</div>
            </div>

            <div class="gold-seal">
              <span style="font-size:24px;">👑</span>
              <span style="font-size:11px; font-weight:bold;">최고예요!</span>
              <span style="font-size:9px; color:#92400e;">엄마의 사랑</span>
            </div>
          </div>

          <div style="margin-top:16px; padding-top:12px; border-top:1px solid #eedfc9; text-align:center; font-family:'Jua',sans-serif; font-size:20px; color:#1b1917;">
            수여인: 세상에서 가장 너를 사랑하는 <span style="color:#c9502f;">엄마 & 아빠</span> 💖
          </div>
        </div>
      `;
    } else if (type === 'sticker_sheet') {
      docTitle = `${name}_30일칭찬스티커판도안_A4`;
      contentHtml = `
        <div class="card-box" style="border: 3px solid #1b1917; text-align:center; padding: 20px;">
          <div class="badge">${selectedTheme.name} 🗺️</div>
          <h1 class="main-title" style="margin-top:6px;">${name}의 30일 칭찬 스티커 모험판</h1>
          <p class="subtitle">하루 10분 한글 미션을 완료하고 칭찬 스티커를 1칸씩 붙여요!</p>

          <div class="sticker-grid">
            ${Array.from({ length: 30 }, (_, idx) => `
              <div class="sticker-slot">
                <span style="font-size:14px; font-family:'Jua',sans-serif; color:#8a8178;">${idx + 1}</span>
                <span style="font-size:10px; color:#cbd5e1;">★</span>
              </div>
            `).join('')}
          </div>

          <div class="wish-coupon">
            <div style="display:flex; justify-content:space-between; font-family:'Jua',sans-serif; font-size:13px; color:#c9502f; margin-bottom:6px;">
              <span>✂️ [가위로 오려서 쓰는] 30일 완주 특별 소원권</span>
              <span>No. 2026-HAPPY</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:13px;">
              <span>약속 내용: _____________________________________________</span>
              <span style="font-size:12px; color:#8a8178;">엄마 서명: _______</span>
            </div>
          </div>

          <div class="footer-sign" style="margin-top:12px;">
            <span>30칸 완주 시 소원권을 오려서 아이에게 선물하세요!</span>
            <span>발행인: 사랑하는 엄마</span>
          </div>
        </div>
      `;
    }

    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${docTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&family=Jua&family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 16px;
      background: #ffffff;
      color: #1b1917;
      font-family: 'Noto Sans KR', sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header-box {
      border-bottom: 2px solid #1b1917;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 9999px;
      background: #fdf3e4;
      border: 1px solid #f3dfc6;
      font-size: 11px;
      font-weight: bold;
      color: #c9502f;
      font-family: 'Jua', sans-serif;
      margin-bottom: 4px;
    }
    .main-title {
      font-family: 'Jua', sans-serif;
      font-size: 26px;
      margin: 4px 0;
      color: #1b1917;
    }
    .subtitle {
      font-family: 'Gaegu', cursive;
      font-size: 13px;
      color: #8a8178;
      margin: 2px 0 0 0;
    }
    .card-box {
      border: 1px solid #1b1917;
      border-radius: 16px;
      padding: 12px;
      background: #fffdf9;
    }
    .box-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e4dccf;
      padding-bottom: 6px;
      margin-bottom: 8px;
      font-family: 'Jua', sans-serif;
      font-size: 14px;
    }
    .box-title .desc {
      font-family: 'Gaegu', cursive;
      font-size: 12px;
      color: #8a8178;
      font-weight: normal;
    }
    .grid-7 {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 6px;
    }
    .grid-10 {
      display: grid;
      grid-template-columns: repeat(10, 1fr);
      gap: 6px;
    }
    .item-tile {
      border: 1px solid #e4dccf;
      border-radius: 10px;
      padding: 6px 2px;
      text-align: center;
      background: #ffffff;
    }
    .item-tile .char {
      font-family: 'Jua', sans-serif;
      font-size: 26px;
      line-height: 1;
      margin-bottom: 3px;
    }
    .item-tile .char-name {
      font-family: 'Jua', sans-serif;
      font-size: 11px;
      font-weight: bold;
    }
    .item-tile .char-sample {
      font-family: 'Gaegu', cursive;
      font-size: 10px;
      color: #8a8178;
      margin-top: 2px;
    }
    .gagya-table {
      width: 100%;
      text-align: center;
      font-size: 12px;
      border-collapse: collapse;
      font-family: 'Jua', sans-serif;
    }
    .gagya-table th, .gagya-table td {
      border: 1px solid #e4dccf;
      padding: 4px;
    }
    .footer-sign {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 10px;
      border-top: 1px solid #1b1917;
      font-family: 'Gaegu', cursive;
      font-size: 13px;
      color: #8a8178;
      margin-top: 14px;
    }
    /* Certificate */
    .cert-border {
      position: relative;
      border: 8px double #d4972d;
      border-radius: 24px;
      padding: 30px;
      background: linear-gradient(to bottom, #fffefc, #fffdf7, #fffaf0);
      margin: 10px auto;
      max-width: 720px;
    }
    .cert-corner {
      position: absolute;
      font-size: 22px;
      color: #d4972d;
    }
    .corner-tl { top: 8px; left: 8px; }
    .corner-tr { top: 8px; right: 8px; }
    .corner-bl { bottom: 8px; left: 8px; }
    .corner-br { bottom: 8px; right: 8px; }
    .cert-recipient-box {
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid #eedfc9;
      border-radius: 16px;
      padding: 12px 20px;
      max-width: 420px;
      margin: 12px auto;
    }
    .cert-body {
      font-family: 'Gaegu', cursive;
      font-size: 18px;
      line-height: 1.8;
      text-align: center;
      margin: 16px 0;
      color: #1b1917;
    }
    .cert-bottom-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 440px;
      margin: 16px auto 0;
      font-family: 'Gaegu', cursive;
    }
    .gold-seal {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 3px solid #d4972d;
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      color: #b45309;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: 'Jua', sans-serif;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      transform: rotate(-6deg);
    }
    /* Diary grid */
    .diary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    .diary-card {
      border: 1px solid #1b1917;
      border-radius: 12px;
      padding: 10px;
      background: #faf8f5;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .diary-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e4dccf;
      padding-bottom: 4px;
      margin-bottom: 6px;
    }
    .day-tag {
      font-family: 'Jua', sans-serif;
      font-size: 13px;
      color: #c9502f;
      font-weight: bold;
    }
    .diary-body {
      font-family: 'Gaegu', cursive;
      font-size: 13px;
      color: #4a443e;
      white-space: pre-wrap;
      line-height: 1.5;
    }
    /* Sticker grid */
    .sticker-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
      max-width: 480px;
      margin: 16px auto;
    }
    .sticker-slot {
      aspect-ratio: 1;
      border: 2px dashed #1b1917;
      border-radius: 14px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #faf8f5;
    }
    .wish-coupon {
      border-top: 2px dashed #c9502f;
      margin-top: 16px;
      padding: 12px;
      background: #fff9f5;
      border-radius: 14px;
      text-align: left;
    }
    /* Screen toolbar (hidden when printing) */
    @media screen {
      .print-floating-bar {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #1b1917;
        color: white;
        padding: 10px 20px;
        border-radius: 9999px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        display: flex;
        gap: 12px;
        align-items: center;
        z-index: 10000;
        font-family: 'Jua', sans-serif;
      }
      .print-btn-primary {
        background: #c9502f;
        color: white;
        border: none;
        padding: 8px 18px;
        border-radius: 9999px;
        font-family: 'Jua', sans-serif;
        font-size: 14px;
        cursor: pointer;
      }
    }
    @media print {
      .print-floating-bar { display: none !important; }
    }
  </style>
</head>
<body>
  ${contentHtml}

  <div class="print-floating-bar">
    <span>💡 인쇄 창이 뜨면 대상에서 <b>'PDF로 저장'</b> 또는 프린터를 선택하세요!</span>
    <button class="print-btn-primary" onclick="window.print()">🖨️ 바로 인쇄하기</button>
    <button style="background:#555; color:white; border:none; padding:8px 14px; border-radius:9999px; cursor:pointer;" onclick="window.close()">닫기</button>
  </div>

  <script>
    // Auto-trigger print dialog after styles and fonts load
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.print();
        } catch(e) {
          console.warn('Auto print error', e);
        }
      }, 500);
    });
  </script>
</body>
</html>`;
  };

  // Re-generate blob URL whenever tab or child data changes
  useEffect(() => {
    if (!isOpen) return;
    const html = generateStandaloneHtml(printType);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [isOpen, printType, stickerThemeIdx, childName, childAge, diaries]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // 1. One-click Download HTML/PDF printable file
  const handleDownload = () => {
    playSfx('fan');
    const html = generateStandaloneHtml(printType);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const filename = `${childName || '우리아이'}_엄마표한글_${
      printType === 'chart'
        ? '자음모음판'
        : printType === 'diary'
        ? '일기장책'
        : printType === 'certificate'
        ? '완주상장'
        : '칭찬스티커판'
    }_A4.html`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    showToast('💾 A4 인쇄용 파일이 다운로드되었습니다! 파일을 열면 즉시 인쇄/PDF 저장이 가능합니다.');
  };

  // 2. Open standalone print page in new window/tab
  const handleOpenNewWindow = () => {
    playSfx('fan');
    if (blobUrl) {
      const win = window.open(blobUrl, '_blank');
      if (!win) {
        // Popup blocked: open the in-app guide modal with direct link
        setShowPrintGuideModal(true);
      } else {
        showToast('🌐 새 탭에서 인쇄 페이지를 열었습니다. 인쇄 대화상자가 자동으로 열립니다!');
      }
    }
  };

  // 3. Print button: attempt window.print() and also show the print guide modal
  const handlePrint = () => {
    playSfx('fan');
    setShowPrintGuideModal(true);

    // Also attempt window.print() safely
    try {
      window.print();
    } catch (e) {
      console.warn('iframe print prevented', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn print:p-0 print:bg-white print:static">
      <div className="bg-[#fbf8f2] border-2 border-[#e4dccf] rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col relative print:border-none print:shadow-none print:max-w-none print:max-h-none print:w-full">
        {/* Modal Top Bar (hidden on print) */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-white border-b border-[#e4dccf] flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#c9502f]" />
            <h2 className="font-jua text-base sm:text-lg text-[#1b1917]">
              종이로 출력하기 (A4 프린트 &amp; PDF 저장)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playSfx('tap');
                setShowPrintGuideModal(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#fef3c7] hover:bg-[#fde68a] text-[#b45309] font-jua text-xs flex items-center gap-1 transition-colors"
              title="인쇄 꿀팁 & PDF 저장 가이드"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              인쇄 안내
            </button>
            <button
              onClick={() => {
                playSfx('tap');
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-[#f6f1e7] hover:bg-[#ebd9c7] flex items-center justify-center text-[#8a8178] hover:text-[#1b1917] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Informational banner about iframe environment & guarantee */}
        <div className="bg-[#fff9f0] px-4 py-2 border-b border-[#eedfc9] flex items-center justify-between gap-2 text-[11px] sm:text-xs font-hand text-[#8a8178] print:hidden">
          <span className="flex items-center gap-1.5 truncate">
            <Sparkles className="w-3.5 h-3.5 text-[#c9502f] shrink-0" />
            <span>화면 아래 <b>[새 창 인쇄]</b> 또는 <b>[A4 파일 다운로드]</b>를 누르면 100% 정상 출력됩니다!</span>
          </span>
          <span className="shrink-0 font-jua text-[#c9502f] hidden sm:inline-block">A4 규격 최적화 ✨</span>
        </div>

        {/* 4 Tab Selector Buttons: 자음·모음판, 일기장 책, 완주 상장, 스티커판 도안 */}
        <div className="grid grid-cols-4 border-b border-[#e4dccf] bg-[#f5ecdd] p-1.5 sm:p-2 gap-1 sm:gap-1.5 print:hidden">
          {[
            { id: 'chart', label: '🔤 자음·모음판' },
            { id: 'diary', label: '📖 일기장 책' },
            { id: 'certificate', label: '🏆 완주 상장' },
            { id: 'sticker_sheet', label: '🌟 스티커판 도안' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                playSfx('tap');
                setPrintType(tab.id as typeof printType);
              }}
              className={`py-2 px-1 sm:px-3 rounded-xl font-jua text-xs sm:text-sm text-center transition-all truncate ${
                printType === tab.id
                  ? 'bg-white text-[#c9502f] shadow-xs font-bold'
                  : 'text-[#8a8178] hover:text-[#1b1917]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Printable Preview Container with ample padding to avoid cutoff */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto flex-1 bg-white text-[#1b1917] print:p-2 print:overflow-visible font-body">

          {/* 1. 한글 자음·모음판 (벽/냉장고 부착용 A4 포스터) */}
          {printType === 'chart' && (
            <div className="space-y-4">
              <div className="flex items-end justify-between border-b-2 border-[#1b1917] pb-2 text-center sm:text-left">
                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#fdf3e4] border border-[#f3dfc6] text-xs font-bold text-[#c9502f] font-jua mb-1">
                    벽 &amp; 냉장고 부착용 매일 한글 포스터
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-jua text-[#1b1917]">
                    🔤 {childName || '우리 아이'}의 한글 자음·모음 탐험판
                  </h1>
                </div>
                <div className="text-right text-xs font-hand text-[#8a8178] hidden sm:block">
                  손가락으로 콕콕 짚으며 소리내어 읽어요! ✨
                </div>
              </div>

              {/* 기본 자음 14자 */}
              <div className="border border-[#1b1917] rounded-2xl p-3 bg-[#fffdf9] space-y-2">
                <div className="flex items-center justify-between border-b border-[#e4dccf] pb-1">
                  <span className="font-jua text-sm text-[#c9502f] flex items-center gap-1.5">
                    <span>① 기본 자음 14자</span>
                    <span className="text-[11px] font-normal text-[#8a8178]">(기역부터 히읗까지)</span>
                  </span>
                  <span className="text-[11px] font-hand text-[#8a8178]">
                    입과 목구멍의 모양을 본떠 만들었어요
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {CONSONANTS_INFO.map((item) => (
                    <div
                      key={item.char}
                      className="border border-[#e4dccf] rounded-xl p-1.5 text-center bg-white shadow-2xs hover:border-[#c9502f] transition-colors"
                    >
                      <div className="font-jua text-2xl sm:text-3xl text-[#1b1917] leading-none mb-1">
                        {item.char}
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-bold text-[#c9502f] font-jua">
                        {item.name}
                      </div>
                      <div className="text-[9px] text-[#8a8178] font-hand flex items-center justify-center gap-0.5">
                        <span>{item.emoji}</span>
                        <span>{item.word}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 기본 모음 10자 */}
              <div className="border border-[#1b1917] rounded-2xl p-3 bg-[#fffdf9] space-y-2">
                <div className="flex items-center justify-between border-b border-[#e4dccf] pb-1">
                  <span className="font-jua text-sm text-[#2b6cb0] flex items-center gap-1.5">
                    <span>② 기본 모음 10자</span>
                    <span className="text-[11px] font-normal text-[#8a8178]">(하늘 • 땅 • 사람의 조화)</span>
                  </span>
                  <span className="text-[11px] font-hand text-[#8a8178]">
                    입을 크게 벌리고 예쁜 소리를 내요
                  </span>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 sm:gap-2">
                  {VOWELS_INFO.map((item) => (
                    <div
                      key={item.char}
                      className="border border-[#e4dccf] rounded-xl p-1.5 text-center bg-white shadow-2xs hover:border-[#2b6cb0] transition-colors"
                    >
                      <div className="font-jua text-2xl sm:text-3xl text-[#1b1917] leading-none mb-1">
                        {item.char}
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-bold text-[#2b6cb0] font-jua">
                        [{item.sound}]
                      </div>
                      <div className="text-[9px] text-[#8a8178] font-hand flex items-center justify-center gap-0.5">
                        <span>{item.emoji}</span>
                        <span>{item.word}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 소리 결합 미니 가갸표 */}
              <div className="border border-[#1b1917] rounded-2xl p-3 bg-[#faf8f5] space-y-2">
                <div className="flex items-center justify-between border-b border-[#e4dccf] pb-1">
                  <span className="font-jua text-xs sm:text-sm text-[#1b1917]">
                    ③ 소리 합체표 (자음 + 모음 = 글자!)
                  </span>
                  <span className="text-[11px] font-hand text-[#8a8178]">
                    예: ㄱ + ㅏ = '가'
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-center text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#f0ebe1] text-[#1b1917] font-jua">
                        <th className="p-1 border border-[#e4dccf] text-[10px]">자\모</th>
                        {['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ'].map((m) => (
                          <th key={m} className="p-1 border border-[#e4dccf] text-xs font-bold text-[#2b6cb0]">
                            {m}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="font-jua text-[11px]">
                      {['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅎ'].map((c) => {
                        const cIdx = CHO.indexOf(c);
                        return (
                          <tr key={c} className="hover:bg-white/80">
                            <td className="p-1 border border-[#e4dccf] font-bold text-[#c9502f] bg-[#fbf8f2]">
                              {c}
                            </td>
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((vIdx) => (
                              <td key={vIdx} className="p-1 border border-[#e4dccf] text-[#1b1917]">
                                {syl(cIdx, vIdx)}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 하단 칭찬 서명 */}
              <div className="flex items-center justify-between pt-2 border-t border-[#1b1917] font-hand text-xs text-[#8a8178]">
                <span>"엄마와 함께 짚어보며 하루 한 글자씩 알아가요!"</span>
                <span className="text-[#1b1917] font-bold">
                  칭찬 도장 찍는 곳: [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]
                </span>
              </div>
            </div>
          )}

          {printType === 'diary' && (
            <div className="space-y-5">
              <div className="flex items-end justify-between border-b-2 border-[#1b1917] pb-3 text-center sm:text-left">
                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#fdf3e4] border border-[#f3dfc6] text-xs font-bold text-[#c9502f] font-jua mb-1">
                    세상에 단 하나뿐인 추억 선물
                  </div>
                  <h1 className="text-2xl font-jua text-[#1b1917]">
                    📖 {childName || '아이'}와 함께한 엄마의 30일 한글 일기장
                  </h1>
                  <p className="text-xs text-[#8a8178] font-hand">
                    아이: {childName || '우리 아이'} ({childAge || '5세'}) • 기록한 일기 {writtenDays.length}편
                  </p>
                </div>
                <div className="text-right text-xs font-hand text-[#8a8178] hidden sm:block">
                  엄마의 따뜻한 손글씨 기록
                </div>
              </div>

              {writtenDays.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8a8178] font-hand border-2 border-dashed border-[#e4dccf] rounded-2xl">
                  아직 기록된 날짜별 일기가 없습니다.<br />
                  30일 체크 화면에서 각 일차를 터치하여 일기를 작성해보세요!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {writtenDays.map((dNum) => {
                    const entry = diaries[dNum];
                    const mission = MISSIONS[dNum - 1] || { t: '한글 놀이', s: '' };

                    return (
                      <div
                        key={dNum}
                        className="border border-[#1b1917] rounded-xl p-3.5 bg-[#faf8f5] space-y-1.5 break-inside-avoid"
                      >
                        <div className="flex items-center justify-between border-b border-[#e4dccf] pb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-jua text-sm text-[#c9502f]">D+{dNum}</span>
                            <span className="text-sm">{entry.mood}</span>
                            <span className="text-[11px] font-bold text-[#1b1917] truncate max-w-[120px]">
                              {mission.t}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#8a8178] font-hand">{entry.date}</span>
                        </div>
                        <p className="text-xs text-[#4a443e] font-hand whitespace-pre-wrap leading-relaxed">
                          {entry.content}
                        </p>
                        {entry.photoUrl && (
                          <img
                            src={entry.photoUrl}
                            alt="일기 사진"
                            className="max-h-24 rounded-lg object-contain mx-auto border border-[#e4dccf] bg-white"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-4 border-t border-[#1b1917] text-center font-hand text-xs text-[#8a8178]">
                "매일 10분, 너와 함께 눈 맞추며 웃었던 소중한 시간들을 평생 간직할게." - 사랑하는 엄마가
              </div>
            </div>
          )}

          {/* Official 30-Day Completion Certificate */}
          {printType === 'certificate' && (
            <div className="p-8 sm:p-10 border-8 border-double border-[#d4972d] rounded-3xl bg-gradient-to-b from-[#fffefc] via-[#fffdf7] to-[#fffaf0] text-center space-y-6 relative overflow-hidden my-2 shadow-inner">
              <div className="absolute top-3 left-3 text-2xl text-[#d4972d]">⚜️</div>
              <div className="absolute top-3 right-3 text-2xl text-[#d4972d]">⚜️</div>
              <div className="absolute bottom-3 left-3 text-2xl text-[#d4972d]">⚜️</div>
              <div className="absolute bottom-3 right-3 text-2xl text-[#d4972d]">⚜️</div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-[#fef3c7] border border-[#fde68a] text-xs font-bold text-[#b45309] font-jua">
                  <span>✨ 제 2026 - 30 일 완주 공식 인증서 ✨</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-jua text-[#1b1917] tracking-widest drop-shadow-xs">
                  상&nbsp;&nbsp;&nbsp;&nbsp;장
                </h1>
                <p className="text-sm font-bold text-[#c9502f] font-jua">
                  🏆 슈퍼 한글 탐험 마스터 상 🏆
                </p>
              </div>

              <div className="flex justify-center gap-4 text-3xl select-none">
                <span>🐻</span>
                <span>🦁</span>
                <span>🐰</span>
                <span>🐱</span>
                <span>🦖</span>
              </div>

              <div className="bg-white/80 p-4 rounded-2xl border border-[#eedfc9] max-w-md mx-auto space-y-1.5 font-jua text-left text-base shadow-xs">
                <div className="flex justify-between items-center border-b border-[#f0ebe1] pb-1.5">
                  <span className="text-[#8a8178] text-sm">성&nbsp;&nbsp;&nbsp;&nbsp;명:</span>
                  <span className="text-2xl text-[#c9502f] font-bold">{childName || '우리 아이'}</span>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-[#8a8178] text-sm">연&nbsp;&nbsp;&nbsp;&nbsp;령:</span>
                  <span className="text-base text-[#1b1917]">{childAge || '5세'} 어린이</span>
                </div>
              </div>

              <p className="font-hand text-base sm:text-lg leading-relaxed text-[#1b1917] max-w-lg mx-auto whitespace-pre-line py-2">
                위 어린이는 엄마와 함께한 30일 동안<br />
                매일 포기하지 않고 씩씩하고 즐겁게 놀며<br />
                아름다운 한글의 소리와 글자 모양을 훌륭하게 깨쳤으므로<br />
                온 가족의 큰 사랑과 넘치는 자랑스러움을 담아<br />
                이 빛나는 상장을 수여합니다.
              </p>

              <div className="pt-4 flex items-center justify-between px-6 max-w-md mx-auto">
                <div className="text-left font-hand text-xs text-[#8a8178] space-y-0.5">
                  <div>수여일: {new Date().toLocaleDateString('ko-KR')}</div>
                  <div>장소: 우리 집 따뜻한 공부 책상</div>
                  <div className="text-[#c9502f] font-bold">평생 칭찬 보증 ✨</div>
                </div>

                <div className="w-22 h-22 rounded-full border-4 border-[#d4972d] bg-gradient-to-br from-[#fef3c7] to-[#fde68a] text-[#b45309] flex flex-col items-center justify-center font-jua shadow-md transform -rotate-6">
                  <span className="text-2xl">👑</span>
                  <span className="text-[11px] font-bold">최고예요!</span>
                  <span className="text-[9px] text-[#92400e]">엄마의 사랑</span>
                </div>
              </div>

              <div className="pt-3 font-jua text-lg sm:text-xl text-[#1b1917] border-t border-[#eedfc9]">
                수여인: 세상에서 가장 너를 사랑하는 <span className="text-[#c9502f]">엄마 &amp; 아빠</span> 💖
              </div>
            </div>
          )}

          {/* Printable 30-Slot Sticker Board Sheets with Cut-out Coupon */}
          {printType === 'sticker_sheet' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-[#1b1917] pb-3 print:hidden">
                <div>
                  <h2 className="font-jua text-lg text-[#1b1917]">
                    A4 칭찬 스티커판 실물 도안 출력
                  </h2>
                  <p className="text-xs text-[#8a8178] font-hand">
                    원하는 테마를 골라 A4 종이로 뽑아 냉장고나 아이 방에 붙여주세요!
                  </p>
                </div>

                <div className="flex gap-1.5">
                  {THEMES.slice(0, 3).map((t, idx) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        playSfx('tap');
                        setStickerThemeIdx(idx);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-jua text-xs border transition-all ${
                        stickerThemeIdx === idx
                          ? 'bg-[#c9502f] text-white border-[#c9502f]'
                          : 'bg-white text-[#4a443e] border-[#e4dccf]'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Printable Board Sheet Canvas */}
              <div className="p-6 border-4 border-[#1b1917] rounded-3xl bg-white text-center space-y-4">
                <div className="space-y-1">
                  <div className="inline-block px-3 py-0.5 rounded-full bg-[#fdf3e4] text-[#c9502f] font-jua text-xs">
                    {selectedTheme.name} 🗺️
                  </div>
                  <h1 className="text-2xl font-jua text-[#1b1917]">
                    {childName || '우리 아이'}의 30일 칭찬 스티커 모험판
                  </h1>
                  <p className="text-xs text-[#8a8178] font-hand">
                    하루 10분 한글 미션을 완료하고 칭찬 스티커를 1칸씩 붙여요!
                  </p>
                </div>

                {/* 30 Circular Slots Grid */}
                <div className="grid grid-cols-6 gap-2.5 max-w-lg mx-auto py-2">
                  {Array.from({ length: 30 }, (_, idx) => (
                    <div
                      key={idx}
                      className="aspect-square rounded-2xl border-2 border-dashed border-[#1b1917] flex flex-col items-center justify-center text-xs font-jua bg-[#faf8f5]"
                    >
                      <span className="text-gray-400 text-xs font-bold">{idx + 1}</span>
                      <span className="text-[10px] text-gray-300">★</span>
                    </div>
                  ))}
                </div>

                {/* Cut-out Official Wish Coupon at bottom */}
                <div className="pt-3 border-t-2 border-dashed border-[#c9502f] mt-4 p-3 bg-[#fff9f5] rounded-2xl text-left space-y-1">
                  <div className="flex items-center justify-between text-xs font-jua text-[#c9502f]">
                    <span>✂️ [가위로 오려서 쓰는] 30일 완주 특별 소원권</span>
                    <span>No. 2026-HAPPY</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-[#1b1917]">
                    <span>약속 내용: ___________________________________</span>
                    <span className="text-right font-hand text-[11px] text-[#8a8178]">엄마 서명: _______</span>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px] font-hand text-[#8a8178] px-2">
                  <span>30칸 완주 시 소원권을 오려서 아이에게 선물하세요!</span>
                  <span>발행인: 사랑하는 엄마</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions (multi-action active buttons!) */}
        <div className="p-3 sm:p-4 bg-white border-t border-[#e4dccf] flex flex-col sm:flex-row items-center justify-between gap-2.5 print:hidden">
          <div className="text-xs text-[#8a8178] font-hand text-center sm:text-left">
            <span>💡 <b>A4 규격 최적화</b> 완료 • 인쇄 대화상자에서 <b>'PDF로 저장'</b> 선택 가능</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* 1. Download HTML button */}
            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-[#faf6f0] hover:bg-[#efe7d8] border border-[#dfd5c5] text-[#4a443e] font-jua text-xs sm:text-sm transition-all active:scale-95 shadow-2xs"
              title="A4 규격 파일 다운로드"
            >
              <Download className="w-3.5 h-3.5 text-[#c9502f]" />
              A4 파일 다운로드
            </button>

            {/* 2. Open standalone new tab button */}
            {blobUrl ? (
              <a
                href={blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  playSfx('fan');
                  showToast('🌐 새 창에서 인쇄 페이지가 열렸습니다!');
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-[#fef3c7] hover:bg-[#fde68a] border border-[#f59e0b]/30 text-[#92400e] font-jua text-xs sm:text-sm transition-all active:scale-95 shadow-2xs"
                title="새 탭에서 열기 & 인쇄"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#d97706]" />
                새 탭에서 열기
              </a>
            ) : (
              <button
                onClick={handleOpenNewWindow}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-[#fef3c7] hover:bg-[#fde68a] border border-[#f59e0b]/30 text-[#92400e] font-jua text-xs sm:text-sm transition-all active:scale-95 shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#d97706]" />
                새 탭에서 열기
              </button>
            )}

            {/* 3. Primary Print Action button */}
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-2.5 px-4 sm:px-5 rounded-xl bg-[#c9502f] hover:bg-[#b84324] text-white font-jua text-xs sm:text-sm shadow-md transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              지금 인쇄하기
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[70] bg-[#1b1917] text-white px-5 py-3 rounded-2xl shadow-2xl font-jua text-xs sm:text-sm flex items-center gap-2.5 border border-white/20 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* In-App Print Helper Modal Dialog (Active confirmation popup!) */}
      {showPrintGuideModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fffdf9] border-2 border-[#c9502f] rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#fdf3e4] border-2 border-[#f3dfc6] flex items-center justify-center text-3xl shadow-inner">
              🖨️
            </div>

            <div>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#fdf3e4] text-[#c9502f] font-jua text-xs mb-1">
                A4 인쇄 &amp; PDF 저장 센터
              </div>
              <h3 className="font-jua text-xl text-[#1b1917]">
                출력 방법을 선택해주세요
              </h3>
              <p className="text-xs text-[#8a8178] font-hand mt-1">
                현재 선택된 도안: <span className="font-bold text-[#c9502f]">
                  {printType === 'chart'
                    ? '🔤 자음·모음판'
                    : printType === 'diary'
                    ? '📖 일기장 책'
                    : printType === 'certificate'
                    ? '🏆 완주 상장'
                    : '🌟 스티커판 도안'}
                </span>
              </p>
            </div>

            {/* 3 Prominent Action Buttons */}
            <div className="space-y-2.5 pt-1">
              {/* 1. Open New Tab Button */}
              {blobUrl ? (
                <a
                  href={blobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    playSfx('fan');
                    setShowPrintGuideModal(false);
                    showToast('🌐 새 창에서 인쇄 페이지가 열렸습니다!');
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#c9502f] hover:bg-[#b84324] text-white font-jua text-sm sm:text-base shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 block"
                >
                  <ExternalLink className="w-4 h-4" />
                  새 창에서 인쇄 페이지 열기 (강력 추천 🌟)
                </a>
              ) : (
                <button
                  onClick={handleOpenNewWindow}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#c9502f] hover:bg-[#b84324] text-white font-jua text-sm sm:text-base shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  새 창에서 인쇄 페이지 열기 (강력 추천 🌟)
                </button>
              )}

              {/* 2. Download File Button */}
              <button
                onClick={() => {
                  handleDownload();
                  setShowPrintGuideModal(false);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-[#faf6f0] hover:bg-[#efe7d8] border border-[#dfd5c5] text-[#1b1917] font-jua text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Download className="w-4 h-4 text-[#c9502f]" />
                A4 인쇄용 파일 다운로드 (.html) 💾
              </button>

              {/* 3. Try direct print */}
              <button
                onClick={() => {
                  playSfx('fan');
                  setShowPrintGuideModal(false);
                  try {
                    window.print();
                  } catch (e) {
                    console.warn(e);
                  }
                }}
                className="w-full py-2.5 px-4 rounded-2xl bg-white border border-[#e4dccf] hover:bg-gray-50 text-[#8a8178] font-jua text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                브라우저 인쇄창 바로 호출 시도
              </button>
            </div>

            {/* Practical PDF saving tips */}
            <div className="bg-[#fcf9f2] p-3 rounded-2xl border border-[#eedfc9] text-left text-[11px] text-[#4a443e] font-hand space-y-1">
              <div className="font-jua text-xs text-[#c9502f] flex items-center gap-1">
                <span>💡 PDF 파일로 저장하는 방법</span>
              </div>
              <p>1. 열린 인쇄 창에서 <b>[대상(프린터)]</b>을 <b>'PDF로 저장'</b>으로 선택하세요.</p>
              <p>2. <b>[설정 더보기]</b>에서 <b>'배경 그래픽 인쇄'</b>를 체크하면 예쁜 색상이 그대로 출력됩니다.</p>
              <p>3. <b>[저장]</b>을 누르면 스마트폰이나 PC에 PDF 문서로 영구 보관됩니다.</p>
            </div>

            <button
              onClick={() => {
                playSfx('tap');
                setShowPrintGuideModal(false);
              }}
              className="w-full py-2.5 rounded-xl bg-[#eee7db] hover:bg-[#e2d9ca] text-[#4a443e] font-jua text-xs transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
