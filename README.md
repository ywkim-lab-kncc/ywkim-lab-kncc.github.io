# Youngwook Kim Lab 웹사이트 — 운영 가이드

국립암센터 김영욱 교수 연구실 홈페이지 소스입니다. 사이트 내용은 영어, 이 문서는 관리자용 한국어 안내입니다.

**핵심 원칙: 내용은 `src/_data/` 폴더의 YAML 파일에만 있습니다.** 연구원·논문을 추가하거나 빼려면 해당 파일의 텍스트만 고치면 되고, HTML·CSS는 건드릴 필요가 없습니다. 저장(commit)하면 1–2분 뒤 사이트에 자동 반영됩니다.

| 하고 싶은 일 | 고칠 파일 |
|---|---|
| 연구원 추가 / 졸업 처리 / 삭제 | `src/_data/members.yml` (+ 사진은 `src/assets/img/people/`) |
| People 페이지 단체 사진 | `src/_data/members.yml` 맨 위 `group_photo` (+ 사진은 `src/assets/img/people/`) |
| 논문 추가 | GitHub Actions에서 PMID 입력 (아래 참고), 또는 `src/_data/publications.yml` |
| 연구 분야·Dry/Wet lab 소개 | `src/_data/research.yml` |
| 모집 공고 (Join us 페이지 + 홈 맨 아래 모집 안내) | `src/_data/join.yml` |
| 연구실 이름·주소·연락처·링크 | `src/_data/site.yml` |
| 직위 구분(포닥, 박사과정 등) 추가 | `src/_data/roles.yml` |

---

## 1. 왜 이 방식인가 (검토한 선택지)

| 방식 | 장점 | 단점 | 판단 |
|---|---|---|---|
| Google Sites | 코딩 불필요, 무료 | 논문 목록을 매번 손으로 편집, 디자인·구조 제약, 데이터 재사용 불가 | 아주 소규모면 가능 |
| WordPress | 관리자 화면(GUI) | 서버·플러그인 보안 업데이트를 계속 해야 함, 호스팅 비용 | 관리 부담 큼 |
| Wix / Squarespace | 편리한 편집기 | 월 구독료, 서비스 종속, 논문 데이터 관리 기능 약함 | 비용·종속 |
| **GitHub Pages + 정적 사이트 생성기 (이 사이트)** | 무료, 서버 관리 없음, 모든 변경 이력이 남아 되돌리기 쉬움, 멤버·논문이 구조화된 데이터라 추가/삭제가 한 블록 수정으로 끝남 | 첫 설정에 GitHub 계정 필요, YAML 문법을 조금 익혀야 함 | **채택** |

추가로 넣은 안전장치:

- **자동 검사**: 저장할 때마다 `scripts/validate.mjs`가 데이터 파일을 검사합니다. 들여쓰기 오류, 없는 사진 파일, 중복 논문, 잘못된 날짜 형식 등이 있으면 사이트를 바꾸지 않고(기존 사이트 유지) 한국어 오류 메시지를 보여줍니다.
- **PubMed 자동 입력**: PMID만 넣으면 제목·저자·저널·DOI가 채워집니다.
- **랩 멤버 자동 볼드**: `members.yml`의 `pub_names`에 적은 이름은 논문 저자 목록에서 자동으로 굵게 표시됩니다.
- **상대 경로**: 모든 링크가 상대 경로라서 GitHub Pages, 기관 서버 하위 폴더, 개인 도메인 어디에 올려도 그대로 동작합니다.
- **졸업생 보존**: 멤버를 지우지 않고 `status: alumni`로 바꾸면 Alumni 표로 자동 이동합니다.

---

## 2. 처음 한 번만: 배포하기 (약 15분)

1. **GitHub Organization 만들기** (개인 계정보다 권장): github.com → 우측 상단 `+` → *New organization* → Free. 예: `kimlab-ncc`.
   - 교수님 계정을 Owner로, 관리 담당 연구원 1–2명을 함께 Owner로 넣어 두세요. 담당자가 졸업해도 사이트가 끊기지 않습니다.
2. **저장소 만들기**: 이름을 `kimlab-ncc.github.io`(조직이름.github.io)로 하면 주소가 `https://kimlab-ncc.github.io`가 됩니다. 다른 이름이면 `https://kimlab-ncc.github.io/저장소이름/`.
3. **파일 올리기**: 이 폴더의 내용을 전부 업로드합니다 (`node_modules`, `_site` 폴더는 제외). 웹에서 *Add file → Upload files*로 끌어다 놓아도 됩니다. 단, `.github` 폴더(숨김 폴더)가 꼭 포함되어야 합니다.
4. **Pages 켜기**: 저장소 *Settings → Pages → Build and deployment → Source*를 **GitHub Actions**로 선택.
5. **Actions 쓰기 권한**: *Settings → Actions → General → Workflow permissions*에서 **Read and write permissions** 선택 (PubMed 자동 입력이 파일을 저장하는 데 필요).
6. *Actions* 탭에서 "Build and deploy site"가 초록색 ✓이 되면 완료. `site.yml`의 `url:`을 실제 주소로 바꿔 주세요.

