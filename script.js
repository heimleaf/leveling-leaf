/* =============================================================================
   SCRIPT: SCHEDULE LOGIC + THEME TOGGLE + EXPANDABLE BLOCKS
   ============================================================================= */
document.addEventListener('DOMContentLoaded', function() {
    console.log('SYSTEM READY: SCHEDULE MODE');

    /* ---------------------------------------------------------------------
       THEME TOGGLE
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

    if (themeToggle) {
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
    }

    /* ---------------------------------------------------------------------
       SCHEDULE TOGGLE (Weekday/Weekend) - Does NOT affect Current Task
       --------------------------------------------------------------------- */
    var scheduleWeekdayBtn = document.getElementById('schedule-weekday');
    var scheduleWeekendBtn = document.getElementById('schedule-weekend');
    var scheduleViewType = null;

    function updateScheduleButtons() {
        if (!scheduleWeekdayBtn || !scheduleWeekendBtn) return;
        if (scheduleViewType === 'weekday') {
            scheduleWeekdayBtn.classList.add('active');
            scheduleWeekendBtn.classList.remove('active');
        } else {
            scheduleWeekendBtn.classList.add('active');
            scheduleWeekdayBtn.classList.remove('active');
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

    function filterScheduleItems() {
        var now = new Date();
        var currentMinutes = now.getHours() * 60 + now.getMinutes();
        var timelineItems = document.querySelectorAll('.schedule-section .timeline-item');
        
        timelineItems.forEach(function(item) {
            var itemType = item.dataset.dayType;
            var matchesView = itemType === scheduleViewType;
            
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

    function initScheduleView() {
        var now = new Date();
        var isWeekend = (now.getDay() === 0 || now.getDay() === 6);
        scheduleViewType = isWeekend ? 'weekend' : 'weekday';
        updateScheduleButtons();
        filterScheduleItems();
    }

    if (scheduleWeekdayBtn) {
        scheduleWeekdayBtn.addEventListener('click', function() {
            scheduleViewType = 'weekday';
            updateScheduleButtons();
            filterScheduleItems();
        });
    }

    if (scheduleWeekendBtn) {
        scheduleWeekendBtn.addEventListener('click', function() {
            scheduleViewType = 'weekend';
            updateScheduleButtons();
            filterScheduleItems();
        });
    }

    /* ---------------------------------------------------------------------
       EXPANDABLE CONTENT
       --------------------------------------------------------------------- */
    var expandableItems = document.querySelectorAll('.timeline-item.expandable');

    expandableItems.forEach(function(item) {
        item.addEventListener('click', function(e) {
            if (e.target.closest('a') || e.target.closest('input') || e.target.closest('button')) {
                return;
            }
            
            var isExpanded = item.classList.contains('expanded');
            
            expandableItems.forEach(function(i) {
                if (i !== item) i.classList.remove('expanded');
            });
            
            item.classList.toggle('expanded', !isExpanded);
        });
    });

    /* ---------------------------------------------------------------------
       CURRENT TASK DISPLAY - Independent from Schedule Toggle
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
            expandable.style.maxHeight = '1000px';
            expandable.style.padding = '14px';
        }
        return clone;
    }

    function updateCurrentTaskDisplay() {
        var now = new Date();
        var dayOfWeek = now.getDay();
        var currentHour = now.getHours();
        var currentMinutes = now.getMinutes();
        var currentTimeInMinutes = currentHour * 60 + currentMinutes;
        
        var isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        var expectedType = isWeekend ? 'weekend' : 'weekday';
        
        var activeItems = [];
        var allTimelineItems = document.querySelectorAll('.schedule-section .timeline-item');
        
        allTimelineItems.forEach(function(item) {
            var itemType = item.dataset.dayType;
            var matchesDay = itemType === expectedType;
            var matchesTime = isCurrentTimeSlot(item, currentTimeInMinutes);
            
            if (matchesDay && matchesTime) {
                activeItems.push(item);
            }
        });
        
        if (currentTaskContent) {
            currentTaskContent.innerHTML = '';
            if (activeItems.length > 0) {
                activeItems.forEach(function(item) {
                    var cloned = cloneItemForCurrentTask(item);
                    currentTaskContent.appendChild(cloned);
                });
                if (currentTaskContainer) currentTaskContainer.style.display = 'block';
            } else {
                currentTaskContent.innerHTML = '<p class="text-muted">Задач на текущий интервал не запланировано.</p>';
                if (currentTaskContainer) currentTaskContainer.style.display = 'block';
            }
        }
    }

    /* ---------------------------------------------------------------------
       INITIALIZATION
       --------------------------------------------------------------------- */
    initScheduleView();
    updateCurrentTaskDisplay();
    
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
});
