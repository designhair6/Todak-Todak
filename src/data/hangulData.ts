import {
  AnimalFriend,
  BoardTheme,
  CommunityPost,
  Mission,
  StageId,
  StageInfo,
  TracingItem,
  Week,
} from '../types';

export const CHO = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
export const CHO_I = [0, 2, 3, 5, 6, 7, 9, 11, 12, 14, 15, 16, 17, 18];
export const JUNG = ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ'];
export const JUNG_I = [0, 2, 4, 6, 8, 12, 13, 17, 18, 20];
export const NAMES = ['기역', '니은', '디귿', '리을', '미음', '비읍', '시옷', '이응', '지읒', '치읓', '키읔', '티읕', '피읖', '히읗'];

export const syl = (c: number, j: number): string => {
  return String.fromCharCode(0xAC00 + (CHO_I[c] * 21 + JUNG_I[j]) * 28);
};

// 10 Full Curriculum Stages (1단계 ~ 10단계)
export const STAGES: StageInfo[] = [
  {
    id: 1,
    name: '1단계: 자음이랑 친해지기',
    sub: '기역부터 히읗까지 모양과 소리',
    tag: '기초 모양',
    target: 'ㄱ ~ ㅎ 14개 자음 모양 탐험',
    badge: '🌱',
    desc: '집 안 사물과 몸으로 글자 모양을 만들며 자음과 친해져요.',
  },
  {
    id: 2,
    name: '2단계: 모음이랑 친해지기',
    sub: '아야어여오요우유으이 입모양 놀이',
    tag: '소리 기둥',
    target: 'ㅏ ~ ㅣ 10개 모음 방향과 소리',
    badge: '🌿',
    desc: '입을 크게 벌리고 방향을 짚어가며 모음의 길을 익혀요.',
  },
  {
    id: 3,
    name: '3단계: 글자 뽀뽀 합체',
    sub: '자음과 모음이 만나 소리 만들기',
    tag: '소리 결합',
    target: '가 ~ 하 기본 140글자 원리',
    badge: '🌸',
    desc: '자음과 모음 카드가 뽀뽀하면 어떤 소리가 날지 놀이로 배워요.',
  },
  {
    id: 4,
    name: '4단계: 신나는 단어 탐험',
    sub: '동물, 과일, 가족 단어 술술 읽기',
    tag: '단어 읽기',
    target: '나비, 사자, 사과, 우유, 나무',
    badge: '🍎',
    desc: '아이가 매일 마주치는 친근한 두 글자, 세 글자 단어를 읽어요.',
  },
  {
    id: 5,
    name: '5단계: 받침 글자와 동화 읽기',
    sub: '입을 닫고 울리는 받침의 마법',
    tag: '받침 & 문장',
    target: 'ㅁ, ㅇ, ㄹ 받침과 \'엄마 사랑해\'',
    badge: '👑',
    desc: '입술이 닫히는 받침을 배우고 스스로 그림책 문장을 읽어요.',
  },
  {
    id: 6,
    name: '6단계: 이중모음과 꿀꺽 소리',
    sub: '애, 에, 와, 워, 위 신기한 모음',
    tag: '이중모음',
    target: '개미, 매미, 사과, 과자, 귀',
    badge: '⭐',
    desc: '두 모음이 합쳐져 나는 풍성한 이중모음 소리를 탐험해요.',
  },
  {
    id: 7,
    name: '7단계: 씩씩한 쌍자음 놀이',
    sub: '까, 따, 빠, 싸, 짜 힘찬 소리',
    tag: '쌍자음',
    target: '까치, 코끼리, 뽀뽀, 토끼, 아빠',
    badge: '🦁',
    desc: '두 자음이 꼭 붙어 나는 씩씩하고 힘찬 된소리를 익혀요.',
  },
  {
    id: 8,
    name: '8단계: 다양한 받침 탐험',
    sub: 'ㅂ, ㅅ, ㄷ, ㅈ, ㅊ 받침의 비밀',
    tag: '복합 받침',
    target: '밥, 옷, 빗, 숲, 빛 단어 모으기',
    badge: '💎',
    desc: '끝소리가 똑 떨어지는 다양한 받침의 소리 규칙을 배워요.',
  },
  {
    id: 9,
    name: '9단계: 의성어·의태어 표현 놀이',
    sub: '반짝반짝, 퐁당퐁당 감성 표현',
    tag: '어휘력 풍부',
    target: '살랑살랑, 쿵쾅쿵쾅, 졸졸',
    badge: '🎈',
    desc: '흉내 내는 말로 말맛을 느끼며 어휘력과 표현력을 쑥쑥 키워요.',
  },
  {
    id: 10,
    name: '10단계: 동화책 스스로 완독',
    sub: '한 권 술술 읽고 가족에게 편지 쓰기',
    tag: '완전 독립',
    target: '그림책 스스로 완독 & 감동 편지',
    badge: '🏆',
    desc: '혼자서 동화책을 읽고 엄마 아빠에게 마음을 담은 편지를 써요.',
  },
];