**기관 도메인을 쓰고 싶다면** (예: `kimlab.ncc.re.kr`): 국립암센터 전산팀에 서브도메인 CNAME을 `kimlab-ncc.github.io`로 요청하고, *Settings → Pages → Custom domain*에 입력합니다. 기관 로고 사용이나 외부 호스팅 허용 여부는 홍보팀·전산팀 규정을 먼저 확인하세요.

---

## 3. 일상 업무

### 파일 고치는 방법 (설치 없이 브라우저에서)

GitHub 저장소에서 파일 클릭 → 연필 아이콘(✏️) → 수정 → *Commit changes*. 끝입니다.
여러 파일을 한 번에 고칠 때는 저장소 페이지에서 키보드 `.`(마침표)를 누르면 브라우저용 VS Code가 열립니다.

### 연구원 추가

1. 사진을 정사각형(약 600×600px, 200KB 이하 JPG)으로 준비해 `src/assets/img/people/`에 업로드. 파일명은 영문 소문자, 예: `jlee.jpg`.
2. `members.yml`에서 기존 블록 하나를 복사해 맨 아래에 붙이고 수정:

```yaml
  - id: jlee                      # 영문 소문자·숫자·하이픈, 다른 사람과 겹치지 않게
    name: "Jiwon Lee"
    role: phd                     # postdoc | researcher | phd | integrated | ms | intern
    track: dry                    # dry | wet | both
    status: current
    joined: 2026
    photo: "jlee.jpg"             # 사진이 없으면 "" → 이니셜이 표시됨
    pub_names: ["Lee J", "Lee JW"]  # 논문 저자 표기 → 자동 볼드
    research: "Single-cell analysis of mitochondrial heteroplasmy"
    email: ""
```

- `postdoc`과 `researcher`는 People 페이지의 **Researchers** 목록에 함께 나오고, 포닥은 먼저 나열되며 이름 옆에 **Postdoc** 표시가 자동으로 붙습니다.
- 직위 구분이나 묶는 방식은 `src/_data/roles.yml`에서 바꿀 수 있습니다.

> **YAML 주의 3가지**: ① 들여쓰기는 스페이스(탭 금지), 위 블록과 같은 칸에 맞추기 ② `:` 뒤에 한 칸 띄우기 ③ 글에 `:`나 `#`이 들어가면 큰따옴표로 감싸기.

### 단체 사진 바꾸기

1. 가로 사진(폭 약 2000px, 600KB 이하 JPG)을 `src/assets/img/people/`에 올립니다. 예: `group-2026.jpg`
2. `members.yml` 맨 위를 수정합니다:

```yaml
group_photo:
  show: true
  file: "group-2026.jpg"
  caption: "The Kim Lab, spring 2026"
```

사진은 잘리지 않고 원래 비율대로 표시됩니다. 파일을 지정하기 전에는 "Group photo coming soon" 자리 표시가 나오고, 이 영역을 아예 숨기려면 `show: false`로 바꾸세요.

### 연구원 졸업·퇴직

지우지 말고 두 줄만 바꾸면 Alumni 표로 이동합니다 (논문 저자 볼드도 유지):

```yaml
    status: alumni
    left: 2027
    now: "Postdoc, Harvard Medical School"
```

완전히 빼려면 `- id:`부터 그 사람 블록 끝까지 삭제하세요.

### 논문 추가 — PubMed 자동 (권장)

1. 저장소 *Actions* 탭 → 왼쪽 **Add publication from PubMed** → *Run workflow*
2. PMID 입력 (여러 개는 쉼표로: `40123456, 40123457`)
3. 대표 논문이면 *Mark as selected* 체크 → 홈 화면에도 표시
4. 실행하면 `publications.yml`에 자동 추가되고 사이트가 다시 배포됩니다.

이미 있는 PMID는 건너뜁니다. 기존 항목을 PubMed 정보로 새로 고치려면 *Overwrite*를 체크하세요.
코드·데이터 링크(GitHub, GEO 등)는 자동으로 들어가지 않으니 추가 후 해당 항목에 `code:`, `data:` 줄을 직접 넣으세요.

### 논문 추가 — 직접 입력 (PMID가 없는 학회 발표, 프리프린트 등)

