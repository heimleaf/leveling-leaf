/* =============================================================================
SCRIPT: SCHEDULE LOGIC + THEME TOGGLE + MODAL + EXPANDABLE BLOCKS
============================================================================= */
document.addEventListener('DOMContentLoaded', function() {
    console.log('■ SYSTEM READY: SCHEDULE MODE ■');
    
    /* ---------------------------------------------------------------------
       THEME TOGGLE - Smart Default
       --------------------------------------------------------------------- */
    var themeToggle = document.getElementById('theme-toggle');
    var body = document.body;
    
    function applySmartTheme() {
        var isDesktop = window.matchMedia('(min-width: 769px)').matches;
        var now = new Date();
        var dayOfWeek = now.getDay();
        var currentHour = now.getHours();
        var currentMinutes = now.getMinutes();
        var currentTimeInMinutes = currentHour * 60 + currentMinutes;
        var workStart = 9 * 60;
        var workEnd = 18 * 60;
        var isWorkHours = currentTimeInMinutes >= workStart && currentTimeInMinutes < workEnd;
        var isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
        
        if (isDesktop && isWeekday && isWorkHours) {
            body.classList.add('light-theme');
            body.classList.remove('dark-theme');
        } else {
            body.classList.add('dark-theme');
            body.classList.remove('light-theme');
        }
        updateToggleText();
    }
    
    function updateToggleText() {
        var isLight = body.classList.contains('light-theme');
        themeToggle.textContent = isLight ? 'В ТЬМУ' : 'НА СВЕТ';
    }
    
    applySmartTheme();
    
    themeToggle.addEventListener('click', function() {
        if (body.classList.contains('light-theme')) {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
        } else {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
        }
        updateToggleText();
    });
    
    /* ---------------------------------------------------------------------
       MODAL LOGIC
       --------------------------------------------------------------------- */
    var openModalBtn = document.getElementById('open-schedule-modal');
    var closeModalBtn = document.getElementById('close-modal');
    var modal = document.getElementById('schedule-modal');
    var modalWeekdayBtn = document.getElementById('modal-weekday');
    var modalWeekendBtn = document.getElementById('modal-weekend');
    
    var modalViewType = null;
    
    function openModal() {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        var now = new Date();
        var isWeekend = (now.getDay() === 0 || now.getDay() === 6);
        modalViewType = isWeekend ? 'weekend' : 'weekday';
        updateModalButtons();
        filterModalItems();
    }
    
    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    function updateModalButtons() {
        if (modalViewType === 'weekday') {
            modalWeekdayBtn.classList.add('active');
            modalWeekendBtn.classList.remove('active');
        } else {
            modalWeekendBtn.classList.add('active');
            modalWeekdayBtn.classList.remove('active');
        }
    }
    
    function parseTimeToMinutes(timeStr) {
        var parts = timeStr.split(':');
        var hours = parseInt(parts[0], 10);
        var minutes = parseInt(parts[1], 10);
        return hours * 60 + minutes;
    }
    
    function isCurrentTimeSlot(item, currentTimeInMinutes) {
        var start = item.dataset.timeStart;
        var end = item.dataset.timeEnd;
        if (!start || !end) return false;
        var startMin = parseTimeToMinutes(start);
        var endMin = parseTimeToMinutes(end);
        return currentTimeInMinutes >= startMin && currentTimeInMinutes < endMin;
    }
    
    function filterModalItems() {
        var now = new Date();
        var currentMinutes = now.getHours() * 60 + now.getMinutes();
        var modalItems = modal.querySelectorAll('.timeline-item');
        
        modalItems.forEach(function(item) {
            var itemType = item.dataset.dayType;
            var matchesView = itemType === modalViewType;
            
            if (matchesView) {
                item.classList.remove('hidden');
                if (isCurrentTimeSlot(item, currentMinutes)) {
                    item.classList.add('current-slot');
                } else {
                    item.classList.remove('current-slot');
                }
            } else {
                item.classList.add('hidden');
                item.classList.remove('current-slot');
            }
        });
    }
    
    if (openModalBtn) openModalBtn.addEventListener('click', openModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    
    if (modalWeekdayBtn) {
        modalWeekdayBtn.addEventListener('click', function() {
            modalViewType = 'weekday';
            updateModalButtons();
            filterModalItems();
        });
    }
    
    if (modalWeekendBtn) {
        modalWeekendBtn.addEventListener('click', function() {
            modalViewType = 'weekend';
            updateModalButtons();
            filterModalItems();
        });
    }
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeModal();
        }
    });
    
    /* ---------------------------------------------------------------------
       EXPANDABLE CONTENT IN MODAL
       --------------------------------------------------------------------- */
    var modalExpandableItems = modal ? modal.querySelectorAll('.timeline-item.expandable') : [];
    
    modalExpandableItems.forEach(function(item) {
        item.addEventListener('click', function(e) {
            if (e.target.closest('a') || e.target.closest('input') || e.target.closest('button')) {
                return;
            }
            
            var isExpanded = item.classList.contains('expanded');
            
            modalExpandableItems.forEach(function(i) {
                if (i !== item) i.classList.remove('expanded');
            });
            
            item.classList.toggle('expanded', !isExpanded);
        });
    });
    
    /* ---------------------------------------------------------------------
       CURRENT TASK DISPLAY - FIX: Use modal items as source
       --------------------------------------------------------------------- */
    var currentTaskContainer = document.getElementById('current-task-container');
    var currentTaskContent = document.getElementById('current-task-content');
    
    function cloneItemForCurrentTask(item) {
        var clone = item.cloneNode(true);
        clone.classList.remove('current-slot', 'hidden', 'expandable', 'non-expandable');
        clone.style.borderLeft = '';
        clone.style.background = '';
        clone.style.cursor = 'default';
        
        var marker = clone.querySelector('.timeline-marker');
        if (marker) marker.remove();
        
        var arrow = clone.querySelector('.expand-arrow');
        if (arrow) arrow.remove();
        
        clone.onclick = null;
        
        var expandable = clone.querySelector('.expandable-content');
        if (expandable) {
            expandable.style.maxHeight = '1200px';
            expandable.style.padding = '15px';
        }
        return clone;
    }
    
    function updateCurrentTaskDisplay() {
        // FIX: Always get fresh time values
        var now = new Date();
        var dayOfWeek = now.getDay();
        var currentHour = now.getHours();
        var currentMinutes = now.getMinutes();
        var currentTimeInMinutes = currentHour * 60 + currentMinutes;
        
        var isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        var expectedType = isWeekend ? 'weekend' : 'weekday';
        
        var activeItems = [];
        
        // FIX: Search in modal for timeline items (they exist only there)
        var allTimelineItems = modal ? modal.querySelectorAll('.timeline-item') : [];
        
        allTimelineItems.forEach(function(item) {
            var itemType = item.dataset.dayType;
            var matchesDay = itemType === expectedType;
            var matchesTime = isCurrentTimeSlot(item, currentTimeInMinutes);
            
            if (matchesDay && matchesTime) {
                activeItems.push(item);
            }
        });
        
        // Update current task block at top
        currentTaskContent.innerHTML = '';
        if (activeItems.length > 0) {
            activeItems.forEach(function(item) {
                var cloned = cloneItemForCurrentTask(item);
                currentTaskContent.appendChild(cloned);
            });
            currentTaskContainer.style.display = 'block';
        } else {
            currentTaskContent.innerHTML = '<p class="text-muted">Задач на текущий интервал не запланировано.</p>';
            currentTaskContainer.style.display = 'block';
        }
    }
    
    // Initial load
    updateCurrentTaskDisplay();
    
    // Re-check every minute
    setInterval(updateCurrentTaskDisplay, 60000);
    
    /* ---------------------------------------------------------------------
       SCROLL REVEAL ANIMATION
       --------------------------------------------------------------------- */
    var observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -20px 0px'
    };
    
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    var animatedElements = document.querySelectorAll('.timeline-item, .press-clipping, .section-title');
    animatedElements.forEach(function(el) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(10px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
    
    var style = document.createElement('style');
    style.textContent = '.fade-in { opacity: 1 !important; transform: translateY(0) !important; }';
    document.head.appendChild(style);
});