// Helper to generate full 30 missions per stage
const createStageMissions = (stage: StageId): Mission[] => {
  const base = {
    1: [
      { t: "'ㄱ' 카드와 기린", s: "목이 긴 기린처럼 뾰족 꺾어진 ㄱ 찾아보기" },
      { t: "'ㄴ' 의자 모서리", s: "앉아있는 의자 다리에서 ㄴ 모양 발견하기" },
      { t: "내 이름 첫 자음", s: "아이 이름 첫 글자의 자음을 허공에 그리기" },
      { t: "'ㄷ' 문틀 모양", s: "네모 상자에서 한쪽이 열린 ㄷ 만들기" },
      { t: "'ㄹ' 구불구불 뱀", s: "뱀처럼 스르륵 기어가는 ㄹ 손가락 따라가기" },
      { t: "'ㅁ' 네모 창문", s: "두 손으로 네모 창문 만들어 얼굴 빼꼼하기" },
      { t: "달콤한 쉬는 날", s: "배운 자음이 나오는 그림책 한 권 꼭 안고 읽기", rest: true },
      { t: "'ㅂ' 바구니 담기", s: "물건을 쏙 담을 수 있는 ㅂ 바구니 흉내내기" },
      { t: "'ㅅ' 뾰족 텐트", s: "두 발을 벌려 ㅅ 텐트 만들고 아래로 지나가기" },
      { t: "'ㅇ' 동그라미 산책", s: "동네 산책하며 자동차 바퀴, 시계에서 ㅇ 찾기" },
      { t: "'ㅈ' 지붕 얹기", s: "ㅅ 텐트 위에 모자 하나 얹으면 ㅈ 완성!" },
      { t: "'ㅊ' 깃발 꽂기", s: "지붕 위에 깃발 펄럭이는 ㅊ 관찰하기" },
      { t: "자음 기억력 게임", s: "배운 6개 카드로 뒤집어 짝 맞추기" },
      { t: "즐거운 쉬는 날", s: "마트 간판에서 아는 자음 1개 먼저 찾기", rest: true },
      { t: "'ㅋ' 코끼리 코", s: "ㄱ 기역 가운데에 선 하나 슉 더 긋기" },
      { t: "'ㅌ' 기차 레일", s: "칙칙폭폭 레일처럼 선 세 개 ㄷ 속에 넣기" },
      { t: "'ㅍ' 파란 창문", s: "기둥 두 개와 위아래 지붕 닫아 ㅍ 짓기" },
      { t: "'ㅎ' 모자 쓴 얼굴", s: "동그라미 위에 멋진 모자 쓴 ㅎ 완성하기" },
      { t: "자음 낚시 놀이", s: "자석 클립 끼워 자음 물고기 낚아 올리기" },
      { t: "자음 몸으로 만들기", s: "엄마랑 둘이 팔다리로 원하는 자음 만들기" },
      { t: "뿌듯한 쉬는 날", s: "이번 주 배운 카드 모아놓고 아이 칭찬하기", rest: true },
      { t: "밀가루에 자음 쓰기", s: "쟁반 위 쌀이나 가루에 손가락으로 쓱쓱" },
      { t: "자음 소리 흉내", s: "그그 기역, 느느 니은 노래하듯 리듬 타기" },
      { t: "우리집 자음 보물찾기", s: "집안 곳곳 숨겨둔 14개 자음 카드 찾기" },
      { t: "등 뒤에 자음 쓰기", s: "아이 등 뒤에 손가락으로 쓰고 맞히는 간지럼" },
      { t: "자음 빙고 놀이", s: "엄마가 부르면 손바닥으로 찰싹 찍기" },
      { t: "찰흙으로 자음 빚기", s: "클레이 국수 길게 뽑아 자음 글자 빚기" },
      { t: "신나는 쉬는 날", s: "동네 도서관 가서 좋아하는 그림책 고르기", rest: true },
      { t: "14개 자음 퍼레이드", s: "ㄱ부터 ㅎ까지 줄지어 기차 만들기" },
      { t: "1단계 자음 마스터!", s: "14개 자음 모양 전부 알아보며 큰 박수 받기", goal: true },
    ],
    2: [
      { t: "'ㅏ' 소리 탐험", s: "\"아~\" 하고 입 크게 벌려 사자 흉내내기" },
      { t: "'ㅑ' 소리 두 번", s: "\"야!\" 하고 깜짝 놀라는 입모양 만들기" },
      { t: "'ㅓ' 입 살짝 열기", s: "\"어?\" 하고 신기한 것을 보듯 동그란 입" },
      { t: "'ㅕ' 살짝 미소", s: "\"여~\" 하고 친구에게 반갑게 인사하기" },
      { t: "방향 짚기 놀이", s: "오른쪽은 ㅏ, 왼쪽은 ㅓ 손가락 가리키기" },
      { t: "모음 점프 놀이", s: "바닥에 붙인 ㅏ, ㅓ로 깡총 뛰어보기" },
      { t: "달콤한 쉬는 날", s: "모음 소리가 풍성한 동요 함께 부르기", rest: true },
      { t: "'ㅗ' 위로 솟아라", s: "동그랗게 오~ 하고 하늘 위로 가리키기" },
      { t: "'ㅛ' 안녕 두 손", s: "요들송 부르듯 \"요~\" 하고 손 흔들기" },
      { t: "'ㅜ' 아래로 내려가", s: "입술 쭉 내밀고 바닥으로 우~ 가리키기" },
      { t: "'ㅠ' 눈물 흉내", s: "아이코 슬퍼라 \"유유\" 하며 웃기" },
      { t: "위·아래 방향 게임", s: "ㅗ 나오면 머리 위로, ㅜ 나오면 무릎으로" },
      { t: "모음 블록 징검다리", s: "블록 위에 모음 얹어 징검다리 건너기" },
      { t: "즐거운 쉬는 날", s: "공원에서 입 크게 벌리고 신나게 달리기", rest: true },
      { t: "'ㅡ' 납작한 입술", s: "개구리 뒷다리 하듯 옆으로 으~ 당기기" },
      { t: "'ㅣ' 활짝 미소", s: "치즈~ 김치~ 하며 이가 보이게 활짝 웃기" },
      { t: "'ㅡ'와 'ㅣ' 대결", s: "가로 선 ㅡ, 세로 기둥 ㅣ 손가락 놀이" },
      { t: "입모양 맞히기 퀴즈", s: "엄마가 소리 없이 입모양만 내고 맞히기" },
      { t: "10개 모음 합창단", s: "아야어여오요우유으이 노래 리듬 타기" },
      { t: "빨대로 모음 만들기", s: "빨대 잘라 기둥과 짧은 획 붙여보기" },
      { t: "뿌듯한 쉬는 날", s: "모음 노래 들으며 엉덩이 춤추기", rest: true },
      { t: "바람개비 모음 놀이", s: "소리 내며 후~ 바람개비 돌리기" },
      { t: "모음 보물 지도", s: "집안에 숨은 모음 카드 10장 모두 찾기" },
      { t: "거울 보고 소리내기", s: "거울 보며 내 입모양 변화 관찰하기" },
      { t: "모음 카드 줄세우기", s: "소리 나는 순서대로 차례차례 놓기" },
      { t: "스탬프로 모음 찍기", s: "물감 찍어 선과 점으로 모음 완성하기" },
      { t: "모음 빙고 판 놀이", s: "엄마가 부르는 모음 소리에 스티커 콕" },
      { t: "신나는 쉬는 날", s: "맛있는 간식 먹으며 '아' '오' 소리내기", rest: true },
      { t: "10개 모음 총정리", s: "아이가 좋아하는 모음 3개 뽐내기" },
      { t: "2단계 모음 마스터!", s: "10개 모음 방향과 소리 완벽 정복!", goal: true },
    ],
    3: [
      { t: "ㄱ + ㅏ = 가", s: "기역과 아가 뽀뽀해서 '가' 소리가 나요" },
      { t: "ㄴ + ㅏ = 나", s: "니은과 아가 만나 '나' 하고 날아가요" },
      { t: "ㄷ + ㅏ = 다", s: "다람쥐의 '다' 소리 함께 외쳐보기" },
      { t: "ㄹ + ㅏ = 라", s: "라면 호로록 '라' 소리 만들기" },
      { t: "ㅁ + ㅏ = 마", s: "엄마의 '마' 첫 글자 완성하기" },
      { t: "가 나 다 노래 카드", s: "리듬에 맞춰 손가락으로 가나다 짚기" },
      { t: "달콤한 쉬는 날", s: "가나다 그림책 함께 보며 쉬어가기", rest: true },
      { t: "ㅂ + ㅏ = 바", s: "바나나의 '바' 노란 카드 찾기" },
      { t: "ㅅ + ㅏ = 사", s: "어흥 사자의 '사' 큰 소리로 외치기" },
      { t: "ㅇ + ㅏ = 아", s: "아기의 '아' 사랑스럽게 안아주기" },
      { t: "ㅈ + ㅏ = 자", s: "자동차의 '자' 붕붕 손 굴리기" },
      { t: "차 카 타 파 하", s: "씩씩한 거센 소리 바람 불며 발음하기" },
      { t: "소리 짝짓기 퍼즐", s: "자음 반쪽, 모음 반쪽 맞춰 글자 만들기" },
      { t: "즐거운 쉬는 날", s: "마트에서 '가' '나' '사' 간판 찾기", rest: true },
      { t: "고 노 도 ㅗ 소리", s: "입술 모아 ㅗ와 만나는 글자들 탐험" },
      { t: "구 누 두 ㅜ 소리", s: "입술 쭉 내밀어 ㅜ와 만나는 글자들" },
      { t: "기 니 디 ㅣ 소리", s: "활짝 웃으며 ㅣ와 만나는 맑은 소리" },
      { t: "소리 빙고 대결", s: "엄마랑 아이랑 3x3 글자판 채우기" },
      { t: "블록 위에 글자 붙이기", s: "글자 블록 높이높이 쌓아 올리기" },
      { t: "글자 도미노 놀이", s: "글자 카드 세워 톡 쓰러뜨리며 읽기" },
      { t: "뿌듯한 쉬는 날", s: "아이가 좋아하는 단어 카드 다시 보기", rest: true },
      { t: "가~하 기차 놀이", s: "14개 글자 기차 길게 이어보기" },
      { t: "바구니에 소리 던지기", s: "탁구공 던져 들어간 칸의 글자 읽기" },
      { t: "물총으로 글자 쏘기", s: "벽에 붙인 글자 중 부르는 소리 맞히기" },
      { t: "반대말 소리 찾기", s: "오르락 내리락 소리의 고저 느끼기" },
      { t: "손뼉 치며 가갸거겨", s: "짝짜꿍 박자 맞춰 두 글자씩 부르기" },
      { t: "글자 자석 냉장고 파티", s: "냉장고에 아는 글자 줄줄이 붙이기" },
      { t: "신나는 쉬는 날", s: "공원에서 흙바닥에 나뭇가지로 가 써보기", rest: true },
      { t: "가갸표 섞어 읽기", s: "카드를 섞어도 척척 읽어내기" },
      { t: "3단계 글자합체 마스터!", s: "기본 140글자의 원리를 완전히 깨달았어요!", goal: true },
    ],
    4: [
      { t: "'나무' 첫 단어", s: "초록색 나무를 보며 '나'와 '무' 이어 읽기" },
      { t: "'우유' 이름표", s: "냉장고 우유 팩에 아이 손으로 찰칵" },
      { t: "'사자'와 '호랑이'", s: "동물원 친구들 이름 카드 짝 맞추기" },
      { t: "'토끼' 깡총", s: "귀여운 토끼 흉내 내며 글자 읽기" },
      { t: "'나비' 꽃밭", s: "꽃에 앉은 나비 단어 카드 찾아보기" },
      { t: "동물 단어 보물찾기", s: "방 안에 숨겨진 동물 친구들 찾아 읽기" },
      { t: "달콤한 쉬는 날", s: "동물 그림책 소리 내어 함께 읽기", rest: true },
      { t: "'사과' 달콤", s: "빨간 사과 보며 '사'와 '과' 읽기" },
      { t: "'포도' 송이", s: "보라색 포도알 세며 글자 짚기" },
      { t: "'당근' 토끼 밥", s: "주황색 당근 모양 카드 매칭하기" },
      { t: "'오이' 아삭", s: "초록색 오이 단어 직접 손으로 써보기" },
      { t: "'수박' 시원", s: "커다란 수박 두 글자 입 크게 벌려 읽기" },
      { t: "과일 바구니 놀이", s: "부르는 과일 카드 바구니에 담기" },
      { t: "즐거운 쉬는 날", s: "마트 과일 코너에서 이름표 같이 보기", rest: true },
      { t: "'모자' 씌우기", s: "인형 머리에 모자 씌우며 단어 읽기" },
      { t: "'바다' 파도", s: "푸른 바다 그림 위에 글자 카드 얹기" },
      { t: "'아기' 까꿍", s: "귀여운 아기 카드 안아주며 읽기" },
      { t: "'기차' 칙칙폭폭", s: "길게 늘어선 기차 단어 이어보기" },
      { t: "'비행기' 훨훨", s: "하늘 높이 날아가는 세 글자 도전" },
      { t: "'자동차' 붕붕", s: "장난감 차 굴리며 이름표 싣고 가기" },
      { t: "뿌듯한 쉬는 날", s: "지금까지 모은 단어 카드 뿌듯하게 보기", rest: true },
      { t: "그림 보고 단어 찾기", s: "그림 카드 5장 옆에 맞는 단어 놓기" },
      { t: "단어 낚시 대회", s: "오늘의 저녁 메뉴 단어 낚아보기" },
      { t: "가족 얼굴과 이름표", s: "엄마, 아빠 사진 아래 이름표 붙이기" },
      { t: "우리집 물건 이름표", s: "시계, 의자, 문에 스티커 라벨 붙이기" },
      { t: "단어 스피드 퀴즈", s: "카드를 휙 보여주면 1초 만에 맞히기" },
      { t: "좋아하는 단어 책 만들기", s: "아이가 고른 단어 5개로 미니북 묶기" },
      { t: "신나는 쉬는 날", s: "동네 산책하며 아는 단어 3개 발견하기", rest: true },
      { t: "단어 마스터 파티", s: "배운 20개 단어 카드 전부 읽어보기" },
      { t: "4단계 단어 마스터!", s: "동물, 과일, 일상 단어를 혼자 척척 읽어요!", goal: true },
    ],
    5: [
      { t: "ㅁ 받침의 마법", s: "\"마\"에 ㅁ 받침이 오면 입술이 닫혀요" },
      { t: "'엄' 소리 내보기", s: "입을 앙 다물고 \"음~\" 하다가 \"엄!\"" },
      { t: "'곰'과 '밤' 단어", s: "달콤한 밤, 털 많은 곰 받침 쏙쏙" },
      { t: "ㅇ 받침의 울림", s: "코가 찌릿찌릿 울리는 방울 소리 ㅇ" },
      { t: "'강'과 '공'", s: "흐르는 강, 통통 튀는 공 읽기" },
      { t: "'방'과 '가방'", s: "매일 메는 유치원 가방 이름표" },
      { t: "달콤한 쉬는 날", s: "받침 있는 동화책 한 페이지 읽어주기", rest: true },
      { t: "ㄹ 받침의 혀끝", s: "달, 별, 물 혀끝이 입천장에 톡!" },
      { t: "'달'과 '별'", s: "밤하늘에 떠오른 반짝이는 달과 별" },
      { t: "'물' 꿀꺽", s: "시원한 물 마시며 한 글자 읽기" },
      { t: "ㄱ 받침 톡 끊기", s: "약, 떡, 북 목구멍을 톡 닫는 소리" },
      { t: "받침 있는 단어 낚시", s: "받침 친구들 자석으로 척척 낚기" },
      { t: "받침 주사위 놀이", s: "주사위 굴려 나온 받침 붙여 읽기" },
      { t: "즐거운 쉬는 날", s: "동네 간판에서 받침 있는 글자 찾기", rest: true },
      { t: "'사' + '랑' = 사랑", s: "두 글자가 만나 가슴 벅찬 사랑" },
      { t: "'고' + '맙' = 고맙", s: "\"고마워\" 할 때의 고맙 읽어보기" },
      { t: "'예' + '쁘' = 예쁘", s: "활짝 핀 꽃처럼 예쁜 글자 읽기" },
      { t: "짧은 두 단어 연결", s: "예쁜 꽃, 파란 하늘 묶어 읽기" },
      { t: "엄마 손가락 편지", s: "엄마 손바닥에 아이가 사랑 쓰기" },
      { t: "동화책 한 줄 스스로", s: "그림책 첫 줄을 아이가 소리 내어 읽기" },
      { t: "뿌듯한 쉬는 날", s: "온 가족 앞에서 읽은 문장 자랑하기", rest: true },
      { t: "내 이름 석 자 완성", s: "받침까지 완벽하게 내 이름 읽고 쓰기" },
      { t: "가족에게 편지 쓰기", s: "낙서판에 '엄마 사랑해' 또박또박 그리기" },
      { t: "비밀 글자 보물찾기", s: "보물 쪽지에 적힌 글자 읽고 장난감 찾기" },
      { t: "간판 문장 읽기 산책", s: "길거리 표지판 두 글자 스스로 읽기" },
      { t: "그림책 주인공 읽기", s: "책 표지에 적힌 제목 아이가 읽기" },
      { t: "받침 끝말잇기 놀이", s: "엄마랑 받침 단어로 핑퐁 놀이하기" },
      { t: "신나는 쉬는 날", s: "온 가족 맛있는 간식 파티 열기", rest: true },
      { t: "대망의 리허설", s: "'엄마, 사랑해, 고마워' 눈 맞추며 읽기" },
      { t: "5단계 최종 완주! '엄마' 읽기", s: "세상에서 가장 아름다운 소리, 엄마를 스스로 읽었습니다!", goal: true },
    ],
    // 6단계 ~ 10단계 추가 생성!
    6: [
      { t: "'ㅐ'와 '개미'", s: "아와 이가 만나 애! 부지런한 개미 읽기" },
      { t: "'ㅔ'와 '베개'", s: "어와 이가 만나 에! 폭신폭신 베개 찾기" },
      { t: "'ㅘ'와 '사과'", s: "오와 아가 만나 와! 새콤달콤 사과" },
      { t: "'ㅝ'와 '태권도'", s: "우와 어가 만나 워! 씩씩한 태권도" },
      { t: "'ㅟ'와 '다람쥐'", s: "우와 이가 만나 위! 귀여운 다람쥐" },
      { t: "이중모음 보물찾기", s: "집안에서 ㅐ, ㅔ 물건 찾아보기" },
      { t: "달콤한 쉬는 날", s: "이중모음 가득한 동화책 한 권 읽기", rest: true },
      { t: "'ㅢ'와 '의사'", s: "으와 이가 만나 의! 의사 선생님 놀이" },
      { t: "'배'와 '비행기'", s: "바다의 배, 하늘의 비행기 비교하기" },
      { t: "'매미' 맴맴", s: "여름 매미 소리 내며 낱말 읽기" },
      { t: "'과자' 파티", s: "바삭바삭 과자 봉지 글자 읽기" },
      { t: "'돼지' 꿀꿀", s: "통통한 아기 돼지 세 글자 읽기" },
      { t: "이중모음 빙고", s: "엄마가 부르는 이중모음에 동그라미" },
      { t: "즐거운 쉬는 날", s: "마트에서 과자 이름표 읽기 놀이", rest: true },
      { t: "'귀'와 '가위'", s: "쫑긋한 귀, 싹둑싹둑 가위" },
      { t: "'시계' 째깍째깍", s: "거실 벽시계 보며 시계 읽기" },
      { t: "'그네' 흔들흔들", s: "놀이터 그네 타며 글자 외치기" },
      { t: "'의자'에 앉기", s: "의자에 이름표 붙이고 앉기 놀이" },
      { t: "'새'와 '까치'", s: "하늘 나는 날개 달린 새 단어" },
      { t: "'해'님 방긋", s: "따스한 해님 얼굴 그리고 글자 쓰기" },
      { t: "뿌듯한 쉬는 날", s: "이번 주 배운 이중모음 카드 뽐내기", rest: true },
      { t: "이중모음 스피드 퀴즈", s: "카드를 보고 1초 만에 소리내기" },
      { t: "모음 퍼즐 맞추기", s: "두 조각 모음을 붙여 완성하기" },
      { t: "소리 흉내 동화 읽기", s: "와르르, 우르르 모음 흉내내기" },
      { t: "이중모음 기차 놀이", s: "배, 새, 해 글자 기차 이어 달리기" },
      { t: "밀가루에 '와' 쓰기", s: "손가락으로 둥글게 '와' 그리기" },
      { t: "동화책 속 '의' 찾기", s: "책 속에서 의사, 의자 글자 세기" },
      { t: "신나는 쉬는 날", s: "가족과 함께 좋아하는 디저트 먹기", rest: true },
      { t: "이중모음 총정리", s: "좋아하는 이중모음 단어 5개 읽기" },
      { t: "6단계 이중모음 마스터!", s: "풍성하고 신비로운 이중모음 정복 완료!", goal: true },
    ],
    7: [
      { t: "'ㄲ'과 '까치'", s: "기역 두 개가 손잡은 씩씩한 ㄲ" },
      { t: "'코끼리' 쿵쿵", s: "코가 긴 코끼리 쌍자음 ㄲ 읽기" },
      { t: "'ㄸ'과 '딸기'", s: "디귿 두 개가 튼튼한 ㄸ! 빨간 딸기" },
      { t: "'떡' 냠냠", s: "쫀득쫀득 떡 한 글자 힘차게 읽기" },
      { t: "'ㅃ'과 '뽀뽀'", s: "엄마랑 볼에 뽀뽀 쪽! ㅃ 읽기" },
      { t: "'빵' 냄새 솔솔", s: "고소한 빵 낱말 카드 짚기" },
      { t: "달콤한 쉬는 날", s: "쌍자음이 많이 나오는 동요 부르기", rest: true },
      { t: "'ㅆ'과 '싸움' NO!", s: "시옷 두 개 텐트 튼튼한 ㅆ" },
      { t: "'쌀'과 '씨앗'", s: "땅에 심는 작은 씨앗 단어 읽기" },
      { t: "'ㅉ'과 '짜장면'", s: "맛있는 짜장면 찌개 ㅈㅈ 쌍자음" },
      { t: "'쪽지' 비밀 편지", s: "엄마의 사랑 쪽지 읽어보기" },
      { t: "'토끼' 깡총깡총", s: "쌍자음 ㄲ가 들어간 귀여운 토끼" },
      { t: "쌍자음 목소리 대결", s: "가 vs 까 소리의 세기 비교하기" },
      { t: "즐거운 쉬는 날", s: "맛있는 빵 사 먹으며 봉투 글자 보기", rest: true },
      { t: "'아빠' 든든해", s: "세상에서 제일 멋진 우리 아빠 읽기" },
      { t: "'꼬마' 탐험가", s: "귀여운 꼬마 두 글자 씩씩하게" },
      { t: "'뿌리' 깊은 나무", s: "땅속 튼튼한 뿌리 단어 읽기" },
      { t: "'쓰레기' 쏙쏙", s: "분리수거 통 앞에서 단어 배우기" },
      { t: "'찌개' 보글보글", s: "맛있는 된장찌개 낱말 짚기" },
      { t: "'코끼리 아저씨'", s: "동요 가사 속 쌍자음 찾기" },
      { t: "뿌듯한 쉬는 날", s: "아빠에게 배운 쌍자음 자랑하기", rest: true },
      { t: "쌍자음 자석 낚시", s: "ㄲ, ㄸ, ㅃ 물고기 낚아 올리기" },
      { t: "몸으로 쌍자음 만들기", s: "둘이서 나란히 서서 쌍둥이 자음" },
      { t: "쌍자음 풍선 터뜨리기", s: "풍선에 적힌 낱말 소리 내어 읽기" },
      { t: "쌍자음 끝말잇기", s: "뽀뽀 - 뽀로로 - 로봇 이어가기" },
      { t: "쌍자음 책갈피 만들기", s: "좋아하는 쌍자음 단어로 예쁜 표식" },
      { t: "간판 속 쌍자음 찾기", s: "빵집, 떡집 간판 스스로 읽기" },
      { t: "신나는 쉬는 날", s: "놀이터에서 씩씩하게 뛰어놀기", rest: true },
      { t: "쌍자음 5남매 파티", s: "ㄲ ㄸ ㅃ ㅆ ㅉ 줄세워 읽기" },
      { t: "7단계 쌍자음 마스터!", s: "힘차고 씩씩한 쌍자음 완벽 정복!", goal: true },
    ],
    8: [
      { t: "'ㅂ' 받침 밥", s: "맛있는 밥, 입술을 꼭 닫는 ㅂ 받침" },
      { t: "'집'과 '입'", s: "우리가 사는 따뜻한 집 읽기" },
      { t: "'숲'과 '잎'", s: "피톤치드 숲속 초록 나뭇잎" },
      { t: "'ㅅ' 받침 옷", s: "따뜻한 외투 옷, ㄷ소리로 닫혀요" },
      { t: "'빗'과 '햇살'", s: "머리 빗는 빗, 눈부신 햇살" },
      { t: "'꽃'과 '빛'", s: "예쁜 꽃, 반짝이는 불빛 ㅊ 받침" },
      { t: "달콤한 쉬는 날", s: "받침이 풍성한 자연 그림책 읽기", rest: true },
      { t: "'낮'과 '밤'", s: "해가 뜬 낮, 별이 뜬 밤 비교" },
      { t: "'밭'과 '솥'", s: "농부의 밭, 밥 짓는 솥 ㅌ 받침" },
      { t: "'부엌'과 '잎'", s: "맛있는 요리하는 부엌 ㅋ 받침" },
      { t: "받침 소리 가족 묶기", s: "끝소리가 같아지는 글자 모으기" },
      { t: "받침 주사위 던지기", s: "주사위 굴려 나오는 받침 읽기" },
      { t: "받침 도장 콩콩", s: "스탬프로 글자 아래 받침 찍기" },
      { t: "즐거운 쉬는 날", s: "마트 식품 코너에서 받침 글자 찾기", rest: true },
      { t: "'딸기밥' 상상 놀이", s: "재미있는 받침 단어 합성하기" },
      { t: "'신발'과 '양말'", s: "외출할 때 신는 물건 이름표" },
      { t: "'연필' 쥐어보기", s: "글씨 쓰는 연필 단어 읽기" },
      { t: "'지우개' 깨끗", s: "틀려도 괜찮아 지우개 낱말" },
      { t: "'공책'에 그리기", s: "나만의 그림 공책 이름 쓰기" },
      { t: "'달님' 안녕", s: "밤하늘 달님에게 인사하며 읽기" },
      { t: "뿌듯한 쉬는 날", s: "받침 단어로 지은 짧은 동화 읽기", rest: true },
      { t: "받침 단어 스피드 퀴즈", s: "카드 뒤집어 바로 받침 소리 내기" },
      { t: "받침 낚시 놀이", s: "밥, 옷, 꽃 물고기 낚아 올리기" },
      { t: "내 방 물건 받침 라벨", s: "책상, 침대, 옷장에 라벨 붙이기" },
      { t: "받침 끝말잇기 대결", s: "엄마랑 받침 단어로 이어달리기" },
      { t: "받침 빙고 게임", s: "가로 세로 3줄 먼저 완성하기" },
      { t: "받침 글자 책 만들기", s: "아이가 좋아하는 받침 낱말 모음" },
      { t: "신나는 쉬는 날", s: "산책하며 간판 받침 글자 읽기", rest: true },
      { t: "다양한 받침 총복습", s: "어려운 받침 5개 스스로 읽기" },
      { t: "8단계 받침 마스터!", s: "어떤 받침이 와도 당황하지 않아요!", goal: true },
    ],
    9: [
      { t: "'반짝반짝' 별빛", s: "밤하늘 별이 반짝반짝 빛나요" },
      { t: "'살랑살랑' 바람", s: "봄바람이 살랑살랑 불어와요" },
      { t: "'퐁당퐁당' 돌멩이", s: "시냇물에 돌을 퐁당퐁당 던져요" },
      { t: "'뒤뚱뒤뚱' 오리", s: "귀여운 오리가 뒤뚱뒤뚱 걸어요" },
      { t: "'엉금엉금' 거북이", s: "느림보 거북이 엉금엉금 기어가요" },
      { t: "'데굴데굴' 도토리", s: "다람쥐 도토리 데굴데굴 굴러가요" },
      { t: "달콤한 쉬는 날", s: "의성어 의태어 가득한 동시 읽기", rest: true },
      { t: "'깡총깡총' 토끼", s: "하얀 토끼 깡총깡총 뛰어놀아요" },
      { t: "'펄럭펄럭' 깃발", s: "바람에 깃발이 펄럭펄럭 춤춰요" },
      { t: "'주룩주룩' 봄비", s: "하늘에서 비가 주룩주룩 내려요" },
      { t: "'훨훨' 나비", s: "꽃밭 위로 나비가 훨훨 날아가요" },
      { t: "'두근두근' 마음", s: "선물 상자 열기 전 두근두근" },
      { t: "몸으로 흉내 내기", s: "엄마가 말하면 온몸으로 표현하기" },
      { t: "즐거운 쉬는 날", s: "놀이터에서 쿵쾅쿵쾅 신나게 뛰기", rest: true },
      { t: "'송송' 눈꽃", s: "하얀 눈이 송송송 내려앉아요" },
      { t: "'보글보글' 찌개", s: "맛있는 국이 보글보글 끓어요" },
      { t: "'알록달록' 무지개", s: "일곱 빛깔 알록달록 고운 색깔" },
      { t: "'쿨쿨' 잠자기", s: "아기 곰이 겨울잠을 쿨쿨 자요" },
      { t: "'씽씽' 자전거", s: "바람 가르며 씽씽 달려가요" },
      { t: "'싱글벙글' 미소", s: "엄마 얼굴 보고 싱글벙글 웃어요" },
      { t: "뿌듯한 쉬는 날", s: "좋아하는 흉내 내는 말 동시 낭송", rest: true },
      { t: "소리 흉내 카드 매칭", s: "동물 그림과 울음소리 연결하기" },
      { t: "동화책 속 말맛 찾기", s: "재미난 흉내 내는 말에 형광펜 칠하기" },
      { t: "음악 듣고 표현하기", s: "빠른 음악엔 쿵쾅, 느린 음악엔 살랑" },
      { t: "의성어 말풍선 달기", s: "그림에 멍멍, 야옹 말풍선 그리기" },
      { t: "의태어 보물 쪽지", s: "살금살금 걸어가 보물 찾기" },
      { t: "흉내 내는 말 시 짓기", s: "엄마랑 둘이 짧은 세 줄 시 짓기" },
      { t: "신나는 쉬는 날", s: "자연의 소리 바람 소리 귀 기울이기", rest: true },
      { t: "말맛 마스터 파티", s: "제일 좋아하는 표현 5개 뽐내기" },
      { t: "9단계 표현 마스터!", s: "풍부한 어휘로 말맛을 느끼는 아이!", goal: true },
    ],
    10: [
      { t: "동화책 표지 읽기", s: "그림책 제목을 아이가 소리 내어 읽기" },
      { t: "주인공 이름 부르기", s: "책 속 주인공 이름을 직접 읽어보기" },
      { t: "첫 번째 줄 혼자 읽기", s: "옛날 옛적에... 첫 문장 스스로" },
      { t: "그림 보며 문장 짚기", s: "손가락으로 글자 짚어가며 낭독" },
      { t: "말풍선 대사 읽기", s: "만화나 동화 말풍선 목소리 연기" },
      { t: "다음 문장 이어 읽기", s: "엄마 한 줄, 아이 한 줄 주고받기" },
      { t: "달콤한 쉬는 날", s: "편안하게 누워 책 한 권 완독하기", rest: true },
      { t: "의성어 문장 실감 나게", s: "쿵쾅쿵쾅 괴물이 나타났어요!" },
      { t: "엄마에게 동화 읽어주기", s: "아이가 엄마에게 그림책 낭독하기" },
      { t: "아빠에게 동화 읽어주기", s: "퇴근한 아빠에게 책 읽어주며 감동" },
      { t: "책 속 가장 긴 단어 찾기", s: "글자 수 많은 멋진 단어 발견하기" },
      { t: "동화 퀴즈 맞히기", s: "책 내용으로 엄마랑 퀴즈 놀이" },
      { t: "책갈피 손수 만들기", s: "나만의 예쁜 독서 책갈피 만들기" },
      { t: "즐거운 쉬는 날", s: "동네 서점 가서 직접 책 고르기", rest: true },
      { t: "내 생각 한마디 말하기", s: "이 책에서 누가 제일 착했을까?" },
      { t: "가족에게 짧은 편지 쓰기", s: "'엄마 사랑해요' 정성껏 쓰기" },
      { t: "아빠에게 응원 편지", s: "'아빠 힘내세요' 편지 전달하기" },
      { t: "친구에게 카드 보내기", s: "'친구야 같이 놀자' 카드 쓰기" },
      { t: "나의 첫 일기 한 줄", s: "오늘 동물원 가서 코끼리를 봤다" },
      { t: "좋아하는 동화 문장 따라쓰기", s: "명대사 공책에 예쁘게 적기" },
      { t: "뿌듯한 쉬는 날", s: "지금까지 읽은 책 탑 쌓아보기", rest: true },
      { t: "동화책 구연동화 놀이", s: "목소리 바꿔가며 실감 나게 낭독" },
      { t: "책 제목 맞히기 퀴즈", s: "엄마가 줄거리 말하면 제목 찾기" },
      { t: "할머니 할아버지께 편지", s: "'할머니 건강하세요' 손편지" },
      { t: "그림일기 완성하기", s: "그림 그리고 아래에 세 문장 쓰기" },
      { t: "도서관 독서왕 도전", s: "스스로 책 대출증으로 빌려보기" },
      { t: "나만의 미니 동화책 만들기", s: "종이 묶어 내가 작가 되어보기" },
      { t: "신나는 쉬는 날", s: "온 가족 독서 파티와 맛있는 간식", rest: true },
      { t: "동화 완독의 기적", s: "처음부터 끝까지 혼자서 한 권 읽기" },
      { t: "10단계 완전 독립 한글 졸업!", s: "축하합니다! 스스로 책을 읽고 마음을 전하는 멋진 어린이!", goal: true },
    ],
  }[stage] || [];

  return base;
};

