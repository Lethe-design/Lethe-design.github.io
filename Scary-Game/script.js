// Replaced/expanded script to add multiple narrative steps and branching
(function(){
  const page = document.body.id;

  function tryPlay(audio, vol = 1){
    if(!audio) return;
    audio.volume = vol;
    audio.currentTime = 0;
    const p = audio.play();
    if(p && p.catch) p.catch(()=>{});
  }

  if(page === 'index'){
    const startOverlay = document.getElementById('startOverlay');
    const beginBtn = document.getElementById('beginBtn');
    const ambient = document.getElementById('ambient');
    const footsteps = document.getElementById('footsteps');
    const whisper = document.getElementById('whisper');
    const narrationLine = document.getElementById('line');
    const choicesEl = document.getElementById('choices');
    const sceneEl = document.querySelector('.scene');

    // longer gameplay: define a small state machine of scenes
    const scenes = {
      0: {
        text: "You step out into the evening — the park glows under lamp light and the forest waits at the edge.",
        bg: ['assets/images/park_mist.jpg','assets/images/park_lamps.jpg','assets/images/park_dusk.jpg'],
        choices: [
          { text: "Follow the lit park path home", next: 1 },
          { text: "Head into the forest path", next: 3 }
        ]
      },
      // Park branch — a calm longer path with one small event
      1: {
        text: "You follow the warm lamps, breathing easy. A stray dog trots beside you, nudging your hand. The bench ahead looks inviting.",
        bg: ['assets/images/park_lamps.jpg'],
        sound: 'footsteps',
        choices: [
          { text: "Sit on the bench to rest", next: 2 },
          { text: "Keep walking home", next: 'good' }
        ]
      },
      2: {
        text: "You sit and the dog curls at your feet. A neighbor greets you and points out a shortcut that leads safely home.",
        bg: ['assets/images/park_dusk.jpg'],
        sound: 'chime',
        choices: [
          { text: "Take the shortcut home (safe)", next: 'good' },
          { text: "Ignore it and wander a bit longer", next: 3 } // accidentally leads toward forest edge
        ]
      },

      // Forest branch — multiple steps to lengthen tension
      3: {
        text: "You step off the lamps' reach. The trees close around you, and your footsteps sound hollow. A whisper brushes past your ear.",
        bg: ['assets/images/forest_edge.jpg','assets/images/park_mist.jpg'],
        sound: 'whisper',
        choices: [
          { text: "Call out: 'Who's there?'", next: 4 },
          { text: "Keep moving forward quietly", next: 5 }
        ]
      },
      4: {
        text: "Your voice echoes. A faint light flickers between trunks ahead. Something moves where the light doesn't reach.",
        bg: ['assets/images/forest_path.jpg'],
        sound: 'whisper',
        choices: [
          { text: "Approach the flicker", next: 6 },
          { text: "Retreat toward the park", next: 1 }
        ]
      },
      5: {
        text: "You hurry along the narrow trail; branches scrape your jacket. You catch a glimpse of a figure standing by a fallen log.",
        bg: ['assets/images/forest_deep.jpg'],
        sound: 'footsteps',
        choices: [
          { text: "Investigate the figure", next: 6 },
          { text: "Run back to the lamps", next: 'good' }
        ]
      },
      6: {
        text: "The figure turns. Something is wrong. Your heartbeat quickens — the path splits into two: one lit by a strange blue glow, the other swallowed by black.",
        bg: ['assets/images/forest_fork.jpg'],
        sound: 'whisper',
        choices: [
          { text: "Follow the blue glow (uncertain)", next: 'good' }, // an unlikely safe escape
          { text: "Follow the black path (curiosity)", next: 'bad' }
        ]
      }
    };

    // pick a randomized start background
    function setBackground(variants){
      const pick = Array.isArray(variants) ? variants[Math.floor(Math.random()*variants.length)] : variants;
      if(pick) sceneEl.style.backgroundImage = `url("${pick}")`;
    }

    let current = 0;
    let typingTimer = null;

    function showScene(id){
      const s = scenes[id];
      if(!s) return;
      // update background and play any designated sound
      setBackground(s.bg);
      if(s.sound === 'whisper') tryPlay(whisper, 0.9);
      if(s.sound === 'footsteps') tryPlay(footsteps, 0.8);

      // reveal text with simple type effect
      const full = s.text;
      narrationLine.textContent = "";
      choicesEl.setAttribute('aria-hidden','true');
      choicesEl.innerHTML = "";
      let i = 0;
      clearInterval(typingTimer);
      typingTimer = setInterval(()=> {
        narrationLine.textContent += full[i++] || '';
        if(i >= full.length) {
          clearInterval(typingTimer);
          renderChoices(s.choices);
        }
      }, 18);
    }

    function renderChoices(list){
      choicesEl.setAttribute('aria-hidden','false');
      choicesEl.innerHTML = "";
      list.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'choice';
        if(c.text.toLowerCase().includes('run') || c.text.toLowerCase().includes('curiosity') || c.text.toLowerCase().includes('investigate')) btn.classList.add('danger');
        btn.textContent = c.text;
        btn.addEventListener('click', ()=> handleChoice(c.next));
        choicesEl.appendChild(btn);
      });
    }

    function handleChoice(next){
      // play a small footstep cue on choice
      tryPlay(footsteps, 0.9);

      if(next === 'good' || next === 'bad'){
        // brief delay to build tension before end page
        setTimeout(()=> {
          // play short sounds before leaving
          if(next === 'good'){
            const chime = new Audio('assets/sounds/chime.mp3');
            tryPlay(chime, 1);
            setTimeout(()=> window.location.href = 'good.html', 900);
          } else {
            const j = new Audio('assets/sounds/jump_scare.mp3');
            tryPlay(whisper, 1);
            setTimeout(()=> { tryPlay(j, 1); window.location.href = 'bad.html'; }, 900);
          }
        }, 700);
        return;
      }

      // otherwise transition to next scene id
      current = next;
      // small pause and a breath before next narration
      choicesEl.setAttribute('aria-hidden','true');
      setTimeout(()=> showScene(current), 600);
    }

    function startGame(){
      startOverlay.style.display = 'none';
      tryPlay(ambient, 0.5);
      tryPlay(footsteps, 0.6);
      // show initial scene after tiny pause
      setTimeout(()=> showScene(0), 350);
    }

    beginBtn.addEventListener('click', startGame);
    startOverlay.addEventListener('click', (e)=>{ if(e.target === startOverlay) startGame(); });

    // initialize with randomized starting background
    setBackground(scenes[0].bg);
  }

  // good / bad pages unchanged but keep small resume behavior (existing code)
  else if(page === 'good'){
    const resume = document.getElementById('resumeOverlay');
    const resumeBtn = document.getElementById('resumeBtn');
    const chime = document.getElementById('chime');
    const goodAmb = document.getElementById('goodAmb');
    if(resumeBtn){
      resumeBtn.addEventListener('click', ()=>{
        resume.style.display = 'none';
        tryPlay(chime);
        tryPlay(goodAmb);
      });
      resume.addEventListener('click',(e)=>{ if(e.target===resume) { resumeBtn.click(); }});
    }
  } else if(page === 'bad'){
    const resume = document.getElementById('resumeOverlay');
    const resumeBtn = document.getElementById('resumeBtn');
    const jump = document.getElementById('jump');
    const badAmb = document.getElementById('badAmb');
    const endScene = document.getElementById('endScene');
    if(resumeBtn){
      resumeBtn.addEventListener('click', ()=>{
        resume.style.display = 'none';
        tryPlay(badAmb);
        setTimeout(()=> {
          tryPlay(jump);
          if(endScene) endScene.classList.add('flash');
        }, 900);
      });
      resume.addEventListener('click',(e)=>{ if(e.target===resume) { resumeBtn.click(); }});
    }
  }

})();