'use strict';
const A = MenuAlgorithms;
const defaults = [
  ['비빔밥','🥗','한식 · 다채로운 한 그릇'],['치킨','🍗','야식 · 바삭한 즐거움'],['삼겹살','🥓','한식 · 함께 굽는 저녁'],['초밥','🍣','일식 · 한 입의 균형'],
  ['떡볶이','🌶️','분식 · 매콤달콤'],['냉면','🍜','한식 · 시원한 한 그릇'],['피자','🍕','양식 · 나눠 먹는 즐거움'],['돈가스','🍱','일식 · 든든한 한 접시'],
  ['김치찌개','🥘','한식 · 익숙한 따뜻함'],['파스타','🍝','양식 · 소스의 매력'],['라면','🍜','분식 · 간단하고 확실하게'],['햄버거','🍔','양식 · 한 손 가득'],
  ['짜장면','🍜','중식 · 윤기 나는 한 그릇'],['김밥','🍙','분식 · 알찬 한 줄'],['불고기','🥩','한식 · 달콤한 풍미'],['우동','🍲','일식 · 따뜻한 국물']
].map(([name,emoji,category],i)=>({id:i,name,emoji,category,rank:i+1}));
let menus = defaults.map(m=>({...m})), order = 'preference', algorithm = 'merge', busy = false, runNumber = 0;
const $ = selector => document.querySelector(selector);
try { const saved = JSON.parse(localStorage.getItem('sangun-menu-v1')); if (Array.isArray(saved) && saved.length >= 2 && saved.length <= 30 && saved.every(n=>typeof n==='string' && n.length>0 && n.length<=30) && new Set(saved).size===saved.length) menus = fromNames(saved); } catch (_) {}
function fromNames(names) { return names.map((name,i)=>{const original=defaults.find(m=>m.name===name);return {name,id:i,rank:i+1,emoji:original?.emoji||'🍽️',category:original?.category||'나의 메뉴'};}); }
function algorithmName() { return algorithm==='merge'?'Merge Sort':'Quick Sort'; }
function orderName() { return order==='preference'?'선호도순':'가나다순'; }
function resetResults(message) {
  window.lastBenchmark=null;
  $('#submission-status').textContent='현재 설정으로 시간 비교를 실행하면 실제 측정값을 제출 파일에 담습니다.';
  for (const key of ['merge','quick']) { $(`#${key}-time`).textContent='—'; $(`#${key}-count`).textContent='비교 횟수 —'; $(`#${key}-bar`).style.width='0%'; $(`#${key}-winner`).hidden=true; }
  $('#sample-tag').textContent='실행 대기'; $('#status').textContent=message||'설정이 바뀌었습니다. 다시 실행해 현재 조건의 시간을 비교하세요.';
}
function renderMenus() {
  const sorted = A[algorithm==='merge'?'mergeSort':'quickSort'](menus.slice(),A.makeComparator(order));
  const list=$('#menu-list'); list.replaceChildren();
  for (const [i,menu] of sorted.entries()) {
    const li=document.createElement('li');li.className='menu-item';
    const number=document.createElement('span');number.className='menu-number';number.textContent=String(i+1).padStart(2,'0');
    const emoji=document.createElement('span');emoji.className='food-icon';emoji.textContent=menu.emoji;emoji.setAttribute('aria-hidden','true');
    const text=document.createElement('span');text.className='menu-name';text.textContent=menu.name;
    const category=document.createElement('span');category.className='menu-category';category.textContent=menu.category;text.append(category);
    const rank=document.createElement('span');rank.className='rank';rank.textContent=`선호 ${menu.rank}위`;
    li.append(number,emoji,text,rank);list.append(li);
  }
  $('#list-tag').textContent=`${orderName()} · ${algorithmName()}`;
  $('#list-validation').textContent=`✓ ${algorithmName()}로 정렬한 ${menus.length}개 메뉴`;
  $('#order-note').textContent=order==='preference'?'좋아하는 순서대로 · 1위부터':'한국어 이름 기준 · 오름차순';
  $('#size').options[0].value=String(menus.length);$('#size').options[0].textContent=`${menus.length}개 · 실제 메뉴`;
  $('.hero-meta span').textContent=`${menus.length}가지 메뉴`;
  $('.control-panel> .field-note').textContent='확장 데이터는 현재 메뉴를 복제한 실험용 레코드입니다.';
  $('.control-footnote').textContent=`목록은 언제나 실제 메뉴 ${menus.length}개입니다. 실험은 선택한 크기의 같은 입력으로 진행합니다.`;
}
function setOrder(value) {
  if(busy)return;order=value;
  document.querySelectorAll('[data-order]').forEach(b=>{const active=b.dataset.order===order;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  renderMenus();resetResults();
}
function setAlgorithm(value) {
  if(busy)return;algorithm=value;
  document.querySelectorAll('[data-algorithm]').forEach(b=>{const active=b.dataset.algorithm===algorithm;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});renderMenus();
}
function setBusy(value) {
  busy=value; document.querySelectorAll('button,select,textarea').forEach(el=>{el.disabled=value;});
  $('#run').firstElementChild.textContent=value?'두 알고리즘 측정 중…':'정렬하고 시간 비교';$('#run').setAttribute('aria-busy',String(value));
}
async function calculate(payload) {
  if(location.protocol==='file:' || typeof Worker==='undefined') return A.runBenchmark(payload);
  return new Promise((resolve,reject)=>{
    const worker=new Worker('benchmark-worker.js');
    const timeout=setTimeout(()=>{worker.terminate();reject(new Error('측정 제한 시간(60초)을 초과했습니다. 더 작은 데이터로 재시도하세요.'));},60000);
    worker.onmessage=({data})=>{clearTimeout(timeout);worker.terminate();data.ok?resolve(data.result):reject(new Error(data.error));};
    worker.onerror=()=>{clearTimeout(timeout);worker.terminate();A.runBenchmark(payload).then(resolve,reject);};
    worker.postMessage(payload);
  });
}
async function runExperiment() {
  if(busy)return;
  resetResults('같은 입력을 생성하고 예열·반복 측정 중입니다. 잠시 기다려 주세요.');setBusy(true);
  try {
    const result=await calculate({menus,size:Number($('#size').value),order,seed:20261125+(runNumber++)});
    const m=result.results.merge, q=result.results.quick,max=Math.max(m.ms,q.ms,0.000001);
    for(const key of ['merge','quick']) {
      const item=result.results[key];$(`#${key}-time`).textContent=item.ms<0.000001?'<0.000001':item.ms.toFixed(item.ms>=1?3:6);
      $(`#${key}-count`).textContent=`비교 ${item.comparisons.toLocaleString('ko-KR')}회 · 별도 1회 실행`;
      $(`#${key}-bar`).style.width=`${Math.max(1,item.ms/max*100)}%`;
    }
    if(m.ms!==q.ms)$(`#${m.ms<q.ms?'merge':'quick'}-winner`).hidden=false;
    $('#sample-tag').textContent=`${result.size.toLocaleString('ko-KR')}개 · ${orderName()} · 중앙값`;
    const diff=Math.abs(m.ms-q.ms);
    $('#status').textContent=`✓ 두 결과 일치 · ${result.rounds}라운드 × ${result.batch}회/알고리즘 · 차이 ${diff.toFixed(6)} ms/정렬. 이 결과는 현재 실행 환경의 측정값입니다.`;
    window.lastBenchmark=result;
    $('#submission-status').textContent='측정 완료. 공개 Netlify 주소를 입력하고 제출 파일을 저장하세요.';
  }catch(error){$('#status').textContent=`측정 오류: ${error.message}`;}
  finally{setBusy(false);}
}
document.querySelectorAll('[data-order]').forEach(b=>b.addEventListener('click',()=>setOrder(b.dataset.order)));
document.querySelectorAll('[data-algorithm]').forEach(b=>b.addEventListener('click',()=>setAlgorithm(b.dataset.algorithm)));
$('#run').addEventListener('click',runExperiment);
$('#size').addEventListener('change',()=>resetResults());
$('#edit-toggle').addEventListener('click',()=>{const open=$('#editor').hidden;$('#editor').hidden=!open;$('#edit-toggle').setAttribute('aria-expanded',String(open));if(open){$('#menu-editor').value=menus.map(m=>m.name).join('\n');$('#menu-editor').focus();}});
$('#editor').addEventListener('submit',event=>{
  event.preventDefault();const names=$('#menu-editor').value.split(/\r?\n/).map(n=>n.trim()).filter(Boolean);
  if(names.length<2||names.length>30||names.some(n=>n.length>30)||new Set(names).size!==names.length){$('#edit-error').textContent='메뉴를 중복 없이 2~30개 입력해 주세요. 메뉴 이름은 각각 30자 이하입니다.';return;}
  const actualSelected=$('#size').selectedIndex===0;menus=fromNames(names);renderMenus();if(actualSelected)$('#size').selectedIndex=0;
  let saved=true;try{localStorage.setItem('sangun-menu-v1',JSON.stringify(names));}catch(_){saved=false;}
  $('#editor').hidden=true;$('#edit-toggle').setAttribute('aria-expanded','false');$('#edit-error').textContent='';resetResults(saved?'메뉴를 저장했습니다. 새 취향으로 다시 실험해 보세요.':'메뉴를 적용했습니다. 브라우저 저장이 제한되어 새로고침하면 초기화됩니다.');
});
$('#reset').addEventListener('click',()=>{menus=defaults.map(m=>({...m}));try{localStorage.removeItem('sangun-menu-v1');}catch(_){}$('#size').selectedIndex=2;setOrder('preference');setAlgorithm('merge');$('#editor').hidden=true;$('#edit-toggle').setAttribute('aria-expanded','false');$('#edit-error').textContent='';resetResults('처음 메뉴와 설정으로 돌아왔습니다. 다시 실험해 보세요.');});
renderMenus();
if(location.protocol==='https:' && location.hostname.endsWith('.netlify.app')) $('#site-url').value=location.origin+'/';
$('#submission-form').addEventListener('submit',event=>{
  event.preventDefault();
  const result=window.lastBenchmark;
  if(!result){$('#submission-status').textContent='먼저 현재 설정으로 시간 비교를 실행하세요.';return;}
  let url;try{url=new URL($('#site-url').value);}catch(_){$('#submission-status').textContent='올바른 공개 URL을 입력하세요.';return;}
  if(url.protocol!=='https:' || !url.hostname.endsWith('.netlify.app') || url.username || url.password){$('#submission-status').textContent='배포 후 발급된 https://이름.netlify.app/ 주소를 입력하세요.';return;}
  const criterion=result.order==='name'?'Korean alphabetical order':'preference rank';
  const text=`Website: ${url.href}\nAlgorithm: I implemented merge sort and quicksort to reorder food menu records by preference rank or Korean alphabetical order. Use the sorting controls and the comparison button in the Sorting Lab to try both algorithms.\nPerformance: For ${result.size.toLocaleString('en-US')} records sorted by ${criterion}, Merge Sort took ${result.results.merge.ms.toFixed(6)} ms/sort vs Quick Sort ${result.results.quick.ms.toFixed(6)} ms/sort in this browser (median of ${result.rounds} rounds, ${result.batch} sorts/round after 3 warm-ups; input copying and rendering excluded; both outputs verified equal). Results vary by device and run.\n`;
  const blob=new Blob([text],{type:'text/plain;charset=utf-8'}),href=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=href;anchor.download='submission.txt';anchor.click();setTimeout(()=>URL.revokeObjectURL(href),1000);$('#submission-status').textContent='submission.txt를 저장했습니다. 공개 주소 접속을 확인한 뒤 Autolab에 업로드하세요.';
});
