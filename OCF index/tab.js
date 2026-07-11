function switchTab(event, tabId) {
      const panels = document.querySelectorAll('.tab-pan');
      panels.forEach(panel => panel.classList.remove('active'));

      const buttons = document.querySelectorAll('.tab');
      buttons.forEach(btn => btn.classList.remove('active'));

      document.getElementById(tabId).classList.add('active');
      event.currentTarget.classList.add('active');
    }