// Generate STAGE_MISSIONS for 1~10
export const STAGE_MISSIONS: Record<StageId, Mission[]> = {
  1: createStageMissions(1),
  2: createStageMissions(2),
  3: createStageMissions(3),
  4: createStageMissions(4),
  5: createStageMissions(5),
  6: createStageMissions(6),
  7: createStageMissions(7),
  8: createStageMissions(8),
  9: createStageMissions(9),
  10: createStageMissions(10),
};

const createStageWeeks = (stage: StageId): Week[] => {
  const titles = {
    1: ['자음 모양 친구 (ㄱ~ㅁ)', '자음 모험 (ㅂ~ㅈ)', '씩씩한 자음 (ㅊ~ㅎ)', '몸과 놀이 복습', '14개 자음 마스터'],
    2: ['입이 뻥! 모음 (ㅏ~ㅕ)', '위아래 모음 (ㅗ~ㅠ)', '미소 모음 (ㅡ, ㅣ)', '모음 노래와 게임', '10개 모음 정복'],
    3: ['가나다라 소리 뽀뽀', '바~하 소리 합체', 'ㅗ, ㅜ, ㅣ 소리 기차', '가갸표 블록 놀이', '기본 140자 원리 마스터'],
    4: ['동물 친구들 낱말', '달콤 과일 채소', '탈것과 일상 물건', '그림 단어 매칭 게임', '어휘 단어 정복'],
    5: ['입 닫는 ㅁ, ㅇ 받침', '혀끝 닿는 ㄹ, ㄱ 받침', '사랑해 고마워 단어', '동화책 첫 줄 읽기', '대망의 엄마 읽기'],
    6: ['애, 에 소리 탐험', '와, 워 소리 결합', '위, 의 신기한 모음', '이중모음 동화 속으로', '이중모음 완전 정복'],
    7: ['까, 따 씩씩한 소리', '빠, 싸, 짜 힘찬 소리', '동요 속 쌍자음 찾기', '쌍자음 낱말 퍼레이드', '쌍자음 마스터'],
    8: ['ㅂ, ㅅ 받침의 비밀', '꽃, 밭, 솥 받침 탐험', '받침 소리 가족 묶기', '간판 속 받침 척척', '복합 받침 정복'],
    9: ['반짝반짝 살랑살랑', '퐁당퐁당 쿵쾅쿵쾅', '알록달록 흉내말', '의성어 의태어 시 짓기', '말맛 표현 마스터'],
    10: ['동화책 표지와 첫 줄', '엄마에게 읽어주는 동화', '가족에게 쓰는 손편지', '나의 첫 그림일기', '독립 독서 한글 졸업'],
  }[stage] || ['1주차', '2주차', '3주차', '4주차', '완주'];

  return [
    { n: 'WEEK 1', t: titles[0], from: 1, to: 7 },
    { n: 'WEEK 2', t: titles[1], from: 8, to: 14 },
    { n: 'WEEK 3', t: titles[2], from: 15, to: 21 },
    { n: 'WEEK 4', t: titles[3], from: 22, to: 28 },
    { n: 'D+29~30', t: titles[4], from: 29, to: 30 },
  ];
};

