// グローバル変数
let todos = [];
let currentFilter = 'all';
const STORAGE_KEY = 'simpleTodoApp';

// DOM要素
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const todoCount = document.getElementById('todoCount');
const filterBtns = document.querySelectorAll('.filter-btn');

// 初期化
function init() {
    todos = loadTodos();
    setupEventListeners();
    renderTodos();
}

// イベントリスナーの設定
function setupEventListeners() {
    // 追加ボタン
    addBtn.addEventListener('click', handleAdd);

    // Enterキーで追加
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAdd();
        }
    });

    // フィルターボタン
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setFilter(btn.dataset.filter);
        });
    });

    // TODOリストのイベント委譲
    todoList.addEventListener('click', handleTodoClick);
    todoList.addEventListener('change', handleTodoChange);
}

// TODO追加の処理
function handleAdd() {
    const text = todoInput.value.trim();

    if (text === '') {
        alert('タスクを入力してください');
        return;
    }

    addTodo(text);
    todoInput.value = '';
    todoInput.focus();
}

// TODO追加
function addTodo(text) {
    const todo = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: Date.now()
    };

    todos.push(todo);
    saveTodos();
    renderTodos();
}

// TODO削除
function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    renderTodos();
}

// 完了/未完了の切り替え
function toggleTodo(id) {
    const todo = todos.find(todo => todo.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        renderTodos();
    }
}

// TODO編集
function editTodo(id, newText) {
    const todo = todos.find(todo => todo.id === id);
    if (todo && newText.trim() !== '') {
        todo.text = newText.trim();
        saveTodos();
        renderTodos();
    }
}

// 編集モード開始
function startEdit(id) {
    const todoItem = document.querySelector(`[data-id="${id}"]`);
    const todo = todos.find(t => t.id === id);

    if (!todoItem || !todo) return;

    const currentText = todo.text;

    todoItem.innerHTML = `
        <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} disabled>
        <input type="text" class="todo-edit-input" value="${currentText}" data-id="${id}" autofocus>
        <div class="todo-actions">
            <button class="save-btn" data-id="${id}">保存</button>
            <button class="cancel-btn" data-id="${id}">キャンセル</button>
        </div>
    `;

    const editInput = todoItem.querySelector('.todo-edit-input');
    editInput.focus();
    editInput.select();

    // Enterで保存
    editInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            editTodo(id, editInput.value);
        }
    });

    // Escでキャンセル
    editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            renderTodos();
        }
    });
}

// TODOリストのクリックイベント処理
function handleTodoClick(e) {
    const id = parseInt(e.target.dataset.id);

    if (e.target.classList.contains('delete-btn')) {
        if (confirm('このタスクを削除しますか？')) {
            deleteTodo(id);
        }
    } else if (e.target.classList.contains('edit-btn')) {
        startEdit(id);
    } else if (e.target.classList.contains('save-btn')) {
        const editInput = document.querySelector(`.todo-edit-input[data-id="${id}"]`);
        if (editInput) {
            editTodo(id, editInput.value);
        }
    } else if (e.target.classList.contains('cancel-btn')) {
        renderTodos();
    } else if (e.target.classList.contains('todo-text')) {
        // テキストをダブルクリックで編集
        e.target.addEventListener('dblclick', () => {
            startEdit(id);
        });
    }
}

// チェックボックスの変更イベント処理
function handleTodoChange(e) {
    if (e.target.classList.contains('todo-checkbox')) {
        const id = parseInt(e.target.dataset.id);
        toggleTodo(id);
    }
}

// フィルター設定
function setFilter(filter) {
    currentFilter = filter;

    // activeクラスの更新
    filterBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });

    renderTodos();
}

// フィルター適用
function getFilteredTodos() {
    switch (currentFilter) {
        case 'active':
            return todos.filter(todo => !todo.completed);
        case 'completed':
            return todos.filter(todo => todo.completed);
        default:
            return todos;
    }
}

// TODO要素の作成
function createTodoElement(todo) {
    return `
        <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
            <input type="checkbox"
                   class="todo-checkbox"
                   ${todo.completed ? 'checked' : ''}
                   data-id="${todo.id}">
            <span class="todo-text" data-id="${todo.id}">${todo.text}</span>
            <div class="todo-actions">
                <button class="edit-btn" data-id="${todo.id}">編集</button>
                <button class="delete-btn" data-id="${todo.id}">削除</button>
            </div>
        </li>
    `;
}

// TODOリストの描画
function renderTodos() {
    const filteredTodos = getFilteredTodos();

    if (filteredTodos.length === 0) {
        todoList.innerHTML = '<li class="empty-state">タスクがありません</li>';
    } else {
        todoList.innerHTML = filteredTodos.map(createTodoElement).join('');
    }

    updateStats();
}

// 統計情報の更新
function updateStats() {
    const activeCount = todos.filter(todo => !todo.completed).length;
    todoCount.textContent = `未完了: ${activeCount}`;
}

// localStorageに保存
function saveTodos() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch (error) {
        console.error('データの保存に失敗しました:', error);
    }
}

// localStorageから読み込み
function loadTodos() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('データの読み込みに失敗しました:', error);
        return [];
    }
}

// アプリケーション起動
document.addEventListener('DOMContentLoaded', init);
