// ==========================================================================
// 1. قاعدة بيانات كروت مارفل والمنهج الدراسي المحدثة
// ==========================================================================
const CARDS = {
    'fe': { id: 'fe', name: 'Iron (Fe)', type: 'iron', image: 'fe.png' },
    'feo': { id: 'feo', name: 'Ferrous Oxide (FeO)', type: 'iron', image: 'feo.png' },
    'fe3o4': { id: 'fe3o4', name: 'Magnetite (Fe3O4)', type: 'iron', image: 'fe3o4.png' },
    'fe2o3': { id: 'fe2o3', name: 'Hematite (Fe2O3)', type: 'iron', image: 'fe2o3.png' },
    
    'o2': { id: 'o2', name: 'Oxygen Gas (O2)', type: 'agent', isOxidizer: true, image: 'o2.png' },
    'h2o': { id: 'h2o', name: 'Steam (H2O)', type: 'agent', isOxidizer: true, image: 'steam.png' },
    's': { id: 's', name: 'Sulphur (S)', type: 'agent', isOxidizer: true, image: 'sulphur.png' },
    
    'h2': { id: 'h2', name: 'Hydrogen Gas (H2)', type: 'agent', isOxidizer: false, image: 'h2.png' },
    'co': { id: 'co', name: 'Carbon Monoxide (CO)', type: 'agent', isOxidizer: false, image: 'co.png' },
    'watergas': { id: 'watergas', name: 'Water Gas', type: 'agent', isOxidizer: false, image: 'watergas.png' }
};

let currentAgentFilter = 'none'; 
let playerHand = ['fe', 'feo', 'fe3o4', 'fe2o3', 'o2', 'h2o', 's', 'h2', 'co', 'watergas'];

// --- 2. ربط عناصر واجهة المستخدم ---
const deckContainer = document.getElementById('inventory-deck');
const ironSlot = document.getElementById('slot-iron');
const agentSlot = document.getElementById('slot-agent');
const tempRange = document.getElementById('temp-range');
const tempDisplay = document.getElementById('temp-display');
const btnCombine = document.getElementById('btn-combine');
const btnClear = document.getElementById('btn-clear');
const btnResetHand = document.getElementById('btn-reset-inventory');
const btnToggleOxidizers = document.getElementById('btn-toggle-oxidizers');
const btnToggleReducers = document.getElementById('btn-toggle-reducers');

// المتغيرات الخاصة بالتحكم في أحداث اللمس للموبايل
let touchDraggedElement = null;

// --- 3. محرك عرض الكروت النظيف ---
function renderHand() {
    deckContainer.innerHTML = '';
    
    playerHand.forEach((cardId, index) => {
        const cardData = CARDS[cardId];
        if (!cardData) return;

        if (cardData.type === 'agent') {
            if (currentAgentFilter === 'none') return;
            if (currentAgentFilter === 'oxidizer' && !cardData.isOxidizer) return;
            if (currentAgentFilter === 'reducer' && cardData.isOxidizer) return;
        } else {
            if (currentAgentFilter !== 'none') return;
        }

        const cardElement = document.createElement('div');
        
        let baseStyles = 'w-20 aspect-[3/4] bg-slate-900 border-2 rounded-lg ';
        let motionStyles = 'overflow-hidden cursor-grab shadow transition-all duration-200 relative group ';
        let hoverEffects = 'hover:scale-110 hover:rotate-2 hover:shadow-lg hover:shadow-red-500/30 active:scale-95';
        
        let borderStyle = ' border-cyan-500';
        if (cardData.type === 'iron') {
            borderStyle = ' border-red-600';
        } else if (cardData.isOxidizer) {
            borderStyle = ' border-emerald-500';
        }

        cardElement.className = baseStyles + borderStyle + ' ' + motionStyles + hoverEffects;
        cardElement.draggable = true;
        cardElement.dataset.cardId = cardId;
        cardElement.dataset.handIndex = index;

        cardElement.innerHTML = '<img src="' + cardData.image + '" class="w-full h-full object-cover pointer-events-none">';

        // ربط الكمبيوتر
        cardElement.addEventListener('dragstart', handleDragStart);
        cardElement.addEventListener('dragend', handleDragEnd);

        // ربط شاشات التاتش والموبايل
        cardElement.addEventListener('touchstart', handleTouchStart, { passive: false });
        cardElement.addEventListener('touchmove', handleTouchMove, { passive: false });
        cardElement.addEventListener('touchend', handleTouchEnd, { passive: false });

        deckContainer.appendChild(cardElement);
    });
}

// --- 4. فلاتر التصفية الجانبية للأزرار ---
btnToggleOxidizers.addEventListener('click', () => {
    currentAgentFilter = (currentAgentFilter === 'oxidizer') ? 'none' : 'oxidizer';
    renderHand();
});

btnToggleReducers.addEventListener('click', () => {
    currentAgentFilter = (currentAgentFilter === 'reducer') ? 'none' : 'reducer';
    renderHand();
});

// --- 5. منطق السحب والإفلات (الماوس والكمبيوتر) ---
let draggedCardElement = null;

