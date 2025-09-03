const tracks = [
            {
                title: "Midnight City",
                artist: "M83",
                src: "media/midnight-city.mp3",
                cover: "https://via.placeholder.com/150/222/fff?text=M83"
            }
        ];

        const audio = document.getElementById('audio');
        const playBtn = document.getElementById('playBtn');
        const playIcon = document.getElementById('playIcon');
        const pauseIcon = document.getElementById('pauseIcon');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const curEl = document.getElementById('cur');
        const durEl = document.getElementById('dur');
        const remainingEl = document.getElementById('remaining');
        const seek = document.getElementById('seek');
        const progressBar = document.getElementById('progressBar');
        const vol = document.getElementById('volume');
        const volVal = document.getElementById('volVal');
        const autoplay = document.getElementById('autoplay');
        const loop = document.getElementById('loop');
        const shuffleBtn = document.getElementById('shuffleBtn');
        const nowTitle = document.getElementById('nowTitle');
        const nowArtist = document.getElementById('nowArtist');
        const cover = document.getElementById('cover');
        const listEl = document.getElementById('playlist');

        let index = 0, seeking = false;

        const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
        function fmt(t) { if (!Number.isFinite(t)) return '0:00'; const s = Math.max(0, Math.floor(t)); return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`; }
        function setPlayingUI(p) { playBtn.setAttribute('aria-pressed', p); playIcon.style.display = p ? 'none' : ''; pauseIcon.style.display = p ? '' : 'none'; }

        function load(i) {
            index = (i + tracks.length) % tracks.length;
            const t = tracks[index];
            audio.src = t.src;
            audio.loop = loop.checked;
            nowTitle.textContent = t.title;
            nowArtist.textContent = t.artist;
            cover.src = t.cover;
            Array.from(listEl.children).forEach((li, k) => li.classList.toggle('active', k === index));
            audio.play().then(() => setPlayingUI(true)).catch(() => setPlayingUI(false));
        }

        function renderList() {
            listEl.innerHTML = '';
            tracks.forEach((t, i) => {
                const row = document.createElement('div');
                row.className = 'track';
                row.innerHTML = `<img src="${t.cover}" alt=""><div class="meta"><span class="t">${t.title}</span><span class="a">${t.artist}</span></div><div class="dur" id="dur-${i}">--:--</div>`;
                row.onclick = () => load(i);
                listEl.appendChild(row);
            });
        }

        function updateProgress() {
            const cur = audio.currentTime || 0, dur = audio.duration || 0;
            curEl.textContent = fmt(cur); durEl.textContent = fmt(dur); remainingEl.textContent = `-${fmt(dur - cur)}`;
            if (!seeking) { const val = dur ? (cur / dur) : 0; seek.value = Math.round(val * 1000); progressBar.style.transform = `scaleX(${val})`; }
        }

        playBtn.onclick = () => { audio.paused ? audio.play() : audio.pause(); };
        prevBtn.onclick = () => load(index - 1);
        nextBtn.onclick = () => load(index + 1);
        audio.onplay = () => setPlayingUI(true);
        audio.onpause = () => setPlayingUI(false);
        audio.ontimeupdate = updateProgress;
        audio.ondurationchange = updateProgress;
        audio.onloadedmetadata = () => { const d = document.getElementById(`dur-${index}`); if (d) d.textContent = fmt(audio.duration); };
        audio.onended = () => { if (autoplay.checked || audio.loop) load(index + 1); else setPlayingUI(false); };
        seek.oninput = () => { seeking = true; const dur = audio.duration || 0; const p = clamp(seek.value / 1000, 0, 1); progressBar.style.transform = `scaleX(${p})`; curEl.textContent = fmt(p * dur); remainingEl.textContent = `-${fmt(dur - p * dur)}`; };
        seek.onchange = () => { audio.currentTime = (clamp(seek.value / 1000, 0, 1)) * (audio.duration || 0); seeking = false; };
        vol.oninput = () => setVol(parseFloat(vol.value));
        function setVol(v) { audio.volume = clamp(v, 0, 1); vol.value = audio.volume; volVal.textContent = Math.round(audio.volume * 100) + '%'; }
        loop.onchange = () => audio.loop = loop.checked;
        shuffleBtn.onclick = () => { const cur = tracks[index]; const rest = tracks.filter((_, i) => i !== index); for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[rest[i], rest[j]] = [rest[j], rest[i]]; } tracks.splice(0, tracks.length, cur, ...rest); renderList(); index = 0; };

        // === Add music (local + online) ===
        document.getElementById('fileInput').addEventListener('change', (e) => {
            for (const file of e.target.files) {
                const url = URL.createObjectURL(file);
                let track = { title: file.name.replace(/\.[^/.]+$/, ""), artist: "Local File", src: url, cover: "https://via.placeholder.com/150/333/fff?text=♪" };
                // Try to read metadata
                window.jsmediatags.read(file, {
                    onSuccess: tag => {
                        if (tag.tags.title) track.title = tag.tags.title;
                        if (tag.tags.artist) track.artist = tag.tags.artist;
                        if (tag.tags.picture) {
                            const pic = tag.tags.picture; let base64 = "";
                            for (let i = 0; i < pic.data.length; i++) base64 += String.fromCharCode(pic.data[i]);
                            track.cover = `data:${pic.format};base64,${btoa(base64)}`;
                        }
                        tracks.push(track); renderList();
                    },
                    onError: () => { tracks.push(track); renderList(); }
                });
            }
        });

        document.getElementById('addUrlBtn').onclick = () => {
            const urlInput = document.getElementById('urlInput');
            const url = urlInput.value.trim(); if (!url) return;
            tracks.push({ title: "Online Track", artist: "From URL", src: url, cover: "https://via.placeholder.com/150/333/fff?text=♫" });
            renderList(); urlInput.value = "";
        };

        // Boot
        renderList(); setVol(0.9); load(0);
