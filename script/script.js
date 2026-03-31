 const annotations = {};
  let mediaRecorder = null;
  let audioChunks = [];
  let isRecording = false;
  let pendingPara = null;
  let annoCounter = 0;
 
  const paraSnippets = {
    '1': 'Once when I was six years old I saw a magnificent picture in a book',
    '2': 'In the book it said:',
    '3': 'I pondered deeply, then, over the adventures of the jungle',
  };
 
  function setStatus(msg) {
    document.getElementById('status').textContent = msg;
  }
 
  function renderAnnotations() {
    const list = document.getElementById('anno-list');
    const count = document.getElementById('anno-count');
    const ids = Object.keys(annotations).sort((a, b) => annotations[a].order - annotations[b].order);
    count.textContent = ids.length;
 
    if (ids.length === 0) {
      list.innerHTML = '<p>No annotations yet. Focus on a paragraph and click + annotation.</p>';
      return;
    }
 
    list.innerHTML = '';
    ids.forEach(paraId => {
      const a = annotations[paraId];
      const card = document.createElement('div');
      card.className = 'anno-card';
      card.setAttribute('role', 'region');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Annotation ${a.order}: paragraph ${paraId}, ${a.snippet}`);
      card.innerHTML = `
        <div>
          <span class="badge" aria-hidden="true">${a.order}</span>
          <span style="font-size:13px;font-weight:500;">Paragraph ${paraId}</span>
        </div>
        <div class="snippet">${a.snippet}</div>
        ${a.url
          ? `<audio controls src="${a.url}" aria-label="Audio-notitie bij alinea ${paraId}"></audio>`
          : '<span style="font-size:12px;color:#888780;">Geen opname</span>'
        }
      `;
      card.addEventListener('click', () => focusPara(paraId));
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') focusPara(paraId);
      });
      list.appendChild(card);
    });
  }
 
  function focusPara(paraId) {
    const badge = document.querySelector(`.anchor-badge[data-para="${paraId}"]`);
    if (badge) badge.focus();
  }
 
  function selectPara(paraId) {
    pendingPara = paraId;
    const btn = document.getElementById('rec-btn');
    btn.disabled = false;
    btn.setAttribute('aria-label', 'Start audio-opname');
    document.getElementById('rec-label').textContent = 'Opname starten';
    const info = document.getElementById('pending-info');
    info.style.display = 'block';
    info.textContent = `Alinea ${paraId} geselecteerd`;
    setStatus(`Alinea ${paraId} geselecteerd. Druk op opname of R om te starten.`);
  }
 
  document.querySelectorAll('.add-anno-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const paraId = btn.closest('.para-block').dataset.para;
      selectPara(paraId);
 
      if (!annotations[paraId]) {
        annoCounter++;
        annotations[paraId] = { order: annoCounter, snippet: paraSnippets[paraId], url: null };
 
        const p = btn.closest('p');
        btn.remove();
 
        const badge = document.createElement('button');
        badge.className = 'anchor-badge';
        badge.dataset.para = paraId;
        badge.setAttribute('aria-label', `Annotatie ${annoCounter} bij alinea ${paraId}: klik om te selecteren`);
        badge.setAttribute('tabindex', '0');
        badge.textContent = annoCounter;
        badge.addEventListener('click', () => selectPara(paraId));
        p.appendChild(badge);
 
        renderAnnotations();
      }
 
      document.getElementById('rec-btn').focus();
    });
  });
 
  async function toggleRecording() {
    if (!pendingPara) {
      setStatus('Selecteer eerst een alinea.');
      return;
    }
 
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunks, { type: 'audio/webm' });
          annotations[pendingPara].url = URL.createObjectURL(blob);
          renderAnnotations();
          setStatus(`Opname opgeslagen bij alinea ${pendingPara}.`);
          stream.getTracks().forEach(t => t.stop());
        };
        mediaRecorder.start();
        isRecording = true;
        const btn = document.getElementById('rec-btn');
        btn.classList.add('recording');
        btn.setAttribute('aria-pressed', 'true');
        btn.setAttribute('aria-label', 'Stop opname');
        document.getElementById('rec-label').textContent = 'Stop opname';
        setStatus('Opname bezig...');
      } catch (e) {
        setStatus('Microfoon niet beschikbaar. Controleer de browserinstellingen.');
      }
    } else {
      mediaRecorder.stop();
      isRecording = false;
      const btn = document.getElementById('rec-btn');
      btn.classList.remove('recording');
      btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute('aria-label', 'Start audio-opname');
      document.getElementById('rec-label').textContent = 'Opname starten';
    }
  }
 
  document.getElementById('rec-btn').addEventListener('click', toggleRecording);
 
  document.addEventListener('keydown', e => {
    if ((e.key === 'r' || e.key === 'R') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      toggleRecording();
    }
  });
 
  renderAnnotations();