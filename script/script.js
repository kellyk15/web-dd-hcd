// nav 
const menuBtn = document.querySelector('.menu');
const nav = document.querySelector('nav');

menuBtn.addEventListener('click', () => {
  nav.classList.toggle('open');
});


const annotations = {};
let mediaRecorder = null;

// Losse stukjes audio tijdens een opname
let audioChunks = []; 

let isRecording = false;
let pendingPara = null;
let annoCounter = 0;


const LANG = 'nl-NL';


// Per alinea staat hier een korte preview-tekst die in de annotatielijst wordt getoond
const paraSnippets = {
  '1': 'Once when I was six years old I saw a magnificent picture in a book',
  '2': 'In the book it said:',
  '3': 'I pondered deeply, then, over the adventures of the jungle',
};


// Stuurt een statusbericht naar het scherm (en voor screenreaders) zodat hij er niet doorheen praat tijdens het opnemen wat de hele tijd gebeurde
function setStatus(msg) {
  if (isRecording) return;
  document.getElementById('status').textContent = msg;
}


// Alle sneltoetsen voorlezen/stoppen
document.addEventListener('keydown', e => {
  const tag = e.target.tagName.toLowerCase();

  if (tag === 'textarea' || tag === 'input') return;

  //  Alt + H
  if (e.altKey && e.key.toLowerCase() === 'h') {
    e.preventDefault();

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      return;
    }

    const el = document.querySelector('#shortcuts .sr-only');
    if (!el) return;

    const tekst = el.textContent.trim();

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(tekst);
    utterance.lang = 'nl-NL';

    window.speechSynthesis.speak(utterance);
    setStatus('Sneltoetsen worden voorgelezen...');

    utterance.onend = () => setStatus('');
  }
});


// Stemmen herkennen
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

// Controle of het werkt
function setupRecognition() {
  if (!SpeechRecognition) {
    console.warn("SpeechRecognition not supported");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.lang = LANG; 
  recognition.interimResults = true;

  // geen dubbele transcripts
  // https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/result_event
  // https://blog.addpipe.com/a-deep-dive-into-the-web-speech-api/
  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        const transcript = event.results[i][0].transcript;

        if (pendingPara && annotations[pendingPara]) {
          annotations[pendingPara].transcript += transcript + " ";
        }
      }
    }

    renderAnnotations();
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    setStatus('Speech error: ' + event.error);
  };

  recognition.onend = () => {
    if (isRecording) {
      recognition.start();
    }
  };
}

setupRecognition();

// Render de lijst met annotaties in de sidebar
function renderAnnotations() {
  const list = document.getElementById('anno-list');
  const count = document.getElementById('anno-count');

  // Sorteren en tellen
  const ids = Object.keys(annotations).sort((a, b) => annotations[a].order - annotations[b].order);
  count.textContent = ids.length;

  // empty state van de annotatielijst
  if (ids.length === 0) {
    list.innerHTML = '<p class="anno-empty"> Geen annotaties beschikbaar. klik op de + knop om een annotatie toe te voegen.</p>';
    return;
  }

  // de kaart maken voor elke annotatie
  list.innerHTML = '';
  ids.forEach(paraId => {
    const a = annotations[paraId];
    const card = document.createElement('div');
    card.className = 'anno-card';
    card.setAttribute('role', 'region');
    card.setAttribute('aria-label', `Annotatie bij alinea ${paraId}`);
    card.setAttribute('tabindex', '-1'); 

    card.innerHTML = `
      <div>
        <span class="badge">${a.order}</span>
        <span>Paragraph ${paraId}</span>
      </div>
      <div class="snippet" aria-hidden="true">${a.snippet}</div>

      ${a.url
        ? `<audio controls src="${a.url}" aria-hidden="true"></audio>`
        : '<span style="font-size:12px;color:#888;">Geen opname</span>'
      }

      ${a.transcript
        ? `<div class="transcript">${a.transcript}</div>`
        : ''
      }
    `;

    card.addEventListener('click', (e) => {
      if (e.target === card || e.target.classList.contains('snippet') || e.target.classList.contains('badge')) {
        focusPara(paraId);
      }
    });

    // tekstnotitie veld
    const textarea = document.createElement('textarea');
    textarea.className = 'note-input';
    textarea.placeholder = 'Voeg een tekstnotitie toe...';
    textarea.value = a.note;
    textarea.setAttribute('tabindex', '0'); 
    textarea.setAttribute('aria-label', `Tekstnotitie bij alinea ${paraId}`);
    textarea.addEventListener('input', e => {
      annotations[paraId].note = e.target.value;
    });
    textarea.addEventListener('click', e => e.stopPropagation());
    textarea.addEventListener('focus', e => e.stopPropagation());  
    textarea.addEventListener('keydown', e => e.stopPropagation()); 
    card.appendChild(textarea);

    list.appendChild(card);
  });
}

function focusPara(paraId) {
  const badge = document.querySelector(`.anchor-badge[data-para="${paraId}"]`);
  if (badge) badge.focus();
}

