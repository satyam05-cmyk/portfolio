(() => {
      /* ---- Element refs ---- */
      const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');
      const loader = document.getElementById('loader');
      const loaderBar = document.getElementById('loader-bar');
      const loaderCount = document.getElementById('loader-count');

      const bgCanvas = document.getElementById('bg-canvas');
      const bgCtx = bgCanvas.getContext('2d');

      const glow = document.getElementById('glow');
      const heroOverlay = document.getElementById('heroOverlay');
      const mainNav = document.getElementById('mainNav');
      const heroSection = document.querySelector('.hero-scroll-section');
      const heroBgName = document.getElementById('heroBgName');
      const heroLeft = document.getElementById('heroLeft');

      const FRAME_START = 2;
      const FRAME_END = 90;
      const TOTAL_FRAMES = FRAME_END - FRAME_START + 1;
      const TARGET_LOAD = TOTAL_FRAMES * 2;

      const framePaths = [];
      const bgFramePaths = [];
      for (let i = FRAME_START; i <= FRAME_END; i++) {
        const idxStr = String(i).padStart(3, '0');
        framePaths.push(`frame_cut/ezgif-frame-${idxStr}.webp`);
        bgFramePaths.push(`frame/ezgif-frame-${idxStr}.jpg`);
      }

      /* ---- Image preloading ---- */
      const images = new Array(TOTAL_FRAMES);
      const bgImages = new Array(TOTAL_FRAMES);
      let loadedCount = 0;

      function onAllLoaded() {
        loader.classList.add('hidden');
        renderFrame(0);
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize);
        window.addEventListener('mousemove', onMouseMove);
      }

      function updateLoader() {
        const pct = (loadedCount / TARGET_LOAD) * 100;
        loaderBar.style.width = pct + '%';
        // Divide by 2 so the user sees 1 -> 89 count instead of 178
        loaderCount.textContent = String(Math.floor(loadedCount/2)).padStart(2, '0') + ' / ' + TOTAL_FRAMES;
        if (loadedCount === TARGET_LOAD) onAllLoaded();
      }

      framePaths.forEach((src, index) => {
        const img = new Image();
        img.src = src;
        const settle = () => {
          images[index] = img;
          loadedCount++;
          updateLoader();
        };
        img.onload = settle;
        img.onerror = settle;
      });

      bgFramePaths.forEach((src, index) => {
        const bgImg = new Image();
        bgImg.src = src;
        const settle = () => {
          bgImages[index] = bgImg;
          loadedCount++;
          updateLoader();
        };
        bgImg.onload = settle;
        bgImg.onerror = settle;
      });

      /* ---- Canvas sizing ---- */
      function setCanvasSize() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        bgCanvas.width = canvas.width;
        bgCanvas.height = canvas.height;
        bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        bgCtx.imageSmoothingEnabled = true;
        bgCtx.imageSmoothingQuality = 'high';
      }
      setCanvasSize();

      let lastWidth = window.innerWidth;
      function onResize() {
        if (window.innerWidth !== lastWidth) {
          lastWidth = window.innerWidth;
          setCanvasSize();
        }
        const sf = getHeroScrollFraction();
        const fi = Math.min(Math.floor(sf * TOTAL_FRAMES), TOTAL_FRAMES - 1);
        renderFrame(fi);
      }

      /* ---- Scroll fraction (scoped to hero section) ---- */
      function getHeroScrollFraction() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const heroHeight = heroSection.offsetHeight - window.innerHeight;
        if (heroHeight <= 0) return 0;
        return Math.min(Math.max(scrollTop / heroHeight, 0), 1);
      }

      /* ---- Frame renderer ---- */
      function renderFrame(index) {
        const img = images[index];
        const bgImg = bgImages[index];
        if (!img || !bgImg) return;
        const vw = window.innerWidth, vh = window.innerHeight;
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const vpAspect = vw / vh;
        let drawW, drawH, drawX, drawY;
        
        // Scale by 1.18 to completely push the bottom-right watermark out of the viewport
        const scale = 1.18;
        
        if (imgAspect > vpAspect) {
          drawH = vh * scale; drawW = drawH * imgAspect; drawX = (vw - drawW) / 2; drawY = (vh - drawH) / 2;
        } else {
          drawW = vw * scale; drawH = drawW / imgAspect; drawX = (vw - drawW) / 2; drawY = (vh - drawH) / 2;
        }
        
        ctx.clearRect(0, 0, vw, vh);
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        
        bgCtx.clearRect(0, 0, vw, vh);
        bgCtx.drawImage(bgImg, drawX, drawY, drawW, drawH);
      }



      /* ---- Determine if we've scrolled past the hero ---- */
      function isPastHero() {
        return window.scrollY >= (heroSection.offsetHeight - window.innerHeight);
      }

      /* ---- Select Parallax Elements ---- */
      const parallaxInnerImgs = document.querySelectorAll('.parallax-inner-img');
      const parallaxTexts = document.querySelectorAll('.parallax-text');

      /* ---- Main scroll handler with parallax ---- */
      let ticking = false;
      function onScroll() {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const fraction = getHeroScrollFraction();
            const frameIndex = Math.min(Math.floor(fraction * TOTAL_FRAMES), TOTAL_FRAMES - 1);
            renderFrame(frameIndex);

            const pastHero = isPastHero();

            // Parallax — elements move at different speeds for cinematic depth
            if (!pastHero) {
              const scrollPx = window.scrollY;
              // Background name drifts up slowly
              heroBgName.style.transform = `translate(-50%, calc(-50% + ${scrollPx * 0.1}px))`;
              // Left text moves slightly up
              heroLeft.style.transform = `translateY(${-scrollPx * 0.12}px)`;
              // Background name fades as scroll progresses
              heroBgName.style.opacity = String(Math.max(0, 1 - fraction * 1.5));
            }

            // Hide hero-specific elements once past hero (except the background canvas and vignette, which now serve as the site background)
            canvas.style.opacity = pastHero ? '0' : '1';
            heroOverlay.style.opacity = pastHero ? '0' : '1';
            heroBgName.style.visibility = pastHero ? 'hidden' : 'visible';
            document.querySelector('.grain').style.opacity = pastHero ? '0' : '.05';

            // General Page Parallax
            const vh = window.innerHeight;
            parallaxInnerImgs.forEach(img => {
              const rect = img.parentElement.getBoundingClientRect();
              if (rect.top < vh && rect.bottom > 0) {
                const progress = (vh - rect.top) / (vh + rect.height); // 0 to 1
                const yOffset = (progress - 0.5) * 80; // Pan from -40px to +40px
                img.style.transform = `scale(1.15) translateY(${yOffset}px)`;
              }
            });

            parallaxTexts.forEach(el => {
              const speed = parseFloat(el.getAttribute('data-speed')) || 0.1;
              const rect = el.parentElement.getBoundingClientRect();
              if (rect.top < vh && rect.bottom > 0) {
                const progress = (vh - rect.top) / (vh + rect.height);
                const yOffset = (progress - 0.5) * (speed * 500); 
                el.style.transform = `translateY(${yOffset}px)`;
              }
            });

            ticking = false;
          });
          ticking = true;
        }
      }

      /* ---- Mouse glow ---- */
      function onMouseMove(e) {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
      }

      /* ---- Intersection Observer for fade-up ---- */
      const fadeEls = document.querySelectorAll('.fade-up');
      const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            fadeObserver.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
      });

      fadeEls.forEach(el => fadeObserver.observe(el));

      /* ---- Custom Smooth Scroll for Anchor Links ---- */
      document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
          const targetId = this.getAttribute('href');
          if (targetId === '#') {
            e.preventDefault();
            return;
          }
          const targetEl = document.querySelector(targetId);
          if (targetEl) {
            e.preventDefault();
            targetEl.scrollIntoView({ behavior: 'smooth' });
            // Optionally update URL history without causing jump
            history.pushState(null, null, targetId);
          }
        });
      });

    })();