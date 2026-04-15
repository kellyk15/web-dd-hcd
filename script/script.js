// nav 
const menuBtn = document.querySelector('.menu');
const nav = document.querySelector('nav');

menuBtn.addEventListener('click', () => {
  nav.classList.toggle('open');
});


const annotations = {};
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let pendingPara = null;
let annoCounter = 0;

// ✅ Vast op Nederlands
const LANG = 'nl-NL';

const paraSnippets = {
  '1': 'Once when I was six years old I saw a magnificent picture in a book',
  '2': 'In the book it said:',
  '3': 'I pondered deeply, then, over the adventures of the jungle',
};

function setStatus(msg) {
  document.getElementById('status').textContent = msg;
}

// ❓ Sneltoets: ? of H → lees sneltoetsen voor
document.addEventListener('keydown', e => {
  const tag = e.target.tagName.toLowerCase();

  // Niet triggeren tijdens typen
  if (tag === 'textarea' || tag === 'input') return;

  // ✅ Alt + H
  if (e.altKey && e.key.toLowerCase() === 'h') {
    e.preventDefault();

    const el = document.querySelector('#shortcuts .sr-only');
    if (!el) return;

    const tekst = el.textContent.trim();

    // Stop lopende spraak
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(tekst);
    utterance.lang = 'nl-NL';
    utterance.rate = 0.95;

    window.speechSynthesis.speak(utterance);
    setStatus('Sneltoetsen worden voorgelezen...');

    utterance.onend = () => setStatus('');
  }
});

//
// 🎤 SPEECH RECOGNITION
//
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

function setupRecognition() {
  if (!SpeechRecognition) {
    console.warn("SpeechRecognition not supported");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.lang = LANG; // ✅ altijd Nederlands
  recognition.interimResults = true;

  // ✅ FIX: geen dubbele transcripts
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

  // ✅ FIX: auto restart als hij stopt
  recognition.onend = () => {
    if (isRecording) {
      recognition.start();
    }
  };
}

setupRecognition();

//
// 📦 RENDER ANNOTATIONS
//
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
    card.setAttribute('aria-label', `Annotatie bij alinea ${paraId}`);
    card.setAttribute('tabindex', '-1'); // ← was '0', nu niet meer in tab volgorde

    card.innerHTML = `
      <div>
        <span class="badge">${a.order}</span>
        <span>Paragraph ${paraId}</span>
      </div>
      <div class="snippet">${a.snippet}</div>

      ${a.url
        ? `<audio controls src="${a.url}"></audio>`
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

    const textarea = document.createElement('textarea');
    textarea.className = 'note-input';
    textarea.placeholder = 'Voeg een tekstnotitie toe...';
    textarea.value = a.note;
    textarea.setAttribute('tabindex', '0');        // ← nieuw
    textarea.setAttribute('aria-label', `Tekstnotitie bij alinea ${paraId}`);
    textarea.addEventListener('input', e => {
      annotations[paraId].note = e.target.value;
    });
    textarea.addEventListener('click', e => e.stopPropagation());
    textarea.addEventListener('focus', e => e.stopPropagation());   // ← nieuw
    textarea.addEventListener('keydown', e => e.stopPropagation()); // ← nieuw
    card.appendChild(textarea);

    list.appendChild(card);
  });
}

function focusPara(paraId) {
  const badge = document.querySelector(`.anchor-badge[data-para="${paraId}"]`);
  if (badge) badge.focus();
}

//
// 📌 SELECT PARAGRAPH
//
function selectPara(paraId) {
  pendingPara = paraId;

  const btn = document.getElementById('rec-btn');
  btn.disabled = false;

  document.getElementById('rec-label').textContent = 'Opname starten';

  const info = document.getElementById('pending-info');
  info.style.display = 'block';
  info.textContent = `Alinea ${paraId} geselecteerd`;

  setStatus(`Alinea ${paraId} geselecteerd`);

  // ← nieuw: als er al een annotatie is, focus de textarea
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

//
// ➕ ADD ANNOTATION
//
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

//
// 🎙️ RECORDING + SPEECH
//
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
        recognition.start(); // ✅ start speech
      }

      isRecording = true;

      const btn = document.getElementById('rec-btn');
      btn.classList.add('recording');

      document.getElementById('rec-label').textContent = 'Stop opname';
      setStatus('Opname bezig...');

    } catch (e) {
      setStatus('Microfoon niet beschikbaar.');
    }

  } else {
    mediaRecorder.stop();

    if (recognition) {
      recognition.stop(); // ✅ stop speech
    }

    isRecording = false;

    const btn = document.getElementById('rec-btn');
    btn.classList.remove('recording');

    document.getElementById('rec-label').textContent = 'Opname starten';
  }
}

document.getElementById('rec-btn').addEventListener('click', toggleRecording);

//
// ⌨️ KEYBOARD
//
document.addEventListener('keydown', e => {
  const tag = e.target.tagName.toLowerCase();
  if (tag === 'textarea' || tag === 'input') return;

  if (
    e.key === '?' ||
    (e.key === '/' && e.shiftKey) ||
    e.key.toLowerCase() === 'h'
  ) {
    const el = document.querySelector('#shortcuts .sr-only');
    if (!el) return;

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


//
// ⬇️ INIT
//
renderAnnotations();