export const STAGE_WEEKS: Record<StageId, Week[]> = {
  1: createStageWeeks(1),
  2: createStageWeeks(2),
  3: createStageWeeks(3),
  4: createStageWeeks(4),
  5: createStageWeeks(5),
  6: createStageWeeks(6),
  7: createStageWeeks(7),
  8: createStageWeeks(8),
  9: createStageWeeks(9),
  10: createStageWeeks(10),
};

export const MISSIONS: Mission[] = STAGE_MISSIONS[1];
export const WEEKS: Week[] = STAGE_WEEKS[1];

export const FRIENDS: AnimalFriend[] = [
  { id: 'bear', e: '🐻', name: '곰돌이', say: '우와! 오늘도 한 걸음 나아갔어!' },
  { id: 'bunny', e: '🐰', name: '토끼', say: '깡총깡총! 한글이 너무 재밌지?' },
  { id: 'dino', e: '🦖', name: '아기공룡', say: '크앙! 씩씩하게 글자 읽는 네가 최고야!' },
  { id: 'cat', e: '🐱', name: '야옹이', say: '야옹~ 오늘도 참 잘했어!' },
  { id: 'puppy', e: '🐶', name: '멍멍이', say: '멍멍! 엄마랑 함께하는 네가 제일 멋져!' },
  { id: 'uni', e: '🦄', name: '유니콘', say: '반짝반짝 별처럼 빛나는 우리 아이!' },
  { id: 'princess', e: '👸', name: '공주님', say: '예쁜 마음으로 한글을 배우는 네가 가장 눈부셔!' },
  { id: 'prince', e: '🤴', name: '왕자님', say: '용기 있고 씩씩하게 글자를 읽는 네가 진짜 멋져!' },
];