function handleDragStart(e) {
    draggedCardElement = this;
    this.classList.add('card-dragging');
    e.dataTransfer.setData('text/plain', this.dataset.cardId);
    e.dataTransfer.setData('source-index', this.dataset.handIndex);
}

function handleDragEnd() {
    this.classList.remove('card-dragging');
    document.querySelectorAll('[data-slot-type]').forEach(slot => slot.classList.remove('slot-active'));
}

[ironSlot, agentSlot].forEach(slot => {
    slot.addEventListener('dragover', (e) => {
        e.preventDefault();
        const expected = slot.dataset.slotType;
        const activeType = CARDS[draggedCardElement?.dataset.cardId]?.type;
        if (expected === activeType) slot.classList.add('slot-active');
    });

    slot.addEventListener('dragleave', () => slot.classList.remove('slot-active'));

    slot.addEventListener('drop', (e) => {
        e.preventDefault();
        slot.classList.remove('slot-active');
        const cardId = e.dataTransfer.getData('text/plain');
        const sourceIndex = parseInt(e.dataTransfer.getData('source-index'));
        executeCardDrop(slot, cardId, sourceIndex);
    });
});

// --- 📱 منطق اللمس والتاتش الجديد المعزز بالمساحات الهندسية الجغرافية ---
function handleTouchStart(e) {
    e.preventDefault();
    touchDraggedElement = this;
    this.classList.add('card-dragging');
    
    this.style.position = 'fixed';
    this.style.zIndex = '1000';
    updateTouchPosition(this, e.touches[0]);
}

function handleTouchMove(e) {
    if (!touchDraggedElement) return;
    e.preventDefault();
    const touch = e.touches[0];
    updateTouchPosition(touchDraggedElement, touch);
    
    // التحقق الهندسي الفوري من مرور الإصبع فوق الصناديق لتفعيل الإضاءة النيون
    checkTouchBoundary(touch.clientX, touch.clientY);
}

function handleTouchEnd(e) {
    if (!touchDraggedElement) return;
    e.preventDefault();
    
    touchDraggedElement.classList.remove('card-dragging');
    const touch = e.changedTouches[0];
    
    const cardId = touchDraggedElement.dataset.cardId;
    const sourceIndex = parseInt(touchDraggedElement.dataset.handIndex);
    const cardData = CARDS[cardId];
    
    // حساب المربع الهندسي الدقيق لكل خانة إسقاط بالبكسل لحل ثغرة الحجب
    const ironRect = ironSlot.getBoundingClientRect();
    const agentRect = agentSlot.getBoundingClientRect();
    
    let droppedInSlot = null;
    
    // هل إحداثيات إصبع الطالب تقع داخل حدود خانة مركب الحديد؟
    if (touch.clientX >= ironRect.left && touch.clientX <= ironRect.right &&
        touch.clientY >= ironRect.top && touch.clientY <= ironRect.bottom) {
        if (cardData.type === 'iron') droppedInSlot = ironSlot;
    }
    
    // هل إحداثيات إصبع الطالب تقع داخل حدود خانة العامل المساعد؟
    if (touch.clientX >= agentRect.left && touch.clientX <= agentRect.right &&
        touch.clientY >= agentRect.top && touch.clientY <= agentRect.bottom) {
        if (cardData.type === 'agent') droppedInSlot = agentSlot;
    }
    
    // تنظيف تأثيرات الإضاءة
    document.querySelectorAll('[data-slot-type]').forEach(s => s.classList.remove('slot-active'));
    
    if (droppedInSlot) {
        executeCardDrop(droppedInSlot, cardId, sourceIndex);
    } else {
        // إعادة الكارت فوراً لليد السفلية بشكل منظم لو أفلت بره
        touchDraggedElement.style.position = '';
        touchDraggedElement.style.zIndex = '';
        touchDraggedElement.style.left = '';
        touchDraggedElement.style.top = '';
        renderHand();
    }
    
    touchDraggedElement = null;
}

function updateTouchPosition(element, touch) {
    element.style.left = (touch.clientX - 40) + 'px';
    element.style.top = (touch.clientY - 53) + 'px';
}

function checkTouchBoundary(clientX, clientY) {
    const ironRect = ironSlot.getBoundingClientRect();
    const agentRect = agentSlot.getBoundingClientRect();
    const activeType = CARDS[touchDraggedElement?.dataset.cardId]?.type;
    
    document.querySelectorAll('[data-slot-type]').forEach(s => s.classList.remove('slot-active'));
    
    if (activeType === 'iron' && clientX >= ironRect.left && clientX <= ironRect.right &&
        clientY >= ironRect.top && clientY <= ironRect.bottom) {
        ironSlot.classList.add('slot-active');
    }
    
    if (activeType === 'agent' && clientX >= agentRect.left && clientX <= agentRect.right &&
        clientY >= agentRect.top && clientY <= agentRect.bottom) {
        agentSlot.classList.add('slot-active');
    }
}

