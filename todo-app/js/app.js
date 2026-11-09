// ===== 할 일 앱 =====
// 할 일 목록은 브라우저의 localStorage에 저장되어, 창을 닫았다 열어도 남아 있습니다.

const STORAGE_KEY = "todo-app-items";

// 화면 요소
const form = document.getElementById("add-form");
const textInput = document.getElementById("new-text");
const dueInput = document.getElementById("new-due");
const listEl = document.getElementById("list");
const emptyEl = document.getElementById("empty");
const emptyText = document.getElementById("empty-text");
const leftCount = document.getElementById("left-count");
const clearBtn = document.getElementById("clear-done");
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");

let todos = load();
let filter = "all";

// ----- 저장 / 불러오기 -----
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) return saved;
  } catch (e) { /* 저장된 값이 없거나 읽을 수 없으면 예시로 시작 */ }
  const t = todayISO();
  return [
    { id: 1, text: "바이브 코딩 연습하기", due: t, done: true },
    { id: 2, text: "할 일 앱에 내 할 일 넣어 보기", due: t, done: false },
    { id: 3, text: "두 번 눌러서 내용 고쳐 보기", due: "", done: false }
  ];
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(todos)); } catch (e) { /* 저장이 막힌 환경 */ }
}

// ----- 날짜 도우미 -----
function todayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}
function dueLabel(due) {
  if (!due) return "";
  const today = todayISO();
  const diff = Math.round((new Date(due) - new Date(today)) / 86400000);
  const [, m, d] = due.split("-").map(Number);
  if (diff === 0) return "오늘까지";
  if (diff === 1) return "내일까지";
  if (diff < 0) return `${-diff}일 지남 (${m}/${d})`;
  return `${m}월 ${d}일까지 · D-${diff}`;
}

// ----- 화면 그리기 -----
function render() {
  const visible = todos.filter(t =>
    filter === "all" ? true : filter === "done" ? t.done : !t.done
  );

  listEl.innerHTML = "";
  visible.forEach(t => listEl.appendChild(itemEl(t)));

  // 비어 있을 때 안내
  emptyEl.hidden = visible.length > 0;
  emptyText.textContent =
    todos.length === 0 ? "할 일이 없어요. 위에서 새로 추가해 보세요!" :
    filter === "done" ? "아직 완료한 일이 없어요." :
    filter === "active" ? "모두 끝냈어요! 수고하셨어요." : "";

  // 개수와 진행률
  const doneCount = todos.filter(t => t.done).length;
  const left = todos.length - doneCount;
  leftCount.textContent = `남은 일 ${left}개`;
  clearBtn.disabled = doneCount === 0;
  progressText.textContent = `${doneCount} / ${todos.length}`;
  progressFill.style.width = todos.length ? `${(doneCount / todos.length) * 100}%` : "0";
}

function itemEl(t) {
  const li = document.createElement("li");
  li.className = "item" + (t.done ? " done" : "");
  li.dataset.id = t.id;

  const label = dueLabel(t.due);
  const late = t.due && !t.done && t.due < todayISO();

  li.innerHTML = `
    <button class="check" aria-label="${t.done ? "완료 취소" : "완료"}"><img src="images/check.svg" alt=""></button>
    <div class="content">
      <span class="text"></span>
      ${label ? `<span class="due${late ? " late" : ""}">${label}</span>` : ""}
    </div>
    <button class="delete" aria-label="삭제"><img src="images/trash.svg" alt=""></button>`;
  li.querySelector(".text").textContent = t.text; // 입력한 글자를 안전하게 넣기
  return li;
}

// ----- 동작 -----
form.addEventListener("submit", e => {
  e.preventDefault();
  const text = textInput.value.trim();
  if (!text) { textInput.focus(); return; }
  todos.push({ id: Date.now(), text, due: dueInput.value, done: false });
  textInput.value = "";
  dueInput.value = "";
  save(); render();
  textInput.focus();
});

listEl.addEventListener("click", e => {
  const li = e.target.closest(".item");
  if (!li) return;
  const todo = todos.find(t => t.id === Number(li.dataset.id));
  if (e.target.closest(".check")) { todo.done = !todo.done; save(); render(); }
  if (e.target.closest(".delete")) { todos = todos.filter(t => t !== todo); save(); render(); }
});

// 두 번 눌러서 고치기
listEl.addEventListener("dblclick", e => {
  const span = e.target.closest(".text");
  if (!span) return;
  const li = span.closest(".item");
  const todo = todos.find(t => t.id === Number(li.dataset.id));
  const input = document.createElement("input");
  input.className = "edit";
  input.value = todo.text;
  input.maxLength = 80;
  span.replaceWith(input);
  input.focus();
  input.select();

  let finished = false;
  const finish = keep => {
    if (finished) return;
    finished = true;
    const v = input.value.trim();
    if (keep && v) todo.text = v;
    save(); render();
  };
  input.addEventListener("keydown", ev => {
    if (ev.key === "Enter") finish(true);
    if (ev.key === "Escape") finish(false);
  });
  input.addEventListener("blur", () => finish(true));
});

document.querySelectorAll(".filters button").forEach(btn => {
  btn.addEventListener("click", () => {
    filter = btn.dataset.filter;
    document.querySelectorAll(".filters button").forEach(b => b.classList.toggle("on", b === btn));
    render();
  });
});

clearBtn.addEventListener("click", () => {
  todos = todos.filter(t => !t.done);
  save(); render();
});

// 오늘 날짜 표시
(function showToday() {
  const [y, m, d] = todayISO().split("-").map(Number);
  const day = "일월화수목금토"[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  document.getElementById("today").textContent = `${y}년 ${m}월 ${d}일 ${day}요일`;
})();

render();
