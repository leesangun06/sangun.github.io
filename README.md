# 이상운의 메뉴 실험실

Lab 7 개인 웹사이트. 음식 메뉴를 선호도순 또는 한국어 가나다순으로 정렬하고 직접 구현한 Merge Sort와 Quick Sort의 실행 시간을 비교합니다.

## 실행

설치·빌드·API 키가 필요 없습니다. `index.html`을 브라우저에서 열면 바로 실행됩니다. Netlify Drop에는 이 폴더 전체를 올립니다. `index.html`이 업로드 폴더 바로 안에 있어야 합니다.

## 파일

- `index.html`: 소개, 실험 UI, 알고리즘 설명, 제출 파일 생성 폼
- `style.css`: PC/모바일 스타일과 CSS 그릇 일러스트
- `algorithms.js`: 반복형 병합 정렬, 반복형 3-way 퀵 정렬, 비교 함수, 벤치마크
- `app.js`: 버튼 연결, 메뉴 편집·브라우저 저장, 측정 결과 표시, submission.txt 생성
- `benchmark-worker.js`: 화면이 멈추지 않도록 별도 Worker에서 벤치마크 실행
- `netlify.toml`: 빌드 없는 정적 사이트 배포 설정

음식과 선호 순위는 제작자가 정한 예시이며 사용자가 수정할 수 있습니다. 확인되지 않은 학력·이력·연락처는 포함하지 않았습니다. 메뉴 편집 내용은 브라우저 localStorage에만 저장됩니다. 모든 방문자에게 적용할 기본 목록은 `app.js`의 `defaults`를 수정하고 재배포합니다.

## 정렬 호출 경로

선호도순/가나다순 → `setOrder()` → `renderMenus()` → 선택한 `mergeSort()` 또는 `quickSort()`.

Merge Sort/Quick Sort 선택 → `setAlgorithm()` → `renderMenus()` → 선택한 정렬 함수.

시간 비교 → `runExperiment()` → Worker → `runBenchmark()` → 두 정렬 함수.

Merge Sort를 선택한 상태에서 두 정렬 기준 버튼을 눌러 과제의 "두 버튼 모두 병합 정렬" 경로를 확인할 수 있습니다. Quick Sort도 두 기준에서 동작합니다. 내장 `Array.sort()`로 알고리즘을 대체하지 않았습니다.

## 비교 규칙

- 선호도: rank 오름차순, 1위부터.
- 가나다순: `Intl.Collator('ko')` 비교.
- 동률: id 오름차순으로 결과를 결정하여 두 출력이 정확히 일치하도록 합니다.
- 시간 비교의 확장 데이터는 현재 메뉴를 반복해 만든 가상 레코드입니다. 새로운 실제 메뉴 수가 아닙니다.

## 측정 방법

같은 입력을 시드 기반으로 섞고 각 정렬에 복사합니다. 3회 예열 후 9라운드를 측정하고 라운드마다 먼저 실행할 알고리즘을 바꿉니다. 라운드당 반복 수는 `max(1, min(1000, floor(16000 / n)))`입니다. 각 라운드의 정렬 1회당 평균 시간 9개의 중앙값을 표시합니다.

입력 생성·배열 복사·화면 렌더링은 타이머 밖에서 실행하고, 알고리즘 내부 보조 공간 할당은 시간에 포함합니다. 비교 횟수는 타이머 측정과 별도로 1회 측정합니다. 두 결과의 정렬 여부와 ID 순서 일치를 확인합니다. Worker 사용이 불가능한 로컬 파일 실행은 메인 스레드에서 라운드 사이에 제어를 양보하는 방식으로 실행합니다.

단위는 ms/정렬이며 performance.now()를 사용합니다. 표기 소수 자릿수는 측정 정확도를 보장하지 않습니다. 브라우저 타이머 정밀도, JIT, 메모리 회수, 기기 부하에 영향을 받으므로 항상 특정 알고리즘이 빠르다고 결론 내리지 않습니다.

## 알고리즘 특성

- 병합 정렬: 시간 O(n log n), 추가 공간 O(n), 안정 정렬.
- 퀵 정렬: 가운데 원소 피벗, 3-way 분할. 평균 O(n log n), 최악 O(n²). 작은 구간 우선 처리로 추가 스택 O(log n). 안정 정렬이 아닙니다.

## 제출 파일

공개 배포 후 시간 비교를 실행하고 페이지 하단의 "실험 기록과 과제 제출 파일"을 펼칩니다. 실제 Netlify URL을 입력한 뒤 submission.txt 저장을 누르면 URL, 알고리즘 설명, 현재 실행의 측정값을 담은 일반 텍스트 파일이 생성됩니다. 설정이나 메뉴를 바꾸면 이전 측정값을 무효화합니다. 실행하지 않은 성능 값은 만들지 않습니다.

## 배포

GitHub 저장소에 이 폴더의 파일을 루트로 업로드하거나 Git으로 push한 뒤, Netlify Drop에 이 폴더를 드래그합니다. 업데이트할 때는 기존 Netlify 프로젝트의 Deploys에 같은 폴더를 다시 올려 기존 공개 URL을 유지합니다.

공식 안내:

- https://docs.netlify.com/deploy/create-deploys/#drag-and-drop
- https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository

Google Fonts가 연결되면 Noto Sans KR을 불러오며, 연결되지 않으면 시스템 글꼴을 사용합니다. 그 외 이미지·JavaScript 라이브러리·서버 의존성은 없습니다.