export const THEMES: BoardTheme[] = [
  {
    id: 'home',
    name: '따뜻한 우리집',
    sub: '햇살 가득 거실',
    bg: 'linear-gradient(135deg, #fdf6ec 0%, #fbe8d4 100%)',
    cardBg: '#fff9f2',
    deco: ['☀️', '🌷', '☁️', '🏠', '🌼', '☁️'],
    pack: ['⭐', '🍓', '🌈', '🍦', '🌻', '🎈', '🧸', '🍪'],
  },
  {
    id: 'sea',
    name: '바닷속 탐험',
    sub: '알록달록 물고기',
    bg: 'linear-gradient(135deg, #e3f3fb 0%, #cbe7f7 100%)',
    cardBg: '#f2f9fe',
    deco: ['🐠', '🫧', '🐚', '🐙', '🫧', '🌊'],
    pack: ['🐳', '🐠', '🐙', '🦀', '🐬', '🐚', '🦭', '🪼'],
  },
  {
    id: 'space',
    name: '우주 여행',
    sub: '반짝반짝 은하수',
    bg: 'linear-gradient(135deg, #323254 0%, #1d1d36 100%)',
    cardBg: '#2a2a47',
    deco: ['⭐', '🪐', '🌙', '✨', '⭐', '☄️'],
    pack: ['🚀', '🪐', '🌙', '⭐', '👽', '🛸', '☄️', '🌍'],
  },
  {
    id: 'forest',
    name: '숲속 친구들',
    sub: '피크닉 나들이',
    bg: 'linear-gradient(135deg, #eef7e4 0%, #dbeec8 100%)',
    cardBg: '#f7fcf2',
    deco: ['🌳', '🍄', '🦋', '🌿', '🐝', '🌲'],
    pack: ['🦊', '🦔', '🐿️', '🍄', '🦋', '🐞', '🌳', '🍀'],
  },
  {
    id: 'dino',
    name: '공룡 나라',
    sub: '쿵쿵 화산섬',
    bg: 'linear-gradient(135deg, #fbf2dc 0%, #f3e1b7 100%)',
    cardBg: '#fffcf5',
    deco: ['🌋', '🌿', '🦴', '🥚', '🌴', '🌿'],
    pack: ['🦖', '🦕', '🥚', '🌋', '🦴', '🌴', '🐊', '🐢'],
  },
  {
    id: 'candy',
    name: '달콤 과자집',
    sub: '사탕과 마카롱',
    bg: 'linear-gradient(135deg, #fdefec 0%, #f9dbe8 100%)',
    cardBg: '#fff6fa',
    deco: ['🍭', '🧁', '🍬', '🍩', '🎀', '🍰'],
    pack: ['🍭', '🧁', '🍩', '🍰', '🍬', '🍫', '🎂', '🍡'],
  },
];

export const WISHES = [
  '놀이공원 가서 회전목마 타기',
  '원하는 장난감 하나 고르기',
  '하루 종일 엄마랑 키즈카페 놀기',
  '치킨 피자 파티 열기',
  '잠들 때까지 재미있는 책 10권 읽어주기',
  '아이스크림 두 숟가락 크게 먹기',
  '주말에 동물원 가서 기린 보기',
  '엄마랑 딸기 케이크 만들기',
];

export const RARE_STICKERS = ['👑', '💎', '🌟', '🏆', '🦄', '💖'];

