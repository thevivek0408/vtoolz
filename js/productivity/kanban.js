import { Utils } from '../utils/common.js';

document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('kanban-board');
    const taskModal = document.getElementById('task-modal');
    const taskForm = document.getElementById('task-form');
    const btnAddColumn = document.getElementById('btn-add-column');
    const btnReset = document.getElementById('btn-reset-board');

    // State
    let data = {
        columns: [
            { id: 'col-1', title: 'To Do', tasks: [] },
            { id: 'col-2', title: 'In Progress', tasks: [] },
            { id: 'col-3', title: 'Done', tasks: [] }
        ]
    };

    // Load from LocalStorage
    const saved = localStorage.getItem('vtoolz_kanban');
    if (saved) {
        try {
            data = JSON.parse(saved);
        } catch (e) {
            console.error("Corrupt save data", e);
        }
    }

    renderBoard();

    // Render Logic
    function renderBoard() {
        board.innerHTML = '';

        data.columns.forEach((col, colIndex) => {
            // Column Element
            const colEl = document.createElement('div');
            colEl.className = 'column';
            colEl.dataset.id = col.id;
            colEl.dataset.index = colIndex;

            // Header
            colEl.innerHTML = `
                <div class="column-header">
                    <h3>${col.title} <span style="font-size:0.8rem; color:var(--text-muted); margin-left:5px;">(${col.tasks.length})</span></h3>
                    <button class="btn-icon-sm" onclick="window.deleteColumn('${col.id}')">✖</button>
                </div>
                <div class="task-list" id="${col.id}-list">
                    <!-- Tasks go here -->
                </div>
                <button class="btn-add-task" onclick="window.openAddTask('${col.id}')">+ Add Task</button>
            `;

            const taskList = colEl.querySelector('.task-list');

            // Render Tasks
            col.tasks.forEach((task, taskIndex) => {
                const taskCard = document.createElement('div');
                taskCard.className = 'task-card';
                taskCard.draggable = true;
                taskCard.dataset.colId = col.id;
                taskCard.dataset.taskId = task.id;

                let tagHtml = '';
                if (task.tag && task.tag !== '') {
                    tagHtml = `<span class="tag tag-${task.tag}">${task.tag.toUpperCase()}</span>`;
                }

                taskCard.innerHTML = `
                    ${tagHtml}
                    <p>${task.content}</p>
                    <div class="task-actions">
                        <button class="btn-icon-sm" onclick="window.deleteTask('${col.id}', '${task.id}')">🗑️</button>
                    </div>
                `;

                // Drag Events
                taskCard.addEventListener('dragstart', handleDragStart);
                taskCard.addEventListener('dragend', handleDragEnd);

                taskList.appendChild(taskCard);
            });

            // Drop Zone Events
            taskList.addEventListener('dragover', handleDragOver);
            taskList.addEventListener('dragleave', handleDragLeave);
            taskList.addEventListener('drop', handleDrop);

            board.appendChild(colEl);
        });

        saveData();
    }

    // --- Drag & Drop Handlers ---
    let draggedItem = null;
    let sourceColId = null;

    function handleDragStart(e) {
        draggedItem = this;
        sourceColId = this.dataset.colId;
        setTimeout(() => this.classList.add('dragging'), 0);
    }

    function handleDragEnd(e) {
        this.classList.remove('dragging');
        document.querySelectorAll('.task-list').forEach(list => list.classList.remove('drag-over'));
        draggedItem = null;
    }

    function handleDragOver(e) {
        e.preventDefault();
        this.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        this.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        this.classList.remove('drag-over');
        const destColId = this.parentElement.dataset.id;

        if (!draggedItem) return;

        // Visual Move
        this.appendChild(draggedItem);

        // Data Move
        const taskId = draggedItem.dataset.taskId;
        moveTaskData(sourceColId, destColId, taskId);
    }

    // --- Data Management ---

    function moveTaskData(fromColId, toColId, taskId) {
        if (fromColId === toColId) return; // Reordering within column (Todo: implement index reorder)

        const fromCol = data.columns.find(c => c.id === fromColId);
        const toCol = data.columns.find(c => c.id === toColId);

        const taskIndex = fromCol.tasks.findIndex(t => t.id === taskId);
        const [task] = fromCol.tasks.splice(taskIndex, 1);

        toCol.tasks.push(task);
        renderBoard(); // Re-render to update counts/ids
    }

    function saveData() {
        localStorage.setItem('vtoolz_kanban', JSON.stringify(data));
    }

    // --- Global Helpers for OnClick --
    window.openAddTask = (colId) => {
        document.getElementById('task-col-id').value = colId;
        document.getElementById('task-desc').value = '';
        taskModal.showModal();
    };

    window.closeTaskModal = () => {
        taskModal.close();
    };

    window.Math.uuid = () => { // Simple ID gen
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    };

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const colId = document.getElementById('task-col-id').value;
        const col = data.columns.find(c => c.id === colId);

        const newTask = {
            id: window.Math.uuid(),
            content: document.getElementById('task-desc').value,
            tag: document.getElementById('task-tag').value,
            createdAt: Date.now()
        };

        col.tasks.push(newTask);
        taskModal.close();
        renderBoard();
    });

    window.deleteTask = (colId, taskId) => {
        if (!confirm("Delete this task?")) return;
        const col = data.columns.find(c => c.id === colId);
        col.tasks = col.tasks.filter(t => t.id !== taskId);
        renderBoard();
    };

    window.deleteColumn = (colId) => {
        if (!confirm("Delete entire column and all tasks?")) return;
        data.columns = data.columns.filter(c => c.id !== colId);
        renderBoard();
    };

    // Add Column
    btnAddColumn.addEventListener('click', () => {
        const title = prompt("Column Title:");
        if (title) {
            data.columns.push({
                id: 'col-' + window.Math.uuid(),
                title: title,
                tasks: []
            });
            renderBoard();
        }
    });

    // Reset
    btnReset.addEventListener('click', () => {
        if (confirm("Clear board? This cannot be undone.")) {
            localStorage.removeItem('vtoolz_kanban');
            location.reload();
        }
    });

});
