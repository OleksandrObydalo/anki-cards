import { CardCollection } from './models.js';
import { fileToBase64, resizeImage, displayImage } from './imageUtils.js';
import { marked } from "marked";

// UI class - moved from app.js and enhanced with image functionality
export class UI {
    constructor() {
        this.cardCollection = new CardCollection();
        this.currentScreen = 'welcome';
        this.studyCards = [];
        this.currentCardIndex = 0;
        this.currentCardId = null;
        this.studyMode = 'due'; // Режим изучения: 'due' - по сроку, 'tag' - по тегу, 'repeat' - повторение
        this.studyTag = null; // Выбранный тег для изучения
        this.currentImage = null; // Текущее изображение в форме добавления/редактирования
        
        this.initElements();
        this.bindEvents();
        this.updateStats();
    }
    
    // Инициализация элементов интерфейса
    initElements() {
        // Основные кнопки навигации
        this.addCardBtn = document.getElementById('add-card-btn');
        this.studyBtn = document.getElementById('study-btn');
        this.manageBtn = document.getElementById('manage-btn');
        
        // Экраны
        this.welcomeScreen = document.getElementById('welcome-screen');
        this.addCardScreen = document.getElementById('add-card-screen');
        this.studyScreen = document.getElementById('study-screen');
        this.manageScreen = document.getElementById('manage-screen');
        
        // Элементы формы добавления карточки
        this.frontContentInput = document.getElementById('front-content');
        this.backContentInput = document.getElementById('back-content');
        this.tagsInput = document.getElementById('tags');
        this.saveCardBtn = document.getElementById('save-card');
        this.cancelAddBtn = document.getElementById('cancel-add');
        this.imageUploadInput = document.getElementById('image-upload');
        this.imagePreview = document.getElementById('image-preview');
        this.removeImageBtn = document.getElementById('remove-image');
        
        // Элементы экрана изучения
        this.cardFrontContent = document.getElementById('card-front-content');
        this.cardBackContent = document.getElementById('card-back-content');
        this.cardImagePreview = document.getElementById('card-image-preview');
        this.showAnswerBtn = document.getElementById('show-answer');
        this.ratingButtons = document.querySelector('.rating-buttons');
        this.currentCardCounter = document.getElementById('current-card');
        this.totalStudyCards = document.getElementById('total-study-cards');
        this.finishStudyBtn = document.getElementById('finish-study');
        
        // Элементы экрана управления
        this.searchCardsInput = document.getElementById('search-cards');
        this.filterTagsSelect = document.getElementById('filter-tags');
        this.cardsList = document.querySelector('.cards-list');
        
        // Элементы для изучения по темам и повторения
        this.studyByTagBtn = document.getElementById('study-by-tag');
        this.repeatCardsBtn = document.getElementById('repeat-cards');
        this.studyTagSelect = document.getElementById('study-tag-select');
        
        // Модальное окно редактирования
        this.editModal = document.getElementById('edit-modal');
        this.editFrontContent = document.getElementById('edit-front-content');
        this.editBackContent = document.getElementById('edit-back-content');
        this.editTags = document.getElementById('edit-tags');
        this.editImageUpload = document.getElementById('edit-image-upload');
        this.editImagePreview = document.getElementById('edit-image-preview');
        this.editRemoveImageBtn = document.getElementById('edit-remove-image');
        this.updateCardBtn = document.getElementById('update-card');
        this.deleteCardBtn = document.getElementById('delete-card');
        this.closeModalBtn = document.querySelector('.close-modal');
        
        // Статистика на главном экране
        this.totalCardsElement = document.getElementById('total-cards');
        this.dueTodayElement = document.getElementById('due-today');
    }
    