// Full Rich Tracing Library: Consonants, Vowels, Animals, Foods, Family
export const TRACING_ITEMS: TracingItem[] = [
  // 1. Consonants (14자)
  { id: 'c_g', category: 'consonant', label: 'ㄱ', soundText: '기린의 기역', phonetic: '그', meaning: '기린, 고양이', emoji: '🦒', strokesHint: '왼쪽에서 오른쪽으로, 아래로 꺾어요' },
  { id: 'c_n', category: 'consonant', label: 'ㄴ', soundText: '나비의 니은', phonetic: '느', meaning: '나비, 나무', emoji: '🦋', strokesHint: '위에서 아래로, 오른쪽으로 꺾어요' },
  { id: 'c_d', category: 'consonant', label: 'ㄷ', soundText: '다람쥐의 디귿', phonetic: '드', meaning: '다람쥐, 달팽이', emoji: '🐿️', strokesHint: '위 가로선 긋고, 니은처럼 이어요' },
  { id: 'c_r', category: 'consonant', label: 'ㄹ', soundText: '라면의 리을', phonetic: '르', meaning: '라면, 로봇', emoji: '🤖', strokesHint: '기역 그리고, 가로 긋고, 니은을 붙여요' },
  { id: 'c_m', category: 'consonant', label: 'ㅁ', soundText: '모자의 미음', phonetic: '므', meaning: '모자, 물고기', emoji: '🐟', strokesHint: '네모 모양으로 닫아주세요' },
  { id: 'c_b', category: 'consonant', label: 'ㅂ', soundText: '바나나의 비읍', phonetic: '브', meaning: '바나나, 비행기', emoji: '🍌', strokesHint: '기둥 두 개 세우고 창문 닫기' },
  { id: 'c_s', category: 'consonant', label: 'ㅅ', soundText: '사자의 시옷', phonetic: '스', meaning: '사자, 수박', emoji: '🦁', strokesHint: 'ㅅ 모양 텐트를 세워요' },
  { id: 'c_ng', category: 'consonant', label: 'ㅇ', soundText: '오리의 이응', phonetic: '으', meaning: '아기, 오리', emoji: '🦆', strokesHint: '동글동글 동그라미를 그려요' },
  { id: 'c_j', category: 'consonant', label: 'ㅈ', soundText: '자동차의 지읒', phonetic: '즈', meaning: '자동차, 주스', emoji: '🚗', strokesHint: '지붕 얹고 시옷 텐트 치기' },
  { id: 'c_ch', category: 'consonant', label: 'ㅊ', soundText: '치타의 치읓', phonetic: '츠', meaning: '치마, 참새', emoji: '🐆', strokesHint: '깃발 꽂고 지읒 지붕 만들기' },
  { id: 'c_k', category: 'consonant', label: 'ㅋ', soundText: '코끼리의 키읔', phonetic: '크', meaning: '코끼리, 카메라', emoji: '🐘', strokesHint: '기역 그리고 중간에 선 하나 슉' },
  { id: 'c_t', category: 'consonant', label: 'ㅌ', soundText: '토끼의 티읕', phonetic: '트', meaning: '토끼, 타조', emoji: '🐰', strokesHint: '위, 중간, 아래 세 개의 기찻길' },
  { id: 'c_p', category: 'consonant', label: 'ㅍ', soundText: '포도의 피읖', phonetic: '프', meaning: '포도, 피아노', emoji: '🍇', strokesHint: '지붕 얹고 두 다리 내리고 바닥 닫기' },
  { id: 'c_h', category: 'consonant', label: 'ㅎ', soundText: '하마의 히읗', phonetic: '흐', meaning: '하마, 호랑이', emoji: '🐯', strokesHint: '모자 쓰고 동그라미 얼굴 그리기' },

  // 2. Vowels (10자)
  { id: 'v_a', category: 'vowel', label: 'ㅏ', soundText: '입을 크게 아', phonetic: '아', meaning: '아이, 사자', emoji: '🦁', strokesHint: '세로 기둥 내리고 오른쪽으로 쏙' },
  { id: 'v_ya', category: 'vowel', label: 'ㅑ', soundText: '깜짝 놀라 야', phonetic: '야', meaning: '야구, 야옹이', emoji: '🐱', strokesHint: '세로 기둥 내리고 오른쪽 점 두 개' },
  { id: 'v_eo', category: 'vowel', label: 'ㅓ', soundText: '신기하다 어', phonetic: '어', meaning: '어린이, 어머니', emoji: '🧒', strokesHint: '왼쪽에서 기둥으로 이어주기' },
  { id: 'v_yeo', category: 'vowel', label: 'ㅕ', soundText: '반갑게 여', phonetic: '여', meaning: '여우, 여행', emoji: '🦊', strokesHint: '왼쪽 점 두 개와 세로 기둥' },
  { id: 'v_o', category: 'vowel', label: 'ㅗ', soundText: '하늘 보고 오', phonetic: '오', meaning: '오리, 오이', emoji: '🦆', strokesHint: '위에서 내려와 가로로 받쳐주기' },
  { id: 'v_yo', category: 'vowel', label: 'ㅛ', soundText: '반갑다고 요', phonetic: '요', meaning: '요술, 요요', emoji: '🪄', strokesHint: '두 뿔 세우고 가로로 받쳐주기' },
  { id: 'v_u', category: 'vowel', label: 'ㅜ', soundText: '입술 쭉 우', phonetic: '우', meaning: '우산, 우유', emoji: '☂️', strokesHint: '가로선 긋고 아래로 쑥 내리기' },
  { id: 'v_yu', category: 'vowel', label: 'ㅠ', soundText: '슬프다 유', phonetic: '유', meaning: '유리, 유치원', emoji: '🏫', strokesHint: '가로선 긋고 아래로 두 다리 쏙' },
  { id: 'v_eu', category: 'vowel', label: 'ㅡ', soundText: '옆으로 당겨 으', phonetic: '으', meaning: '으뜸, 으쓱', emoji: '👍', strokesHint: '왼쪽에서 오른쪽으로 일직선 긋기' },
  { id: 'v_i', category: 'vowel', label: 'ㅣ', soundText: '활짝 웃으며 이', phonetic: '이', meaning: '이름, 인형', emoji: '🧸', strokesHint: '위에서 아래로 곧게 내리기' },

  // 2-B. Double Consonants (쌍자음 5종)
  { id: 'dc_gg', category: 'double', label: 'ㄲ', soundText: '힘찬 쌍기역 끄', phonetic: '끄', meaning: '까치, 꼬리, 꿈', emoji: '🪶', strokesHint: '기역 두 개를 나란히 손잡아주세요' },
  { id: 'dc_dd', category: 'double', label: 'ㄸ', soundText: '씩씩한 쌍디귿 뜨', phonetic: '뜨', meaning: '딸기, 떡, 뚜껑', emoji: '🍓', strokesHint: '디귿 두 개가 쿵쿵 만나요' },
  { id: 'dc_bb', category: 'double', label: 'ㅃ', soundText: '신나는 쌍비읍 쁘', phonetic: '쁘', meaning: '뽀뽀, 빵, 뿌리', emoji: '💋', strokesHint: '비읍 두 개가 나란히 방긋' },
  { id: 'dc_ss', category: 'double', label: 'ㅆ', soundText: '시원한 쌍시옷 쓰', phonetic: '쓰', meaning: '씨앗, 쓰레기차, 쌀', emoji: '🌱', strokesHint: '시옷 두 개 텐트가 쏙' },
  { id: 'dc_jj', category: 'double', label: 'ㅉ', soundText: '반짝반짝 쌍지읒 쯔', phonetic: '쯔', meaning: '찌개, 짝꿍, 쪽지', emoji: '✨', strokesHint: '지읒 두 개가 사이좋게 어깨동무' },

  // 2-C. Complex Vowels (복합·이중모음 6종)
  { id: 'cv_ae', category: 'complex_vowel', label: 'ㅐ', soundText: '입을 활짝 애', phonetic: '애', meaning: '개미, 배, 매미', emoji: '🐜', strokesHint: '아이처럼 ㅏ 옆에 ㅣ를 세워요' },
  { id: 'cv_e', category: 'complex_vowel', label: 'ㅔ', soundText: '방긋방긋 에', phonetic: '에', meaning: '베개, 그네, 게', emoji: '🦀', strokesHint: '어이처럼 ㅓ 옆에 ㅣ를 붙여요' },
  { id: 'cv_wa', category: 'complex_vowel', label: 'ㅘ', soundText: '감탄하는 와', phonetic: '와', meaning: '과자, 화분, 왕', emoji: '🍪', strokesHint: 'ㅗ와 ㅏ가 만나 뽀뽀 와!' },
  { id: 'cv_wo', category: 'complex_vowel', label: 'ㅝ', soundText: '놀라워라 워', phonetic: '워', meaning: '원숭이, 워터파크', emoji: '🐵', strokesHint: 'ㅜ와 ㅓ가 만나서 워!' },
  { id: 'cv_ui', category: 'complex_vowel', label: 'ㅢ', soundText: '신기한 소리 의', phonetic: '의', meaning: '의사, 의자, 의미', emoji: '🩺', strokesHint: 'ㅡ 긋고 바로 옆에 ㅣ를 내려요' },
  { id: 'cv_oe', category: 'complex_vowel', label: 'ㅚ', soundText: '동그랗게 외', phonetic: '외', meaning: '외출, 회사, 돼지', emoji: '🐷', strokesHint: 'ㅗ 옆에 ㅣ를 세우면 외!' },

  // 3. Animals (10종)
  { id: 'a_lion', category: 'animal', label: '사자', soundText: '용감한 사자', phonetic: '사-자', meaning: '밀림의 왕 사자', emoji: '🦁', strokesHint: 'ㅅ+ㅏ=사, ㅈ+ㅏ=자' },
  { id: 'a_tiger', category: 'animal', label: '호랑이', soundText: '멋쟁이 호랑이', phonetic: '호-랑-이', meaning: '줄무늬 호랑이', emoji: '🐯', strokesHint: 'ㅎ+ㅗ=호, ㄹ+ㅏ+ㅇ=랑, ㅇ+ㅣ=이' },
  { id: 'a_rabbit', category: 'animal', label: '토끼', soundText: '깡총깡총 토끼', phonetic: '토-끼', meaning: '귀가 긴 토끼', emoji: '🐰', strokesHint: 'ㅌ+ㅗ=토, ㄲ+ㅣ=끼' },
  { id: 'a_elephant', category: 'animal', label: '코끼리', soundText: '코가 손인 코끼리', phonetic: '코-끼-리', meaning: '덩치 큰 코끼리', emoji: '🐘', strokesHint: 'ㅋ+ㅗ=코, ㄲ+ㅣ=끼, ㄹ+ㅣ=리' },
  { id: 'a_butterfly', category: 'animal', label: '나비', soundText: '팔랑팔랑 나비', phonetic: '나-비', meaning: '꽃밭을 나는 나비', emoji: '🦋', strokesHint: 'ㄴ+ㅏ=나, ㅂ+ㅣ=비' },
  { id: 'a_cat', category: 'animal', label: '고양이', soundText: '귀여운 고양이', phonetic: '고-양-이', meaning: '야옹야옹 고양이', emoji: '🐱', strokesHint: 'ㄱ+ㅗ=고, ㅇ+ㅑ+ㅇ=양, ㅇ+ㅣ=이' },
  { id: 'a_dog', category: 'animal', label: '강아지', soundText: '멍멍이 강아지', phonetic: '강-아-지', meaning: '꼬리 치는 강아지', emoji: '🐶', strokesHint: 'ㄱ+ㅏ+ㅇ=강, ㅇ+ㅏ=아, ㅈ+ㅣ=지' },
  { id: 'a_hippo', category: 'animal', label: '하마', soundText: '입 큰 하마', phonetic: '하-마', meaning: '물놀이 하마', emoji: '🦛', strokesHint: 'ㅎ+ㅏ=하, ㅁ+ㅏ=마' },
  { id: 'a_giraffe', category: 'animal', label: '기린', soundText: '키가 큰 기린', phonetic: '기-린', meaning: '목이 긴 기린', emoji: '🦒', strokesHint: 'ㄱ+ㅣ=기, ㄹ+ㅣ+ㄴ=린' },
  { id: 'a_bear', category: 'animal', label: '곰', soundText: '꿀을 좋아하는 곰', phonetic: '곰', meaning: '포근한 아기곰', emoji: '🐻', strokesHint: 'ㄱ+ㅗ+ㅁ=곰' },

  // 4. Fruits & Vegetables (10종)
  { id: 'f_apple', category: 'food', label: '사과', soundText: '새콤달콤 사과', phonetic: '사-과', meaning: '빨간 꿀사과', emoji: '🍎', strokesHint: 'ㅅ+ㅏ=사, ㄱ+ㅘ=과' },
  { id: 'f_banana', category: 'food', label: '바나나', soundText: '달콤한 바나나', phonetic: '바-나-나', meaning: '노란 바나나', emoji: '🍌', strokesHint: 'ㅂ+ㅏ=바, ㄴ+ㅏ=나, ㄴ+ㅏ=나' },
  { id: 'f_grape', category: 'food', label: '포도', soundText: '보라색 포도', phonetic: '포-도', meaning: '알알이 포도', emoji: '🍇', strokesHint: 'ㅍ+ㅗ=포, ㄷ+ㅗ=도' },
  { id: 'f_strawberry', category: 'food', label: '딸기', soundText: '빨간 딸기', phonetic: '딸-기', meaning: '달콤한 딸기', emoji: '🍓', strokesHint: 'ㄸ+ㅏ+ㄹ=딸, ㄱ+ㅣ=기' },
  { id: 'f_watermelon', category: 'food', label: '수박', soundText: '시원한 수박', phonetic: '수-박', meaning: '줄무늬 수박', emoji: '🍉', strokesHint: 'ㅅ+ㅜ=수, ㅂ+ㅏ+ㄱ=박' },
  { id: 'f_carrot', category: 'food', label: '당근', soundText: '주황색 당근', phonetic: '당-근', meaning: '토끼가 좋아하는 당근', emoji: '🥕', strokesHint: 'ㄷ+ㅏ+ㅇ=당, ㄱ+ㅡ+ㄴ=근' },
  { id: 'f_cucumber', category: 'food', label: '오이', soundText: '아삭아삭 오이', phonetic: '오-이', meaning: '초록빛 오이', emoji: '🥒', strokesHint: 'ㅇ+ㅗ=오, ㅇ+ㅣ=이' },
  { id: 'f_tomato', category: 'food', label: '토마토', soundText: '탱글탱글 토마토', phonetic: '토-마-토', meaning: '빨간 토마토', emoji: '🍅', strokesHint: 'ㅌ+ㅗ=토, ㅁ+ㅏ=마, ㅌ+ㅗ=토' },
  { id: 'f_corn', category: 'food', label: '옥수수', soundText: '고소한 옥수수', phonetic: '옥-수-수', meaning: '노란 옥수수', emoji: '🌽', strokesHint: 'ㅇ+ㅗ+ㄱ=옥, ㅅ+ㅜ=수, ㅅ+ㅜ=수' },
  { id: 'f_sweetpotato', category: 'food', label: '고구마', soundText: '달콤한 고구마', phonetic: '고-구-마', meaning: '따끈따끈 고구마', emoji: '🍠', strokesHint: 'ㄱ+ㅗ=고, ㄱ+ㅜ=구, ㅁ+ㅏ=마' },

  // 5. Family & Daily Life (10종)
  { id: 'w_mom', category: 'family', label: '엄마', soundText: '세상에서 제일 사랑하는 엄마', phonetic: '엄-마', meaning: '가장 소중한 엄마', emoji: '👩‍👧', strokesHint: 'ㅇ+ㅓ+ㅁ=엄, ㅁ+ㅏ=마' },
  { id: 'w_dad', category: 'family', label: '아빠', soundText: '든든하고 멋진 우리 아빠', phonetic: '아-빠', meaning: '사랑하는 아빠', emoji: '👨‍👦', strokesHint: 'ㅇ+ㅏ=아, ㅃ+ㅏ=빠' },
  { id: 'w_love', category: 'family', label: '사랑', soundText: '엄마랑 아기랑 사랑해', phonetic: '사-랑', meaning: '따뜻한 마음', emoji: '❤️', strokesHint: 'ㅅ+ㅏ=사, ㄹ+ㅏ+ㅇ=랑' },
  { id: 'w_milk', category: 'family', label: '우유', soundText: '고소하고 하얀 우유', phonetic: '우-유', meaning: '키가 쑥쑥 우유', emoji: '🥛', strokesHint: 'ㅇ+ㅜ=우, ㅇ+ㅠ=유' },
  { id: 'w_tree', category: 'family', label: '나무', soundText: '싱그러운 초록 나무', phonetic: '나-무', meaning: '푸른 나무', emoji: '🌳', strokesHint: 'ㄴ+ㅏ=나, ㅁ+ㅜ=무' },
  { id: 'w_car', category: 'family', label: '자동차', soundText: '바퀴 굴러가는 자동차', phonetic: '자-동-차', meaning: '씽씽 달리는 자동차', emoji: '🚗', strokesHint: 'ㅈ+ㅏ=자, ㄷ+ㅗ+ㅇ=동, ㅊ+ㅏ=차' },
  { id: 'w_airplane', category: 'family', label: '비행기', soundText: '하늘 높이 나는 비행기', phonetic: '비-행-기', meaning: '날아가는 비행기', emoji: '✈️', strokesHint: 'ㅂ+ㅣ=비, ㅎ+ㅐ+ㅇ=행, ㄱ+ㅣ=기' },
  { id: 'w_hat', category: 'family', label: '모자', soundText: '머리에 쏙 모자', phonetic: '모-자', meaning: '예쁜 모자', emoji: '👒', strokesHint: 'ㅁ+ㅗ=모, ㅈ+ㅏ=자' },
  { id: 'w_sea', category: 'family', label: '바다', soundText: '파도가 치는 넓은 바다', phonetic: '바-다', meaning: '푸른 바다', emoji: '🌊', strokesHint: 'ㅂ+ㅏ=바, ㄷ+ㅏ=다' },
  { id: 'w_gift', category: 'family', label: '선물', soundText: '기분 좋은 예쁜 선물', phonetic: '선-물', meaning: '두근두근 선물', emoji: '🎁', strokesHint: 'ㅅ+ㅓ+ㄴ=선, ㅁ+ㅜ+ㄹ=물' },
];

