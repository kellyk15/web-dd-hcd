//  const annotations = {};
//   let mediaRecorder = null;
//   let audioChunks = [];
//   let isRecording = false;
//   let pendingPara = null;
//   let annoCounter = 0;
 
//   const paraSnippets = {
//     '1': 'Once when I was six years old I saw a magnificent picture in a book',
//     '2': 'In the book it said:',
//     '3': 'I pondered deeply, then, over the adventures of the jungle',
//   };
 
//   function setStatus(msg) {
//     document.getElementById('status').textContent = msg;
//   }
 
//   function renderAnnotations() {
//     const list = document.getElementById('anno-list');
//     const count = document.getElementById('anno-count');
//     const ids = Object.keys(annotations).sort((a, b) => annotations[a].order - annotations[b].order);
//     count.textContent = ids.length;
 
//     if (ids.length === 0) {
//       list.innerHTML = '<p>No annotations yet. Focus on a paragraph and click + annotation.</p>';
//       return;
//     }
 
//     list.innerHTML = '';
//     ids.forEach(paraId => {
//       const a = annotations[paraId];
//       const card = document.createElement('div');
//       card.className = 'anno-card';
//       card.setAttribute('role', 'region');
//       card.setAttribute('tabindex', '0');
//       card.setAttribute('aria-label', `Annotation ${a.order}: paragraph ${paraId}, ${a.snippet}`);
//       card.innerHTML = `
//         <div>
//           <span class="badge" aria-hidden="true">${a.order}</span>
//           <span style="font-size:13px;font-weight:500;">Paragraph ${paraId}</span>
//         </div>
//         <div class="snippet">${a.snippet}</div>
//         ${a.url
//           ? `<audio controls src="${a.url}" aria-label="Audio-notitie bij alinea ${paraId}"></audio>`
//           : '<span style="font-size:12px;color:#888780;">Geen opname</span>'
//         }
//       `;
//       card.addEventListener('click', () => focusPara(paraId));
//       card.addEventListener('keydown', e => {
//         if (e.key === 'Enter' || e.key === ' ') focusPara(paraId);
//       });
//       list.appendChild(card);
//     });
//   }
 
//   function focusPara(paraId) {
//     const badge = document.querySelector(`.anchor-badge[data-para="${paraId}"]`);
//     if (badge) badge.focus();
//   }
 
//   function selectPara(paraId) {
//     pendingPara = paraId;
//     const btn = document.getElementById('rec-btn');
//     btn.disabled = false;
//     btn.setAttribute('aria-label', 'Start audio-opname');
//     document.getElementById('rec-label').textContent = 'Opname starten';
//     const info = document.getElementById('pending-info');
//     info.style.display = 'block';
//     info.textContent = `Alinea ${paraId} geselecteerd`;
//     setStatus(`Alinea ${paraId} geselecteerd. Druk op opname of R om te starten.`);
//   }
 
//   document.querySelectorAll('.add-anno-btn').forEach(btn => {
//     btn.addEventListener('click', () => {
//       const paraId = btn.closest('.para-block').dataset.para;
//       selectPara(paraId);
 
//       if (!annotations[paraId]) {
//         annoCounter++;
//         annotations[paraId] = { order: annoCounter, snippet: paraSnippets[paraId], url: null };
 
//         const p = btn.closest('p');
//         btn.remove();
 
//         const badge = document.createElement('button');
//         badge.className = 'anchor-badge';
//         badge.dataset.para = paraId;
//         badge.setAttribute('aria-label', `Annotatie ${annoCounter} bij alinea ${paraId}: klik om te selecteren`);
//         badge.setAttribute('tabindex', '0');
//         badge.textContent = annoCounter;
//         badge.addEventListener('click', () => selectPara(paraId));
//         p.appendChild(badge);
 
//         renderAnnotations();
//       }
 
//       document.getElementById('rec-btn').focus();
//     });
//   });
 
//   async function toggleRecording() {
//     if (!pendingPara) {
//       setStatus('Selecteer eerst een alinea.');
//       return;
//     }
 
//     if (!isRecording) {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//         mediaRecorder = new MediaRecorder(stream);
//         audioChunks = [];
//         mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
//         mediaRecorder.onstop = () => {
//           const blob = new Blob(audioChunks, { type: 'audio/webm' });
//           annotations[pendingPara].url = URL.createObjectURL(blob);
//           renderAnnotations();
//           setStatus(`Opname opgeslagen bij alinea ${pendingPara}.`);
//           stream.getTracks().forEach(t => t.stop());
//         };
//         mediaRecorder.start();
//         isRecording = true;
//         const btn = document.getElementById('rec-btn');
//         btn.classList.add('recording');
//         btn.setAttribute('aria-pressed', 'true');
//         btn.setAttribute('aria-label', 'Stop opname');
//         document.getElementById('rec-label').textContent = 'Stop opname';
//         setStatus('Opname bezig...');
//       } catch (e) {
//         setStatus('Microfoon niet beschikbaar. Controleer de browserinstellingen.');
//       }
//     } else {
//       mediaRecorder.stop();
//       isRecording = false;
//       const btn = document.getElementById('rec-btn');
//       btn.classList.remove('recording');
//       btn.setAttribute('aria-pressed', 'false');
//       btn.setAttribute('aria-label', 'Start audio-opname');
//       document.getElementById('rec-label').textContent = 'Opname starten';
//     }
//   }
 
//   document.getElementById('rec-btn').addEventListener('click', toggleRecording);
 
//   document.addEventListener('keydown', e => {
//     if ((e.key === 'r' || e.key === 'R') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
//       e.preventDefault();
//       toggleRecording();
//     }
//   });
 
//   renderAnnotations();

//   // Keyboard navigatie tussen annotatie-kaarten
// document.getElementById('anno-list').addEventListener('keydown', e => {
//   const cards = [...document.querySelectorAll('.anno-card')];
//   if (!cards.length) return;

//   const current = document.activeElement;
//   const idx = cards.indexOf(current);

//   if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
//     e.preventDefault();
//     const next = cards[idx + 1] ?? cards[0];
//     next.focus();
//   }

//   if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
//     e.preventDefault();
//     const prev = cards[idx - 1] ?? cards[cards.length - 1];
//     prev.focus();
//   }
// });


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
    card.setAttribute('tabindex', '0');

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

    card.addEventListener('click', () => focusPara(paraId));
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
        transcript: ""
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
  if (e.key.toLowerCase() === 'r') {
    e.preventDefault();
    toggleRecording();
  }
});

//
// ⬇️ INIT
//
renderAnnotations();