```yaml
- title: "Paper title"
  authors: ["Kim A*", "Lee B*", "Kim Y†"]   # * 공동 1저자, † 교신저자
  journal: "bioRxiv"
  year: 2026
  doi: "10.1101/2026.01.01.000000"          # https://doi.org/ 없이
  type: preprint                             # article | review | preprint | book | conference
  code: "https://github.com/..."
```

순서는 상관없습니다. 연도별 정렬은 자동입니다.

---

## 4. 오류가 났을 때

- *Actions* 탭에서 빨간 ✗가 보이면 클릭 → **Check data files** 단계를 열면 어느 파일 몇 번째 줄이 문제인지 한국어로 나옵니다. 고쳐서 다시 commit 하면 됩니다.
- 오류가 있는 동안에도 **기존 사이트는 그대로 유지**됩니다.
- 되돌리기: 저장소에서 해당 파일 → *History* → 이전 버전을 확인해 복사하거나, 커밋 화면에서 *Revert*.

---

## 5. (선택) 내 컴퓨터에서 미리 보기

Node.js 20 이상 설치 후:

```bash
npm install
npm start          # http://localhost:8080 에서 미리 보기, 저장하면 자동 새로고침
npm run check      # 데이터 검사만
npm run build      # _site/ 폴더에 완성된 사이트 생성 (다른 서버에 올릴 때 이 폴더를 업로드)
python3 scripts/add_publication.py 40123456   # PubMed 자동 입력 (로컬)
```

## 6. 디자인 수정

- **색상**: `src/assets/css/style.css` 맨 위 `:root`의 변수만 바꾸면 사이트 전체에 적용됩니다. 짙은 남색(`--navy`)은 Dry lab, 와인색(`--wine`)은 Wet lab, 황동색(`--brass`)은 강조 표시입니다.
- **홈 화면 원형 그림**: 인간 미토콘드리아 유전체(16,569 bp)의 유전자 지도를 실제 비율대로 그린 것입니다 (`src/_data/mtdna.js`).
- **움직이는 일러스트**: 연구 주제와 Dry/Wet lab 소개마다 하나씩 들어 있습니다. 화면에 보일 때만 움직이고, 기기에서 '동작 줄이기'를 켠 방문자에게는 멈춘 그림으로 보입니다.

  | 이름 | 내용 |
  |---|---|
  | `genomics` | 시퀀싱 read가 참조 유전체에 정렬되고 변이 위치가 드러남 |
  | `mito` | 미토콘드리아 안에서 mtDNA가 돌고 ATP가 빠져나감 |
  | `singlecell` | 흩어진 세포가 UMAP 상에서 클러스터로 모임 |
  | `functional` | 피펫이 웰 플레이트를 따라 이동하며 분석 결과가 채워짐 |
  | `pipeline` | 분석 코드가 실행되고 결과 그래프가 그려짐 (Dry lab) |
  | `cells` | 배양 접시에서 세포가 분열함 (Wet lab) |

  `research.yml`에서 주제마다 `illustration:` 값을 위 이름 중 하나로 바꾸면 그림이 바뀝니다.
- **실제 연구실 영상이나 사진으로 바꾸기**: 파일을 `src/assets/img/research/`에 올리고 해당 주제에 `video: "confocal.mp4"` 또는 `image: "lab.jpg"`를 적으면, 일러스트 대신 그 파일이 표시됩니다. 영상은 MP4(H.264), 소리 없음, 5–15초, 3MB 이하, 가로:세로 16:10을 권장합니다. 영상은 자동 반복 재생됩니다.
- **페이지 구조**: `src/*.njk`, 공통 머리말과 꼬리말은 `src/_includes/base.njk`, 일러스트 원본은 `src/_includes/illustrations/`에 있습니다.

## 7. 공개 전 확인할 것

- [ ] `members.yml`: 교수님 직위(현재 "Associate Professor"로 표기 — NCC 대학원 교수 소개 페이지 기준), 약력, 사진, Google Scholar/ORCID 링크
- [ ] `members.yml`: 예시 멤버 4명을 실제 연구원으로 교체
- [ ] `research.yml`: 연구 소개 문구는 교수님의 공개된 연구 관심 분야를 바탕으로 쓴 **초안**입니다. 교수님 검토 필요
- [ ] `publications.yml`: 교수님 교원 페이지의 논문 목록(2020년까지)으로 채웠습니다. `# verify` 표시 항목은 PubMed Action으로 *Overwrite* 실행해 정확한 정보로 교체하고, 최근 논문을 추가하세요
- [ ] `site.yml`: 연구실 공식 영문 명칭, 연구실 호수·전화번호, 사이트 주소
- [ ] `join.yml`: 실제 모집 여부