export const DOODLE_STAMPS = ['⭐', '🍓', '🌈', '🍦', '💖', '🐻', '🐰', '🦖', '🐱', '🌸', '🚗', '🍭', '🦋', '🎈', '🍎', '🌻'];

export const CRAYON_PALETTE = [
  { name: '딸기레드', color: '#e63946' },
  { name: '복숭아코랄', color: '#f26a54' },
  { name: '감귤오렌지', color: '#f77f00' },
  { name: '해님옐로우', color: '#fcbf49' },
  { name: '새싹그린', color: '#57cc99' },
  { name: '숲속초록', color: '#2a9d8f' },
  { name: '민트소다', color: '#72efdd' },
  { name: '하늘블루', color: '#457b9d' },
  { name: '바다딥블루', color: '#1d3557' },
  { name: '라벤더퍼플', color: '#a06cd5' },
  { name: '포도퍼플', color: '#7209b7' },
  { name: '달콤핑크', color: '#f72585' },
  { name: '초코브라운', color: '#7f4f24' },
  { name: '크레파스먹색', color: '#1b1917' },
];

// Pet Tamagotchi Growth Levels (Scales up to Lv. 10,000 with rich milestones)
export const MAX_PET_LEVEL = 10000;

export const PET_MILESTONE_STAGES = [
  { level: 1, title: '알 / 아기 요람', eggEmoji: '🥚', reqExp: 0, say: '안녕! 난 알 속에서 깨어날 준비 중이야!' },
  { level: 2, title: '아장아장 아기 새싹', eggEmoji: '🐣', reqExp: 40, say: '엄마 목소리 듣고 태어났어! 옹알옹알~' },
  { level: 10, title: '말문 트인 아기 요정', eggEmoji: '🧚', reqExp: 400, say: '글자 열매 먹고 쑥쑥 자라는 중이야!' },
  { level: 30, title: '호기심쟁이 어린이', eggEmoji: '🎒', reqExp: 1200, say: '글자 하나씩 정복하는 재미에 푹 빠졌어!' },
  { level: 50, title: '용감한 한글 탐험대장', eggEmoji: '🧭', reqExp: 2000, say: '어떤 어려운 글자도 씩씩하게 읽어내!' },
  { level: 100, title: '100레벨 돌파 한글 영웅', eggEmoji: '🚀', reqExp: 4000, say: '100레벨 달성! 이제 혼자서도 척척박사!' },
  { level: 200, title: '박학다식 척척박사', eggEmoji: '🎓', reqExp: 8000, say: '동화책 한 권을 막힘없이 술술 읽어요!' },
  { level: 500, title: '의젓한 한글 대장군', eggEmoji: '🛡️', reqExp: 20000, say: '온 나라에 한글의 멋짐을 알릴 테야!' },
  { level: 1000, title: '대우주 한글 마스터', eggEmoji: '🌟', reqExp: 40000, say: '빛나는 황금 왕관을 썼어요! 우리 아이 최고!' },
  { level: 3000, title: '세종대왕 명예 수호자', eggEmoji: '🎖️', reqExp: 120000, say: '한글의 훈민정음 정신을 이어받았어요!' },
  { level: 5000, title: '은하계 한글 대마법사', eggEmoji: '🔮', reqExp: 200000, say: '글자로 세상을 따뜻하게 만드는 마법!' },
  { level: 7000, title: '천상계 한글 지존', eggEmoji: '🏆', reqExp: 280000, say: '하늘에서도 감탄하는 독보적인 실력!' },
  { level: 10000, title: '전설의 만렙 한글 천황 (Lv.10,000 달성!)', eggEmoji: '👑', reqExp: 400000, say: '와아! 10,000 최고레벨 정복! 평생 소장 상장 수여!' },
];