    // Привязка обработчиков событий
    bindEvents() {
        // Навигация
        this.addCardBtn.addEventListener('click', () => this.showScreen('add-card'));
        this.studyBtn.addEventListener('click', () => this.startStudy());
        this.manageBtn.addEventListener('click', () => this.showScreen('manage'));
        
        // Добавление карточки
        this.saveCardBtn.addEventListener('click', () => this.saveCard());
        this.cancelAddBtn.addEventListener('click', () => this.showScreen('welcome'));
        
        // Обработка изображений
        if (this.imageUploadInput) {
            this.imageUploadInput.addEventListener('change', (e) => this.handleImageUpload(e, this.imagePreview));
            this.removeImageBtn.addEventListener('click', () => this.removeImage());
        }
        
        if (this.editImageUpload) {
            this.editImageUpload.addEventListener('change', (e) => this.handleImageUpload(e, this.editImagePreview, 'edit'));
            this.editRemoveImageBtn.addEventListener('click', () => this.removeImage('edit'));
        }
        
        // Изучение
        this.showAnswerBtn.addEventListener('click', () => this.showAnswer());
        this.ratingButtons.addEventListener('click', (e) => {
            if (e.target.classList.contains('rating-btn')) {
                this.rateCard(e.target.dataset.rating);
            }
        });
        this.finishStudyBtn.addEventListener('click', () => this.finishStudy());
        
        // Управление
        this.searchCardsInput.addEventListener('input', () => this.filterCards());
        this.filterTagsSelect.addEventListener('change', () => this.filterCards());
        
        // Обучение по темам и повторение
        this.studyByTagBtn.addEventListener('click', () => this.showTagSelection());
        this.repeatCardsBtn.addEventListener('click', () => this.startRepeat());
        document.getElementById('start-tag-study').addEventListener('click', () => this.startStudyByTag());
        
        // Редактирование
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.updateCardBtn.addEventListener('click', () => this.updateCard());
        this.deleteCardBtn.addEventListener('click', () => this.deleteCard());
        
        // Закрытие модального окна при клике вне его
        window.addEventListener('click', (e) => {
            if (e.target === this.editModal) {
                this.closeModal();
            }
            if (e.target === document.getElementById('tag-selection-modal')) {
                document.getElementById('tag-selection-modal').style.display = 'none';
            }
        });
        
        // Закрытие модального окна выбора тега
        document.querySelector('.close-modal-tag').addEventListener('click', () => {
            document.getElementById('tag-selection-modal').style.display = 'none';
        });
    }
    
    // Обработка загрузки изображения
    async handleImageUpload(event, previewElement, mode = 'add') {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.match('image.*')) {
            alert('Пожалуйста, выберите изображение');
            return;
        }
        
