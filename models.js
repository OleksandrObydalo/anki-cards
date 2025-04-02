import { marked } from "marked";

// FlashCard class 
export class FlashCard {
    constructor(front, back, tags = [], image = null) {
        this.id = Date.now().toString(); // Уникальный ID
        this.front = front;
        this.back = back;
        this.tags = tags;
        this.image = image; // New property for image (base64 string)
        this.createdAt = new Date();
        this.lastReviewed = null;
        this.dueDate = new Date(); // По умолчанию доступно сразу
        this.interval = 0; // Интервал в днях
        this.easeFactor = 2.5; // Фактор легкости (начальное значение по алгоритму SM-2)
    }

    // Обновление карточки в соответствии с алгоритмом SM-2 (Spaced Repetition)
    updateWithRating(rating) {
        this.lastReviewed = new Date();
        
        // Определение нового интервала в зависимости от оценки
        switch(rating) {
            case 'again': // Снова
                this.interval = 0;
                this.easeFactor = Math.max(1.3, this.easeFactor - 0.2);
                break;
            case 'hard': // Сложно
                this.interval = this.interval === 0 ? 1 : Math.ceil(this.interval * 1.2);
                this.easeFactor = Math.max(1.3, this.easeFactor - 0.15);
                break;
            case 'good': // Хорошо
                if (this.interval === 0) this.interval = 1;
                else if (this.interval === 1) this.interval = 6;
                else this.interval = Math.ceil(this.interval * this.easeFactor);
                break;
            case 'easy': // Легко
                if (this.interval === 0) this.interval = 4;
                else if (this.interval === 1) this.interval = 7;
                else this.interval = Math.ceil(this.interval * this.easeFactor * 1.3);
                this.easeFactor = Math.min(3.0, this.easeFactor + 0.15);
                break;
        }
        
        // Установка следующей даты повторения
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + this.interval);
        this.dueDate = nextDate;
    }
}

// CardCollection class 
export class CardCollection {
    constructor() {
        this.cards = [];
        this.loadCards();
    }
    
    // Загрузка карточек из localStorage
    loadCards() {
        const savedCards = localStorage.getItem('flashcards');
        if (savedCards) {
            this.cards = JSON.parse(savedCards);
            // Преобразование строковых дат в объекты Date
            this.cards.forEach(card => {
                card.createdAt = new Date(card.createdAt);
                card.dueDate = new Date(card.dueDate);
                if (card.lastReviewed) {
                    card.lastReviewed = new Date(card.lastReviewed);
                }
            });
        }
    }
    
    // Сохранение карточек в localStorage
    saveCards() {
        localStorage.setItem('flashcards', JSON.stringify(this.cards));
    }
    
    // Добавление новой карточки
    addCard(front, back, tags, image = null) {
        const newCard = new FlashCard(front, back, tags, image);
        this.cards.push(newCard);
        this.saveCards();
        return newCard;
    }
    
    // Обновление существующей карточки
    updateCard(id, front, back, tags, image = null) {
        const index = this.cards.findIndex(card => card.id === id);
        if (index !== -1) {
            this.cards[index].front = front;
            this.cards[index].back = back;
            this.cards[index].tags = tags;
            if (image !== null) {
                this.cards[index].image = image;
            }
            this.saveCards();
            return true;
        }
        return false;
    }
    
    // Удаление карточки
    deleteCard(id) {
        const index = this.cards.findIndex(card => card.id === id);
        if (index !== -1) {
            this.cards.splice(index, 1);
            this.saveCards();
            return true;
        }
        return false;
    }
    
    // Получение карточек для изучения на сегодня
    getCardsForStudy() {
        const today = new Date();
        return this.cards.filter(card => card.dueDate <= today);
    }
    
    // Получение карточек по конкретной теме (тегу)
    getCardsByTag(tag) {
        return this.cards.filter(card => card.tags.includes(tag));
    }
    
    // Получение всех уникальных тегов
    getTags() {
        const allTags = this.cards.flatMap(card => card.tags);
        return [...new Set(allTags)];
    }
    
    // Поиск и фильтрация карточек
    searchCards(query, tag) {
        return this.cards.filter(card => {
            const matchesQuery = !query || 
                card.front.toLowerCase().includes(query.toLowerCase()) ||
                card.back.toLowerCase().includes(query.toLowerCase());
            
            const matchesTag = !tag || card.tags.includes(tag);
            
            return matchesQuery && matchesTag;
        });
    }
    
    // Обновление карточки после изучения
    updateCardWithRating(id, rating) {
        const index = this.cards.findIndex(card => card.id === id);
        if (index !== -1) {
            this.cards[index].updateWithRating(rating);
            this.saveCards();
            return true;
        }
        return false;
    }
}