export const PET_LEVELS = PET_MILESTONE_STAGES;

export function getPetLevelData(totalExp: number): {
  level: number;
  stageName: string;
  reqExp: number;
  nextReqExp: number;
  progressPercent: number;
  isMaxLevel: boolean;
} {
  // Smooth progressive curve up to 10,000 levels:
  // Each level requires 40 EXP
  const rawLevel = Math.floor(Math.max(0, totalExp) / 40) + 1;
  const level = Math.min(MAX_PET_LEVEL, Math.max(1, rawLevel));
  const isMaxLevel = level >= MAX_PET_LEVEL;

  const reqExp = (level - 1) * 40;
  const nextReqExp = isMaxLevel ? reqExp : level * 40;
  const expInLevel = totalExp - reqExp;
  const progressPercent = isMaxLevel ? 100 : Math.min(100, Math.max(5, (expInLevel / 40) * 100));

  // Determine stage title based on milestone tier
  let stageName = '알 / 아기 요람 🥚';
  if (level >= 10000) stageName = '전설의 만렙 한글 천황 👑✨';
  else if (level >= 7000) stageName = '천상계 한글 지존 🏆';
  else if (level >= 5000) stageName = '은하계 한글 대마법사 🔮';
  else if (level >= 3000) stageName = '세종대왕 명예 수호자 🎖️';
  else if (level >= 1000) stageName = '대우주 한글 마스터 🌟';
  else if (level >= 500) stageName = '의젓한 한글 대장군 🛡️';
  else if (level >= 200) stageName = '박학다식 척척박사 🎓';
  else if (level >= 100) stageName = '100레벨 돌파 한글 영웅 🚀';
  else if (level >= 50) stageName = '용감한 한글 탐험대장 🧭';
  else if (level >= 30) stageName = '호기심쟁이 어린이 🎒';
  else if (level >= 10) stageName = '말문 트인 아기 요정 🧚';
  else if (level >= 2) stageName = '아장아장 새싹 🐣';

  return { level, stageName, reqExp, nextReqExp, progressPercent, isMaxLevel };
}

// Sound & letter quiz items for the Pet berry game
export const PET_QUIZZES = [
  { question: "'사자'의 첫 글자는 무엇일까요?", options: ['ㅅ', 'ㄴ', 'ㄷ'], correct: 0, answerText: '시옷', sound: '사자의 시옷!' },
  { question: "'기린'의 첫 글자는 무엇일까요?", options: ['ㅁ', 'ㄱ', 'ㅂ'], correct: 1, answerText: '기역', sound: '기린의 기역!' },
  { question: "'나비'의 첫 글자는 무엇일까요?", options: ['ㄷ', 'ㄴ', 'ㅈ'], correct: 1, answerText: '니은', sound: '나비의 니은!' },
  { question: "'엄마'의 첫 글자는 무엇일까요?", options: ['ㅇ', 'ㅎ', 'ㄹ'], correct: 0, answerText: '이응', sound: '엄마의 이응!' },
  { question: "'토끼'의 첫 글자는 무엇일까요?", options: ['ㅂ', 'ㅌ', 'ㅋ'], correct: 1, answerText: '티읕', sound: '토끼의 티읕!' },
  { question: "'포도'의 첫 글자는 무엇일까요?", options: ['ㅍ', 'ㅁ', 'ㅊ'], correct: 0, answerText: '피읖', sound: '포도의 피읖!' },
];

export const INITIAL_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'post-1',
    author: '시우맘',
    childAge: '5세',
    category: 'success',
    title: 'D+8 오늘 "아" 소리 크게 외치면서 둘이 빵 터졌어요 ㅋㅋㅋ',
    content: '요즘 한글 학습지 매일 억지로 들이밀다 아이가 도망가서 엄마표 포기할까 했거든요.\n여기서 입 크게 벌리고 사자 소리 내기 미션 해봤더니 꺄르르 웃으면서 10번 넘게 하네요!\n역시 5살은 공부가 아니라 몸으로 놀아주는 게 정답인가 봐요. 오늘 스티커 하나 콕 붙여줬습니다 ㅎㅎ 다들 파이팅!',
    date: '방금 전',
    likes: 18,
    cheeredByMe: true,
    cheerType: 'heart',
    password: '1234',
    tags: ['5살한글', '소리놀이', 'D+8', '성공'],
    pinned: true,
    comments: [
      { id: 'c-1', author: '하윤이네', content: '저희 아이도 사자 흉내 엄청 좋아해요! 엄마 표정이 망가질수록 글자를 더 잘 보더라구요 ㅋㅋㅋ', date: '5분 전', password: '1234' },
      { id: 'c-2', author: '준서맘', content: '맞아요 ㅠㅠ 5살은 웃음이 먼저 터져야 집중하더라구요. 공감 1000% 누르고 가요!', date: '3분 전', password: '1234' },
    ],
  },
  {
    id: 'post-2',
    author: '윤아맘',
    childAge: '6세',
    category: 'tip',
    title: '💡 연필 잡기 힘들어하는 아이, 이렇게 하니까 바로 해결됐어요!',
    content: '아이 손가락 소근육은 아직 얇은 연필 쥐고 글씨 쓰기가 부담스러울 때가 많아요.\n억지로 연필 쥐게 하면 손 아프다고 글자 자체를 싫어하게 되더라구요.\n1) 낙서판에 두꺼운 크레파스나 손가락으로 크게 쓰기\n2) 등 뒤에 손가락으로 글자 써서 맞추는 간지럼 놀이\n3) 집 안에서 의자 다리(ㄴ), 침대 모서리(ㄱ) 찾아보기\n글자 모양을 눈과 몸으로 먼저 익히면 나중에 연필은 금방 잡아요! 조급해하지 마세요 엄마들 화이팅 💕',
    date: '2시간 전',
    likes: 34,
    cheeredByMe: false,
    password: '1234',
    tags: ['엄마표꿀팁', '소근육놀이', '스트레스없음'],
    pinned: true,
    comments: [
      { id: 'c-3', author: '도현맘', content: '안 그래도 오늘 연필 던져서 속상했는데... 제 욕심이었네요. 다시 손가락 놀이부터 할게요 감사해요!', date: '1시간 전', password: '1234' },
    ],
  },
  {
    id: 'post-3',
    author: '지안맘',
    childAge: '5세',
    category: 'doodle',
    title: '🎨 낙서보드에서 "엄마" 따라그리고 하트 붙여줬어요 ㅠㅠ 감동',
    content: '방금 낙서 보드에서 글자 따라쓰기 켜줬는데, \'엄마\' 글자를 삐뚤빼뚤 그리고 나서 하트 스티커를 콩콩 찍어주더라구요.\n"엄마 내가 엄마 이름 썼어!" 하는데 눈물 날 뻔했어요.\n우리 아이 첫 글씨 소중하게 커뮤니티에 남겨봅니다. 다들 오늘 아이에게 꼭 사랑한다고 안아주세요!',
    date: '4시간 전',
    likes: 27,
    cheeredByMe: false,
    password: '1234',
    tags: ['낙서보드', '엄마쓰기', '첫글자', '감동'],
    comments: [
      { id: 'c-4', author: '서우맘', content: '우와 글씨에서 사랑이 묻어나요! 진짜 감동 그 자체네요 ㅠㅠ 축하드려요!', date: '2시간 전', password: '1234' },
    ],
  },
];

export const MOM_GUIDE_ARTICLES = [
  {
    title: '1. 5~7세 한글, 왜 "하루 10분"이어야 할까요?',
    summary: '유아기 아이의 집중력은 최대 10~15분입니다. 공부방 분위기보다는 간식 먹으며 놀이하듯 끝내는 것이 내일을 기대하게 만듭니다.',
    tips: [
      '타이머를 10분에 맞추고, 종이 울리면 아이가 더 하자고 해도 "내일 또 하자!" 하고 기분 좋게 멈춰주세요.',
      '글자를 외우게 하지 말고, 모양의 특징(뾰족한 기역, 네모난 미음)을 말로 표현해보게 하세요.',
      '틀렸을 때 "아니지!" 대신 "오, 그렇게도 보이네? 다시 한번 볼까?"로 반응해주세요.',
    ],
  },
  {
    title: '2. 아이가 한글 카드를 보기 싫다고 도망칠 때',
    summary: '거부는 정상적인 발달 과정입니다. 이럴 때는 글자를 감추고 엄마의 몸이나 일상 사물로 우회하세요.',
    tips: [
      '그날은 진도표나 카드를 접어두고 쉬는 날(그림책만 읽기)로 전환하세요.',
      '등 뒤에 손가락으로 글자 그리고 무슨 글자인지 맞추는 간지럼 게임을 해보세요.',
      '아이 이름표를 인형이나 장난감에 붙여주는 역할놀이로 유도해보세요.',
    ],
  },
  {
    title: '3. 30일 뒤 "엄마" 읽기가 기적인 이유',
    summary: '단순히 글자를 아는 것을 넘어, "내가 엄마라는 글자를 읽을 수 있다"는 성취감은 아이의 자존감과 독서 흥미를 평생 좌우합니다.',
    tips: [
      '30일 체크리스트를 다 채웠을 때 약속했던 소원권을 진심을 다해 들어주세요.',
      '온 가족 앞에서 "우리 아이가 오늘 엄마라고 쓴 편지를 읽었어요!" 하고 큰 박수를 보내주세요.',
    ],
  },
];
