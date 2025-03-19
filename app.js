// Constantes y variables
const API_URL = 'https://654a774c1f197d51e4920358.mockapi.io/todos'; // MockAPI endpoint
let todos = [];
let currentFilter = 'all';

// Elementos DOM
const todoInput = document.getElementById('todo-input');
const addButton = document.getElementById('add-button');
const todoList = document.getElementById('todo-list');
const itemsLeft = document.getElementById('items-left');
const clearCompletedButton = document.getElementById('clear-completed');
const filterButtons = document.querySelectorAll('.filter-btn');

// Registrar Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registrado con éxito:', registration.scope);
      })
      .catch(error => {
        console.log('Error al registrar el Service Worker:', error);
      });
  });
}

// Cargar todos al iniciar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    fetchTodos();
    setupEventListeners();
});

// Configurar todos los event listeners
function setupEventListeners() {
    // Añadir tarea nueva
    addButton.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    });

    // Filtrar tareas
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const filter = e.target.getAttribute('data-filter');
            setFilter(filter);
        });
    });

    // Borrar tareas completadas
    clearCompletedButton.addEventListener('click', clearCompleted);
}

// Obtener todas las tareas de la API
async function fetchTodos() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Error al cargar tareas');
        
        const data = await response.json();
        todos = data.map(item => ({
            id: item.id,
            text: item.title || item.text, // Compatibilidad con ambos formatos
            completed: item.completed
        }));
        
        renderTodos();
    } catch (error) {
        console.error('Error:', error);
        alert('No se pudieron cargar las tareas. Intente nuevamente.');
    }
}

// Añadir una nueva tarea
async function addTodo() {
    const text = todoInput.value.trim();
    if (!text) return;

    const newTodo = {
        text: text,
        title: text, // Añadimos ambos campos para compatibilidad
        completed: false
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(newTodo),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            }
        });
        
        if (!response.ok) throw new Error('Error al crear la tarea');
        
        const data = await response.json();
        
        // MockAPI realmente guarda los datos, así que usamos el objeto devuelto
        todos.unshift({
            id: data.id,
            text: data.text || data.title,
            completed: data.completed
        });
        
        todoInput.value = '';
        renderTodos();
    } catch (error) {
        console.error('Error:', error);
        alert('No se pudo crear la tarea. Intente nuevamente.');
    }
}

// Actualizar el estado de una tarea
async function toggleTodo(id) {
    const todo = todos.find(item => item.id === id);
    if (!todo) return;
    
    const updatedTodo = { ...todo, completed: !todo.completed };
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT', // MockAPI prefiere PUT para actualizaciones completas
            body: JSON.stringify(updatedTodo),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            }
        });
        
        if (!response.ok) throw new Error('Error al actualizar la tarea');
        
        // Actualizar estado localmente después de confirmar en el servidor
        todo.completed = !todo.completed;
        renderTodos();
    } catch (error) {
        console.error('Error:', error);
        alert('No se pudo actualizar la tarea. Intente nuevamente.');
    }
}

// Eliminar una tarea
async function deleteTodo(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
        });
        
        if (!response.ok) throw new Error('Error al eliminar la tarea');
        
        // Eliminar de la lista local después de confirmar en el servidor
        todos = todos.filter(todo => todo.id !== id);
        renderTodos();
    } catch (error) {
        console.error('Error:', error);
        alert('No se pudo eliminar la tarea. Intente nuevamente.');
    }
}

// Eliminar todas las tareas completadas
function clearCompleted() {
    const completedTodos = todos.filter(todo => todo.completed);
    
    // Eliminar tareas completadas una por una
    Promise.all(
        completedTodos.map(todo => 
            fetch(`${API_URL}/${todo.id}`, { method: 'DELETE' })
            .then(response => {
                if (!response.ok) throw new Error(`Error al eliminar tarea ${todo.id}`);
                return todo.id;
            })
        )
    )
    .then(deletedIds => {
        // Filtrar las tareas completadas de la lista local
        todos = todos.filter(todo => !todo.completed);
        renderTodos();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('No se pudieron eliminar todas las tareas completadas.');
        // Actualizar la lista de tareas en caso de error
        fetchTodos();
    });
}

// Cambiar el filtro actual
function setFilter(filter) {
    currentFilter = filter;
    
    // Actualizar clases de botones de filtro
    filterButtons.forEach(button => {
        if (button.getAttribute('data-filter') === filter) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    renderTodos();
}

// Renderizar las tareas según el filtro actual
function renderTodos() {
    todoList.innerHTML = '';
    
    let filteredTodos;
    switch(currentFilter) {
        case 'active':
            filteredTodos = todos.filter(todo => !todo.completed);
            break;
        case 'completed':
            filteredTodos = todos.filter(todo => todo.completed);
            break;
        default:
            filteredTodos = todos;
    }
    
    filteredTodos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        
        li.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
            <span class="todo-text">${todo.text}</span>
            <button class="delete-btn">Eliminar</button>
        `;
        
        const checkbox = li.querySelector('.todo-checkbox');
        checkbox.addEventListener('change', () => toggleTodo(todo.id));
        
        const deleteButton = li.querySelector('.delete-btn');
        deleteButton.addEventListener('click', () => deleteTodo(todo.id));
        
        todoList.appendChild(li);
    });
    
    // Actualizar contador de tareas pendientes
    const activeCount = todos.filter(todo => !todo.completed).length;
    itemsLeft.textContent = `${activeCount} tarea${activeCount !== 1 ? 's' : ''} pendiente${activeCount !== 1 ? 's' : ''}`;
}