        try {
            let base64Image = await fileToBase64(file);
            // Resize image
            base64Image = await resizeImage(base64Image);
            
            // Display preview
            displayImage(base64Image, previewElement);
            
            // Store the image
            if (mode === 'add') {
                this.currentImage = base64Image;
            } else {
                this.editCurrentImage = base64Image;
            }
        } catch (error) {
            console.error('Error processing image:', error);
            alert('Ошибка при обработке изображения');
        }
    }
    
    // Удаление изображения
    removeImage(mode = 'add') {
        if (mode === 'add') {
            this.currentImage = null;
            this.imagePreview.innerHTML = '';
            this.imageUploadInput.value = '';
        } else {
            this.editCurrentImage = null;
            this.editImagePreview.innerHTML = '';
            this.editImageUpload.value = '';
        }
    }
    
    // Показать выбранный экран
    showScreen(screenName) {
        // Скрыть все экраны
        this.welcomeScreen.classList.remove('active');
        this.addCardScreen.classList.remove('active');
        this.studyScreen.classList.remove('active');
        this.manageScreen.classList.remove('active');
        
        // Показать выбранный экран
        switch(screenName) {
            case 'welcome':
                this.welcomeScreen.classList.add('active');
                this.updateStats();
                break;
            case 'add-card':
                this.addCardScreen.classList.add('active');
                this.clearAddCardForm();
                break;
            case 'study':
                this.studyScreen.classList.add('active');
                break;
            case 'manage':
                this.manageScreen.classList.add('active');
                this.loadCardsList();
                this.loadTagsFilter();
                break;
        }
        
        this.currentScreen = screenName;
    }
    
    // Обновление статистики на главном экране
    updateStats() {
        const totalCards = this.cardCollection.cards.length;
        const dueToday = this.cardCollection.getCardsForStudy().length;
        
        this.totalCardsElement.textContent = totalCards;
        this.dueTodayElement.textContent = dueToday;
    }
    
    // Очистка формы добавления карточки
    clearAddCardForm() {
        this.frontContentInput.value = '';
        this.backContentInput.value = '';
        this.tagsInput.value = '';
        this.currentImage = null;
        if (this.imagePreview) {
            this.imagePreview.innerHTML = '';
        }
        if (this.imageUploadInput) {
            this.imageUploadInput.value = '';
        }
    }
    
    // Сохранение новой карточки
    saveCard() {
        const front = this.frontContentInput.value.trim();
        const back = this.backContentInput.value.trim();
        const tags = this.tagsInput.value.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
        
        if (!front || !back) {
            alert('Пожалуйста, заполните обе стороны карточки');
            return;
        }
        
        this.cardCollection.addCard(front, back, tags, this.currentImage);
        this.showScreen('welcome');
    }
    
    // Показать выбор тега для изучения
    showTagSelection() {
        this.loadStudyTagSelect();
        document.getElementById('tag-selection-modal').style.display = 'block';
    }
    
    // Загрузка списка тегов для выбора изучения
    loadStudyTagSelect() {
        this.studyTagSelect.innerHTML = '';
        const tags = this.cardCollection.getTags();
        
        tags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            this.studyTagSelect.appendChild(option);
        });
    }
    
    // Начало изучения карточек по тегу
    startStudyByTag() {
        const selectedTag = this.studyTagSelect.value;
        if (!selectedTag) return;
        
        this.studyMode = 'tag';
        this.studyTag = selectedTag;
        this.studyCards = this.cardCollection.getCardsByTag(selectedTag);
        
        if (this.studyCards.length === 0) {
            alert('Нет карточек с выбранным тегом!');
            return;
        }
        
        document.getElementById('tag-selection-modal').style.display = 'none';
        this.currentCardIndex = 0;
        this.showScreen('study');
        this.showCurrentCard();
    }
    
    // Начало повторения ранее изученных карточек
    startRepeat() {
        this.studyMode = 'repeat';
        // Для повторения выбираем последние 20 изученных карточек, которые не запланированы на сегодня
        const reviewedCards = this.cardCollection.cards
            .filter(card => card.lastReviewed)
            .sort((a, b) => new Date(b.lastReviewed) - new Date(a.lastReviewed))
            .slice(0, 20);
            
        if (reviewedCards.length === 0) {
            alert('Нет карточек для повторения! Сначала изучите несколько карточек.');
            return;
        }
        
        this.studyCards = reviewedCards;
        this.currentCardIndex = 0;
        this.showScreen('study');
        this.showCurrentCard();
    }
    
    // Начало стандартного изучения (по сроку)
    startStudy() {
        this.studyMode = 'due';
        this.studyCards = this.cardCollection.getCardsForStudy();
        
        if (this.studyCards.length === 0) {
            alert('На сегодня нет карточек для изучения!');
            return;
        }
        
        this.currentCardIndex = 0;
        this.showScreen('study');
        this.showCurrentCard();
    }
    
    // Показать текущую карточку для изучения
    showCurrentCard() {
        const card = this.studyCards[this.currentCardIndex];
        this.currentCardId = card.id;
        
        // Обновление счетчика
        this.currentCardCounter.textContent = this.currentCardIndex + 1;
        this.totalStudyCards.textContent = this.studyCards.length;
        
        // Отображение содержимого с поддержкой Markdown
        this.cardFrontContent.innerHTML = marked.parse(card.front);
        this.cardBackContent.innerHTML = marked.parse(card.back);
        
        // Отображение изображения, если оно есть
        if (this.cardImagePreview) {
            displayImage(card.image, this.cardImagePreview);
        }
        
        // Сброс состояния карточки
        document.querySelector('.flashcard').classList.remove('flipped');
        this.showAnswerBtn.style.display = 'block';
        this.ratingButtons.classList.add('hidden');
    }
    
    // Показать ответ (перевернуть карточку)
    showAnswer() {
        document.querySelector('.flashcard').classList.add('flipped');
        this.showAnswerBtn.style.display = 'none';
        this.ratingButtons.classList.remove('hidden');
    }
    
    // Оценка знания карточки
    rateCard(rating) {
        this.cardCollection.updateCardWithRating(this.currentCardId, rating);
        
        // Переход к следующей карточке или завершение изучения
        this.currentCardIndex++;
        if (this.currentCardIndex < this.studyCards.length) {
            this.showCurrentCard();
        } else {
            const message = this.studyMode === 'due' ? 'Изучение завершено!' :
                           this.studyMode === 'tag' ? `Изучение карточек с тегом "${this.studyTag}" завершено!` :
                           'Повторение завершено!';
            alert(message);
            this.finishStudy();
        }
    }
    
    // Завершение изучения
    finishStudy() {
        this.showScreen('welcome');
    }
    
    // Загрузка списка карточек в экран управления
    loadCardsList() {
        this.cardsList.innerHTML = '';
        const query = this.searchCardsInput.value.trim().toLowerCase();
        const tag = this.filterTagsSelect.value;
        
        const filteredCards = this.cardCollection.searchCards(query, tag);
        
        if (filteredCards.length === 0) {
            this.cardsList.innerHTML = '<p class="no-cards">Нет карточек, соответствующих критериям поиска</p>';
            return;
        }
        
        filteredCards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card-item';
            
            const tagElements = card.tags.map(tag => 
                `<span class="card-tag">${tag}</span>`
            ).join('');
            
            const hasImage = card.image ? '<span class="has-image-indicator">🖼️</span>' : '';
            
            cardElement.innerHTML = `
                <div class="card-item-content">
                    <div class="card-term">${hasImage} ${card.front.substring(0, 50)}${card.front.length > 50 ? '...' : ''}</div>
                    <div class="card-definition">${card.back.substring(0, 100)}${card.back.length > 100 ? '...' : ''}</div>
                    <div class="card-tags">${tagElements}</div>
                </div>
                <div class="card-actions">
                    <button class="edit-card-btn" data-id="${card.id}">Редактировать</button>
                </div>
            `;
            
            this.cardsList.appendChild(cardElement);
            
            // Добавляем обработчик событий для кнопки редактирования
            cardElement.querySelector('.edit-card-btn').addEventListener('click', () => {
                this.openEditModal(card.id);
            });
        });
    }
    
    // Загрузка списка тегов для фильтра
    loadTagsFilter() {
        this.filterTagsSelect.innerHTML = '<option value="">Все теги</option>';
        
        const tags = this.cardCollection.getTags();
        
        tags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            this.filterTagsSelect.appendChild(option);
        });
    }
    
    // Фильтрация карточек в экране управления
    filterCards() {
        this.loadCardsList();
    }
    
    // Открытие модального окна редактирования
    openEditModal(cardId) {
        const card = this.cardCollection.cards.find(c => c.id === cardId);
        if (!card) return;
        
        this.currentCardId = cardId;
        this.editFrontContent.value = card.front;
        this.editBackContent.value = card.back;
        this.editTags.value = card.tags.join(', ');
        
        // Отображение изображения в форме редактирования, если оно есть
        this.editCurrentImage = card.image;
        if (this.editImagePreview) {
            displayImage(card.image, this.editImagePreview);
        }
        
        this.editModal.style.display = 'block';
    }
    
    // Закрытие модального окна
    closeModal() {
        this.editModal.style.display = 'none';
    }
    
    // Обновление карточки
    updateCard() {
        const front = this.editFrontContent.value.trim();
        const back = this.editBackContent.value.trim();
        const tags = this.editTags.value.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
        
        if (!front || !back) {
            alert('Пожалуйста, заполните обе стороны карточки');
            return;
        }
        
        this.cardCollection.updateCard(this.currentCardId, front, back, tags, this.editCurrentImage);
        this.closeModal();
        this.loadCardsList();
        this.loadTagsFilter();
    }
    
    // Удаление карточки
    deleteCard() {
        if (confirm('Вы уверены, что хотите удалить эту карточку?')) {
            this.cardCollection.deleteCard(this.currentCardId);
            this.closeModal();
            this.loadCardsList();
            this.loadTagsFilter();
            this.updateStats();
        }
    }
}