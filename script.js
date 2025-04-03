document.addEventListener('DOMContentLoaded', function() {
    // DOM элементы
    const cardModal = document.getElementById('cardModal');
    const modalTitle = document.getElementById('modalTitle');
    const cardForm = document.getElementById('cardForm');
    const cardFrontInput = document.getElementById('cardFront');
    const cardBackInput = document.getElementById('cardBack');
    const cardsContainer = document.getElementById('cardsContainer');
    const noCardsMessage = document.getElementById('noCardsMessage');
    const addCardBtn = document.getElementById('addCardBtn');
    const cancelCardBtn = document.getElementById('cancelCardBtn');
    const modalClose = document.querySelector('.close');
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

    // Хранилище карточек
    let cards = JSON.parse(localStorage.getItem('flashcards')) || [];
    let currentEditingIndex = null;
    let currentStudyIndex = 0;
    let studyStack = [];
    let testStack = [];
    let testCurrentIndex = 0;
    let testCorrectCount = 0;

    // Инициализация приложения
    init();

    // Обработчики событий
    addCardBtn.addEventListener('click', openAddCardModal);
    cancelCardBtn.addEventListener('click', closeModal);
    modalClose.addEventListener('click', closeModal);
    cardForm.addEventListener('submit', saveCard);
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

    // Закрытие модального окна при клике вне его области
    window.addEventListener('click', function(event) {
        if (event.target === cardModal) {
            closeModal();
        }
    });

    // Функции приложения
    function init() {
        renderCards();
        updateButtonsState();
    }

    function renderCards() {
        cardsContainer.innerHTML = '';
        
        if (cards.length === 0) {
            noCardsMessage.style.display = 'block';
            return;
        }
        
        noCardsMessage.style.display = 'none';
        
        cards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card-item';
            cardElement.innerHTML = `
                <div class="card-term">${card.front}</div>
                <div class="card-definition">${card.back}</div>
                <div class="card-actions">
                    <button class="edit-btn" data-index="${index}">Изменить</button>
                    <button class="delete-btn" data-index="${index}">Удалить</button>
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

    function openAddCardModal() {
        modalTitle.textContent = 'Новая карточка';
        cardFrontInput.value = '';
        cardBackInput.value = '';
        currentEditingIndex = null;
        cardModal.style.display = 'block';
    }

    function openEditCardModal(index) {
        modalTitle.textContent = 'Редактировать карточку';
        const card = cards[index];
        cardFrontInput.value = card.front;
        cardBackInput.value = card.back;
        currentEditingIndex = index;
        cardModal.style.display = 'block';
    }

    function closeModal() {
        cardModal.style.display = 'none';
    }

    function saveCard(e) {
        e.preventDefault();
        
        const front = cardFrontInput.value.trim();
        const back = cardBackInput.value.trim();
        
        if (!front || !back) {
            alert('Пожалуйста, заполните оба поля');
            return;
        }
        
        const newCard = {
            front,
            back,
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
        closeModal();
        renderCards();
        updateButtonsState();
    }

    function deleteCard(index) {
        if (confirm('Вы уверены, что хотите удалить эту карточку?')) {
            cards.splice(index, 1);
            localStorage.setItem('flashcards', JSON.stringify(cards));
            renderCards();
            updateButtonsState();
        }
    }

    function startStudyMode() {
        cardsLibrary.classList.remove('active-section');
        cardsLibrary.classList.add('hidden-section');
        studyMode.classList.remove('hidden-section');
        studyMode.classList.add('active-section');
        
        // Формируем очередь карточек для изучения
        // Сначала новые карточки, затем те, что давно не повторялись и с высокой сложностью
        studyStack = [...cards].sort((a, b) => {
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
        
        // Перемешиваем карточки для теста
        testStack = [...cards].sort(() => Math.random() - 0.5);
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
});