function executeCardDrop(slot, cardId, sourceIndex) {
    const cardData = CARDS[cardId];
    const existingCardId = slot.dataset.currentCardId;
    
    if (existingCardId) playerHand.push(existingCardId);

    slot.dataset.currentCardId = cardId;
    
    let targetImg = '<img src="' + cardData.image + '" class="reactor-slot-img">';
    let removeBtn = '<button class="absolute-remove-btn" onclick="removeCardFromSlot(\'' + slot.id + '\')">×</button>';
    
    slot.innerHTML = '<div class="reactor-slot-wrapper">' + targetImg + removeBtn + '</div>';

    playerHand.splice(sourceIndex, 1);
    renderHand();
}

window.removeCardFromSlot = function(slotId) {
    const slot = document.getElementById(slotId);
    const cardId = slot.dataset.currentCardId;
    if (cardId) {
        playerHand.push(cardId);
        delete slot.dataset.currentCardId;
        let baseText = slot.dataset.slotType === 'iron' ? 'Station Card' : 'Agent';
        slot.innerHTML = '<span class="slot-placeholder">Drop ' + baseText + '</span>';
        renderHand();
        }
    };
    
    // --- 6. مصفوفة الكيمياء التفاعلية الحاضنة للمعادلات المختبرة علمياً ---
    function calculateReactionOutput(ironId, agentId, temp) {
        const agent = CARDS[agentId];
        if (agent.isOxidizer) {
            if (ironId === 'fe' && (agentId === 'o2' || agentId === 'h2o')) return 'fe3o4';
            if (ironId === 'fe' && agentId === 's') return 'fe3o4';
            if (ironId === 'feo' && agentId === 'o2') return 'fe2o3';
            if (ironId === 'fe3o4' && agentId === 'o2') return 'fe2o3';
        } else {
            if (ironId === 'fe2o3') {
                if (temp >= 230 && temp <= 300) return 'fe3o4';
                if (temp >= 400 && temp <= 700) return 'feo';
                if (temp > 700) return 'fe';
            }
            if (ironId === 'fe3o4') {
                if (temp > 700) return 'fe';
                if (temp >= 400 && temp <= 700) return 'feo';
            }
            if (ironId === 'feo' && temp > 700) return 'fe';
        }
        return null;
    }
    
    // --- 7. أزرار التحكم بالدمج ومراقب الشاشات المنبثقة للنتائج ---
    const reactionPopup = document.getElementById('reaction-popup');
    const popupTitle = document.getElementById('popup-title');
    const popupCardFrame = document.getElementById('popup-card-frame');
    const popupMessage = document.getElementById('popup-message');
    const btnPopupClose = document.getElementById('btn-popup-close');
    
    btnCombine.addEventListener('click', () => {
        const ironId = ironSlot.dataset.currentCardId;
        const agentId = agentSlot.dataset.currentCardId;
        const currentTemp = parseInt(tempRange.value);
    
        if (!ironId || !agentId) return;
    
        const resultCardId = calculateReactionOutput(ironId, agentId, currentTemp);
    
        if (resultCardId) {
            const producedCard = CARDS[resultCardId];
            playerHand.push(resultCardId);
            
            delete ironSlot.dataset.currentCardId;
            delete agentSlot.dataset.currentCardId;
            
            ironSlot.innerHTML = '<span class="slot-placeholder">Drop Station Card</span>';
            agentSlot.innerHTML = '<span class="slot-placeholder">Drop Agent Card</span>';
            
            popupTitle.innerText = "SUCCESSFUL REACTION!";
            popupTitle.className = "success-title";
            popupCardFrame.innerHTML = '<img src="' + producedCard.image + '">';
            
            let successMsg = "Formula computed successfully! " + producedCard.name;
            successMsg += " card unlocked and added to storage deck.";
            popupMessage.innerText = successMsg;
            
            currentAgentFilter = 'none';
            renderHand();
            
            reactionPopup.classList.remove('popup-hidden');
        } else {
            popupTitle.innerText = "REACTION FAILED!";
            popupTitle.className = "fail-title";
            popupCardFrame.innerHTML = '';
            
            let failMsg = "The selected combination or current reactor temperature ";
            failMsg += "do not react under the curriculum matrix rules.";
            popupMessage.innerText = failMsg;
            
            reactionPopup.classList.remove('popup-hidden');
        }
    });
    
    btnPopupClose.addEventListener('click', () => {
        reactionPopup.classList.add('popup-hidden');
    });
    
    function clearBoard() {
        removeCardFromSlot('slot-iron');
        removeCardFromSlot('slot-agent');
    }
    btnClear.addEventListener('click', clearBoard);
    
    btnResetHand.addEventListener('click', () => {
        clearBoard();
        playerHand = ['fe', 'feo', 'fe3o4', 'fe2o3', 'o2', 'h2o', 's', 'h2', 'co', 'watergas'];
        currentAgentFilter = 'none';
        renderHand();
    });
    
    tempRange.addEventListener('input', (e) => {
        tempDisplay.innerText = e.target.value + '°C';
    });
    
    // بدء رندرة اليد فوراً عند تحميل ملف الجافا سكريبت
    renderHand();
    
