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

// الوضع الافتراضي للفلتر: يعرض كروت الحديد فقط عند تشغيل اللعبة لأول مرة
let currentAgentFilter = 'none'; 

// مصفوفة كروت اللاعب المتاحة
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

// --- 3. محرك عرض الكروت النظيف (تم حذف النصوص المتداخلة كلياً) ---
function renderHand() {
    deckContainer.innerHTML = '';
    
    playerHand.forEach((cardId, index) => {
        const cardData = CARDS[cardId];
        if (!cardData) return;

        // منطق الفصل: إذا كان كارت عامل مساعد، لا يظهر إلا عند تفعيل الفلتر المطابق بالضغط
        if (cardData.type === 'agent') {
            if (currentAgentFilter === 'none') return;
            if (currentAgentFilter === 'oxidizer' && !cardData.isOxidizer) return;
            if (currentAgentFilter === 'reducer' && cardData.isOxidizer) return;
        } else {
            // إذا كان كارت حديد (شخصية)، نخفيه لو كان اللاعب يتصفح العوامل حالياً ليبقى المخزن نظيفاً
            if (currentAgentFilter !== 'none') return;
        }

        const cardElement = document.createElement('div');
        
        // إدخال تأثير كروت سبايدرمان المتوهجة والاهتزاز الحركي عند الاختيار (Motion Effect)
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

        // عرض الصورة الصافية المرفوعة فقط بدون دمج أي نصوص برمجية مشوهة للتصميم
        cardElement.innerHTML = '<img src="' + cardData.image + '" class="w-full h-full object-cover pointer-events-none">';

        cardElement.addEventListener('dragstart', handleDragStart);
        cardElement.addEventListener('dragend', handleDragEnd);

        deckContainer.appendChild(cardElement);
    });
}

// --- 4. فلاتر التصفية الجانبية: تظهر وتختفي العوامل عند الضغط فقط ---
btnToggleOxidizers.addEventListener('click', () => {
    if (currentAgentFilter === 'oxidizer') {
        currentAgentFilter = 'none'; // يعود لعرض كروت الشخصيات
    } else {
        currentAgentFilter = 'oxidizer'; // يظهر الـ 3 كروت المؤكسدة فقط
    }
    renderHand();
});

btnToggleReducers.addEventListener('click', () => {
    if (currentAgentFilter === 'reducer') {
        currentAgentFilter = 'none';
    } else {
        currentAgentFilter = 'reducer'; // يظهر الكروت المختزلة فقط
    }
    renderHand();
});

// --- 5. منطق السحب والإفلات وتأثيرات الحركة الموضعية ---
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
        const cardData = CARDS[cardId];

        if (!cardData || slot.dataset.slotType !== cardData.type) return;

        const existingCardId = slot.dataset.currentCardId;
        if (existingCardId) playerHand.push(existingCardId);

        slot.dataset.currentCardId = cardId;
        
        // عرض الصورة الصافية داخل المفاعل وحذف زر الإغلاق والكلمات المتراكبة
      
                // تعديل كود الحقن لإلغاء الهوامش تماماً وجعل الصورة تمتد لتملأ الخانة بالكامل
                let targetImg = '<img src="' + cardData.image + '" class="reactor-slot-img">';
                let removeBtn = '<button class="absolute-remove-btn" onclick="removeCardFromSlot(\'' + slot.id + '\')">×</button>';
                
                slot.innerHTML = '<div class="reactor-slot-wrapper">' + targetImg + removeBtn + '</div>';
        
     

        playerHand.splice(sourceIndex, 1);
        renderHand();
    });
});

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

// --- 6. مصفوفة التحقق من معادلات دمج كيمياء الحديد المنبثقة من المنهج ---
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


   // --- 7. أزرار التحكم بالتفاعلات والنافذة المنبثقة (Pop-up Controller) ---
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
        
        // 🌟 إظهار النافذة المنبثقة في حالة النجاح وعرض صورة البطل ممتدة بالكامل
        popupTitle.innerText = "SUCCESSFUL REACTION!";
        popupTitle.className = "success-title";
        popupCardFrame.innerHTML = '<img src="' + producedCard.image + '">';
        popupMessage.innerText = "Formula computed successfully! " + producedCard.name + " card unlocked and added to storage deck.";
        
        currentAgentFilter = 'none';
        renderHand();
        
        reactionPopup.classList.remove('popup-hidden');
    } else {
        // 🌟 إظهار النافذة المنبثقة في حالة الفشل وإخفاء خانة الصورة
        popupTitle.innerText = "REACTION FAILED!";
        popupTitle.className = "fail-title";
        popupCardFrame.innerHTML = ''; // لا توجد صورة ناتج في حالة الفشل
        popupMessage.innerText = "The selected combination or current reactor temperature do not react under the curriculum matrix rules.";
        
        reactionPopup.classList.remove('popup-hidden');
    }
});

// إغلاق النافذة العائمة عند تجميع المكافأة
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

// تشغيل اللعبة وتحديث كروت مخزن اللاعب فوراً عند التحميل
renderHand();