// Selecteert een alinea voor opname en toont de opnameknop en info
function selectPara(paraId) {
  pendingPara = paraId;

  const btn = document.getElementById('rec-btn');
  btn.disabled = false;
  btn.setAttribute('aria-label', 'Klik hier op enter om de opname te starten');

  document.getElementById('rec-label').textContent = 'Opname starten';

  const info = document.getElementById('pending-info');
  info.style.display = 'block';
  info.textContent = `Alinea ${paraId} geselecteerd`;

  setStatus(`Alinea ${paraId} geselecteerd`);

  if (annotations[paraId]) {
    setTimeout(() => {
      const allTextareas = document.querySelectorAll('.note-input');
      const ids = Object.keys(annotations).sort((a, b) => annotations[a].order - annotations[b].order);
      const index = ids.indexOf(paraId);
      if (allTextareas[index]) {
        allTextareas[index].focus();
      }
    }, 50);
  }
}


// Alinea selecteren en annotatie toevoegen
document.querySelectorAll('.add-anno-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const paraId = btn.closest('.para-block').dataset.para;
    selectPara(paraId);

    if (!annotations[paraId]) {
      annoCounter++;

      annotations[paraId] = {
        order: annoCounter,
        snippet: paraSnippets[paraId],
        url: null,
        transcript: "",
        note: ""
      };

      const p = btn.closest('p');
      btn.remove();

      const badge = document.createElement('button');
      badge.className = 'anchor-badge';
      badge.dataset.para = paraId;
      badge.textContent = annoCounter;

      badge.addEventListener('click', () => selectPara(paraId));
      p.appendChild(badge);

      renderAnnotations();
    }

    document.getElementById('rec-btn').focus();
  });
});


// Stelt de aria-live eigenschap in voor verschillende elementen zodat screenreaders de juiste informatie voorlezen tijdens het opnemen en anders niet doorheen praten
function setAriaLive(enabled) {
  const regions = [
    { el: document.getElementById('anno-list'),    value: 'polite'    },
    { el: document.getElementById('anno-count'),   value: 'polite'    },
    { el: document.getElementById('pending-info'), value: 'polite'    },
    { el: document.getElementById('status'),       value: 'assertive' },
  ];
  regions.forEach(({ el, value }) => {
    if (!el) return;
    el.setAttribute('aria-live', enabled ? value : 'off');
  });
}

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
        setStatus(`Opname opgeslagen bij alinea ${pendingPara}`);

        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();

      if (recognition) {
        recognition.start(); 
      }

      isRecording = true;
      setAriaLive(false);

      const btn = document.getElementById('rec-btn');
      btn.classList.add('recording');
      btn.setAttribute('aria-label', 'Klik hier op enter om de opname te stoppen');

      document.getElementById('rec-label').textContent = 'Stop opname';
      setStatus('Opname bezig...');

    } catch (e) {
      setStatus('Microfoon niet beschikbaar.');
    }

  } else {
    mediaRecorder.stop();

    if (recognition) {
      recognition.stop();
    }

    isRecording = false;
    setAriaLive(true);

    const btn = document.getElementById('rec-btn');
    btn.classList.remove('recording');
    btn.setAttribute('aria-label', 'Klik hier op enter om de opname te starten');

    document.getElementById('rec-label').textContent = 'Opname starten';
  }
}

document.getElementById('rec-btn').addEventListener('click', toggleRecording);


// keyboard shortcuts voor navigeren 
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    e.preventDefault();
    if (pendingPara) {
      focusPara(pendingPara);
      setStatus(`Terug naar alinea ${pendingPara}`);
    }
    return;
  }

  const tag = e.target.tagName.toLowerCase();
  if (tag === 'textarea' || tag === 'input') return;

  // Alt + R → opname starten/stoppen
  if (e.altKey && e.key.toLowerCase() === 'r') {
    e.preventDefault();
    toggleRecording();
    return;
  }

  // Alt + ↑/↓ → navigeer tussen annotaties
  if (e.altKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
    e.preventDefault();
    const cards = document.querySelectorAll('.anno-card');
    const currentCard = Array.from(cards).findIndex(c => c === document.activeElement || c.contains(document.activeElement));

    let nextIndex;
    if (e.key === 'ArrowDown') {
      nextIndex = currentCard + 1 >= cards.length ? 0 : currentCard + 1;
    } else {
      nextIndex = currentCard - 1 < 0 ? cards.length - 1 : currentCard - 1;
    }

    cards[nextIndex]?.focus();
    return;
  }

  // ? → sneltoetsen voorlezen/stoppen
  if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
    const el = document.querySelector('#shortcuts .sr-only');
    if (!el) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setStatus('');
      return;
    }

    const tekst = el.textContent.trim();
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(tekst);
    utterance.lang = 'nl-NL';
    utterance.rate = 0.95;

    window.speechSynthesis.speak(utterance);
    setStatus('Sneltoetsen worden voorgelezen...');

    utterance.onend = () => setStatus('');
  }
});

document.querySelectorAll('.para-block').forEach(block => {
  block.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const btn = block.querySelector('.add-anno-btn, .anchor-badge');
      if (btn) btn.click();
    }
  });
});


renderAnnotations();

