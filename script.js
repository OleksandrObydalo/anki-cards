document.addEventListener('DOMContentLoaded', function() {
    // DOM элементы
    const cardModal = document.getElementById('cardModal');
    const categoryModal = document.getElementById('categoryModal');
    const modalTitle = document.getElementById('modalTitle');
    const cardForm = document.getElementById('cardForm');
    const categoryForm = document.getElementById('categoryForm');
    const cardFrontInput = document.getElementById('cardFront');
    const cardBackInput = document.getElementById('cardBack');
    const cardCategorySelect = document.getElementById('cardCategory');
    const categoryNameInput = document.getElementById('categoryName');
    const cardsContainer = document.getElementById('cardsContainer');
    const noCardsMessage = document.getElementById('noCardsMessage');
    const addCardBtn = document.getElementById('addCardBtn');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const cancelCardBtn = document.getElementById('cancelCardBtn');
    const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
    const categorySelect = document.getElementById('categorySelect');
    const startStudyBtn = document.getElementById('startStudyBtn');
    const startTestBtn = document.getElementById('startTestBtn');
    const cardsLibrary = document.getElementById('cardsLibrary');
    const studyMode = document.getElementById('studyMode');
    const testMode = document.getElementById('testMode');
    const exitStudyBtn = document.getElementById('exitStudyBtn');
    const exitTestBtn = document.getElementById('exitTestBtn');
    const studyCard = document.getElementById('studyCard');
    const showAnswerBtn = document.getElementById('showAnswerBtn');
    const ratingBtns = document.getElementById('ratingBtns');
    const testCard = document.getElementById('testCard');
    const testAnswer = document.getElementById('testAnswer');
    const checkAnswerBtn = document.getElementById('checkAnswerBtn');
    const testResult = document.getElementById('testResult');
    const resultMessage = document.getElementById('resultMessage');
    const correctAnswer = document.getElementById('correctAnswer');
    const nextTestCardBtn = document.getElementById('nextTestCardBtn');
    const currentCardNum = document.getElementById('currentCardNum');
    const totalCards = document.getElementById('totalCards');
    const correctAnswers = document.getElementById('correctAnswers');

    // Хранилище карточек и категорий
    let cards = JSON.parse(localStorage.getItem('flashcards')) || [];
    let categories = JSON.parse(localStorage.getItem('flashcardCategories')) || [];
    let currentEditingIndex = null;
    let currentCategory = 'all';
    let currentStudyIndex = 0;
    let studyStack = [];
    let testStack = [];
    let testCurrentIndex = 0;
    let testCorrectCount = 0;

    // Инициализация приложения
    init();

    // Обработчики событий
    addCardBtn.addEventListener('click', openAddCardModal);
    addCategoryBtn.addEventListener('click', openCategoryModal);
    cancelCardBtn.addEventListener('click', closeCardModal);
    cancelCategoryBtn.addEventListener('click', closeCategoryModal);
    categoryForm.addEventListener('submit', saveCategory);
    document.querySelectorAll('.modal .close').forEach(el => {
        el.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    cardForm.addEventListener('submit', saveCard);
    categorySelect.addEventListener('change', filterCardsByCategory);
    startStudyBtn.addEventListener('click', startStudyMode);
    startTestBtn.addEventListener('click', startTestMode);
    exitStudyBtn.addEventListener('click', exitStudyMode);
    exitTestBtn.addEventListener('click', exitTestMode);
    showAnswerBtn.addEventListener('click', showAnswer);
    checkAnswerBtn.addEventListener('click', checkAnswer);
    nextTestCardBtn.addEventListener('click', nextTestCard);

    // Рейтинги в режиме обучения
    document.querySelectorAll('.rating-btn').forEach(btn => {
        btn.addEventListener('click', () => rateCard(parseInt(btn.dataset.rating)));
    });

    // Закрытие модальных окон при клике вне их области
    window.addEventListener('click', function(event) {
        if (event.target === cardModal) {
            closeCardModal();
        } else if (event.target === categoryModal) {
            closeCategoryModal();
        }
    });

    // Функции приложения
    function init() {
        updateCategoryOptions();
        renderCards();
        updateButtonsState();
    }

    function renderCards() {
        cardsContainer.innerHTML = '';
        
        // Фильтруем карточки по выбранной категории
        const filteredCards = currentCategory === 'all' 
            ? cards 
            : cards.filter(card => card.category === currentCategory);
        
        if (filteredCards.length === 0) {
            noCardsMessage.style.display = 'block';
            return;
        }
        
        noCardsMessage.style.display = 'none';
        
        filteredCards.forEach((card, index) => {
            // Находим исходный индекс в полном массиве карточек
            const originalIndex = cards.findIndex(c => c.front === card.front && c.back === card.back);
            
            // Находим категорию
            const categoryName = categories.find(cat => cat.id === card.category)?.name || 'Без категории';
            
            const cardElement = document.createElement('div');
            cardElement.className = 'card-item';
            cardElement.innerHTML = `
                <div class="card-category">${categoryName}</div>
                <div class="card-term">${card.front}</div>
                <div class="card-definition">${card.back}</div>
                <div class="card-actions">
                    <button class="edit-btn" data-index="${originalIndex}">Изменить</button>
                    <button class="delete-btn" data-index="${originalIndex}">Удалить</button>
                </div>
            `;
            cardsContainer.appendChild(cardElement);
        });
        
        // Добавляем обработчики для кнопок
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                openEditCardModal(parseInt(this.dataset.index));
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                deleteCard(parseInt(this.dataset.index));
            });
        });
    }

    function updateCategoryOptions() {
        // Обновляем выпадающий список категорий в форме
        cardCategorySelect.innerHTML = '<option value="">Выберите категорию</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            cardCategorySelect.appendChild(option);
        });
        
        // Обновляем выпадающий список фильтра категорий
        const selectedCategory = categorySelect.value;
        categorySelect.innerHTML = '<option value="all">Все категории</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
            
            // Восстанавливаем выбранную категорию
            if (selectedCategory === category.id) {
                option.selected = true;
            }
        });
    }

    function filterCardsByCategory() {
        currentCategory = categorySelect.value;
        renderCards();
    }

    function openCategoryModal() {
        categoryNameInput.value = '';
        categoryModal.style.display = 'block';
    }

    function closeCategoryModal() {
        categoryModal.style.display = 'none';
    }

    function saveCategory(e) {
        e.preventDefault();
        
        const name = categoryNameInput.value.trim();
        
        if (!name) {
            alert('Пожалуйста, введите название категории');
            return;
        }
        
        // Проверяем, не существует ли уже такая категория
        if (categories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
            alert('Категория с таким названием уже существует');
            return;
        }
        
        const newCategory = {
            id: Date.now().toString(), // уникальный ID на основе времени
            name
        };
        
        categories.push(newCategory);
        localStorage.setItem('flashcardCategories', JSON.stringify(categories));
        
        updateCategoryOptions();
        closeCategoryModal();
    }

    function openAddCardModal() {
        modalTitle.textContent = 'Новая карточка';
        cardFrontInput.value = '';
        cardBackInput.value = '';
        cardCategorySelect.value = '';
        currentEditingIndex = null;
        cardModal.style.display = 'block';
    }

    function closeCardModal() {
        cardModal.style.display = 'none';
    }

    function openEditCardModal(index) {
        modalTitle.textContent = 'Редактировать карточку';
        const card = cards[index];
        cardFrontInput.value = card.front;
        cardBackInput.value = card.back;
        cardCategorySelect.value = card.category || '';
        currentEditingIndex = index;
        cardModal.style.display = 'block';
    }

    function saveCard(e) {
        e.preventDefault();
        
        const front = cardFrontInput.value.trim();
        const back = cardBackInput.value.trim();
        const category = cardCategorySelect.value;
        
        if (!front || !back) {
            alert('Пожалуйста, заполните оба поля');
            return;
        }
        
        if (!category) {
            alert('Пожалуйста, выберите категорию');
            return;
        }
        
        const newCard = {
            front,
            back,
            category,
            lastStudied: null,
            difficulty: 0 // 0-4 шкала сложности
        };
        
        if (currentEditingIndex !== null) {
            // Сохраняем предыдущие данные учебы
            if (cards[currentEditingIndex].lastStudied) {
                newCard.lastStudied = cards[currentEditingIndex].lastStudied;
            }
            if (cards[currentEditingIndex].difficulty) {
                newCard.difficulty = cards[currentEditingIndex].difficulty;
            }
            
            // Обновляем карточку
            cards[currentEditingIndex] = newCard;
        } else {
            // Добавляем новую карточку
            cards.push(newCard);
        }
        
        // Сохраняем в localStorage и обновляем UI
        localStorage.setItem('flashcards', JSON.stringify(cards));
        closeCardModal();
        renderCards();
        updateButtonsState();
    }

    function startStudyMode() {
        cardsLibrary.classList.remove('active-section');
        cardsLibrary.classList.add('hidden-section');
        studyMode.classList.remove('hidden-section');
        studyMode.classList.add('active-section');
        
        // Формируем очередь карточек для изучения с учетом текущей категории
        let cardsToStudy = [...cards];
        
        if (currentCategory !== 'all') {
            cardsToStudy = cardsToStudy.filter(card => card.category === currentCategory);
        }
        
        studyStack = cardsToStudy.sort((a, b) => {
            // Сначала новые
            if (!a.lastStudied && b.lastStudied) return -1;
            if (a.lastStudied && !b.lastStudied) return 1;
            if (!a.lastStudied && !b.lastStudied) return 0;
            
            // Затем сортируем по сложности и времени последнего изучения
            const timeDiffA = Date.now() - a.lastStudied;
            const timeDiffB = Date.now() - b.lastStudied;
            
            return (b.difficulty * timeDiffB) - (a.difficulty * timeDiffA);
        });
        
        currentStudyIndex = 0;
        showStudyCard();
    }

    function showStudyCard() {
        if (currentStudyIndex >= studyStack.length) {
            alert('Поздравляем! Вы прошли все карточки.');
            exitStudyMode();
            return;
        }
        
        const card = studyStack[currentStudyIndex];
        studyCard.classList.remove('flipped');
        studyCard.querySelector('.flashcard-front').textContent = card.front;
        studyCard.querySelector('.flashcard-back').textContent = card.back;
        
        showAnswerBtn.style.display = 'block';
        ratingBtns.classList.add('hidden');
    }

    function showAnswer() {
        studyCard.classList.add('flipped');
        showAnswerBtn.style.display = 'none';
        ratingBtns.classList.remove('hidden');
    }

    function rateCard(rating) {
        // Обновляем сложность карточки и время последнего изучения
        const cardIndex = cards.findIndex(card => 
            card.front === studyStack[currentStudyIndex].front && 
            card.back === studyStack[currentStudyIndex].back
        );
        
        if (cardIndex !== -1) {
            cards[cardIndex].difficulty = 5 - rating; // 1 = отлично (сложность 4), 4 = плохо (сложность 1)
            cards[cardIndex].lastStudied = Date.now();
            localStorage.setItem('flashcards', JSON.stringify(cards));
        }
        
        currentStudyIndex++;
        showStudyCard();
    }

    function exitStudyMode() {
        studyMode.classList.remove('active-section');
        studyMode.classList.add('hidden-section');
        cardsLibrary.classList.remove('hidden-section');
        cardsLibrary.classList.add('active-section');
    }

    function startTestMode() {
        cardsLibrary.classList.remove('active-section');
        cardsLibrary.classList.add('hidden-section');
        testMode.classList.remove('hidden-section');
        testMode.classList.add('active-section');
        
        // Используем только карточки из выбранной категории
        let cardsToTest = [...cards];
        
        if (currentCategory !== 'all') {
            cardsToTest = cardsToTest.filter(card => card.category === currentCategory);
        }
        
        // Перемешиваем карточки для теста
        testStack = cardsToTest.sort(() => Math.random() - 0.5);
        testCurrentIndex = 0;
        testCorrectCount = 0;
        
        totalCards.textContent = testStack.length;
        currentCardNum.textContent = testCurrentIndex + 1;
        correctAnswers.textContent = testCorrectCount;
        
        showTestCard();
    }

    function showTestCard() {
        if (testCurrentIndex >= testStack.length) {
            alert(`Тест завершен! Ваш результат: ${testCorrectCount} из ${testStack.length}`);
            exitTestMode();
            return;
        }
        
        const card = testStack[testCurrentIndex];
        testCard.querySelector('.flashcard-front').textContent = card.front;
        testAnswer.value = '';
        testResult.classList.add('hidden');
        nextTestCardBtn.classList.add('hidden');
        testAnswer.disabled = false;
        checkAnswerBtn.disabled = false;
        
        currentCardNum.textContent = testCurrentIndex + 1;
    }

    function checkAnswer() {
        const userAnswer = testAnswer.value.trim().toLowerCase();
        const correctAnswerText = testStack[testCurrentIndex].back.toLowerCase();
        
        testResult.classList.remove('hidden');
        testAnswer.disabled = true;
        checkAnswerBtn.disabled = true;
        
        // Простая проверка на совпадение или содержание ключевых слов
        const isCorrect = userAnswer === correctAnswerText || 
                         (userAnswer.length > 3 && correctAnswerText.includes(userAnswer)) ||
                         (correctAnswerText.length > 3 && userAnswer.includes(correctAnswerText));
        
        if (isCorrect) {
            testResult.className = 'correct';
            resultMessage.textContent = 'Правильно!';
            testCorrectCount++;
            correctAnswers.textContent = testCorrectCount;
        } else {
            testResult.className = 'incorrect';
            resultMessage.textContent = 'Неправильно.';
            correctAnswer.textContent = `Правильный ответ: ${testStack[testCurrentIndex].back}`;
        }
        
        nextTestCardBtn.classList.remove('hidden');
    }

    function nextTestCard() {
        testCurrentIndex++;
        showTestCard();
    }

    function exitTestMode() {
        testMode.classList.remove('active-section');
        testMode.classList.add('hidden-section');
        cardsLibrary.classList.remove('hidden-section');
        cardsLibrary.classList.add('active-section');
    }

    function updateButtonsState() {
        const hasCards = cards.length > 0;
        startStudyBtn.disabled = !hasCards;
        startTestBtn.disabled = !hasCards;
        
        if (!hasCards) {
            startStudyBtn.style.opacity = '0.5';
            startTestBtn.style.opacity = '0.5';
        } else {
            startStudyBtn.style.opacity = '1';
            startTestBtn.style.opacity = '1';
        }
    }

    function deleteCard(index) {
        if (confirm('Вы уверены, что хотите удалить эту карточку?')) {
            cards.splice(index, 1);
            localStorage.setItem('flashcards', JSON.stringify(cards));
            renderCards();
            updateButtonsState();
        }
    }
});