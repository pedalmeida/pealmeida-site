/**
 * Casa O Sobreiro — JavaScript Principal
 */
(function () {
  'use strict';

  // =========================================================
  // HEADER: Scroll effect
  // =========================================================
  const header = document.getElementById('site-header');

  function atualizarHeader() {
    if (!header) return;
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', atualizarHeader, { passive: true });
  atualizarHeader();

  // =========================================================
  // NAVEGAÇÃO MOBILE
  // =========================================================
  const navToggle  = document.getElementById('nav-toggle');
  const navPrincipal = document.getElementById('nav-principal');
  const navOverlay = document.getElementById('nav-overlay');

  function fecharMenu() {
    if (!navPrincipal) return;
    navPrincipal.classList.remove('aberto');
    if (navToggle) {
      navToggle.setAttribute('aria-expanded', 'false');
      // Restaurar barras do hamburguer
      const spans = navToggle.querySelectorAll('span');
      if (spans[0]) spans[0].style.cssText = '';
      if (spans[1]) spans[1].style.cssText = '';
      if (spans[2]) spans[2].style.cssText = '';
    }
    if (navOverlay) {
      navOverlay.style.opacity = '0';
      navOverlay.style.pointerEvents = 'none';
    }
    document.body.style.overflow = '';
  }

  if (navToggle) {
    navToggle.addEventListener('click', function () {
      const aberto = navPrincipal.classList.toggle('aberto');
      navToggle.setAttribute('aria-expanded', String(aberto));

      const spans = navToggle.querySelectorAll('span');
      if (aberto) {
        if (spans[0]) spans[0].style.cssText = 'transform: rotate(45deg) translate(4px, 4px)';
        if (spans[1]) spans[1].style.cssText = 'opacity: 0; transform: scaleX(0)';
        if (spans[2]) spans[2].style.cssText = 'transform: rotate(-45deg) translate(4px, -4px)';

        if (navOverlay) {
          navOverlay.style.cssText = `
            position: fixed; inset: 0; z-index: 999;
            background: rgba(0,0,0,0.5);
            opacity: 1; pointer-events: auto;
            transition: opacity 0.3s ease;
          `;
        }
        document.body.style.overflow = 'hidden';
      } else {
        fecharMenu();
      }
    });
  }

  if (navOverlay) {
    navOverlay.addEventListener('click', fecharMenu);
  }

  // Fechar ao clicar em link do menu
  if (navPrincipal) {
    navPrincipal.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', fecharMenu);
    });
  }

  // =========================================================
  // BOTÃO VOLTAR AO TOPO
  // =========================================================
  const btnTopo = document.getElementById('btn-topo');

  if (btnTopo) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 400) {
        btnTopo.style.opacity = '1';
        btnTopo.style.transform = 'translateY(0)';
      } else {
        btnTopo.style.opacity = '0';
        btnTopo.style.transform = 'translateY(20px)';
      }
    }, { passive: true });

    btnTopo.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // =========================================================
  // ANIMAÇÕES DE SCROLL (Intersection Observer)
  // =========================================================
  function initReveal() {
    const elementos = document.querySelectorAll('.reveal, .reveal-esquerda, .reveal-direita');
    if (!elementos.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -20px 0px'
    });

    elementos.forEach(el => observer.observe(el));

    // Disparar imediatamente para elementos já visíveis no viewport
    setTimeout(() => {
      elementos.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add('visible');
        }
      });
    }, 100);
  }

  initReveal();

  // =========================================================
  // CONTADORES ANIMADOS (stats)
  // =========================================================
  function animarContadores() {
    const contadores = document.querySelectorAll('.stat-numero[data-target]');
    if (!contadores.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10);
        const duracao = 1800;
        const incremento = target / (duracao / 16);
        let atual = 0;

        const timer = setInterval(() => {
          atual += incremento;
          if (atual >= target) {
            atual = target;
            clearInterval(timer);
          }
          el.textContent = Math.floor(atual) + (el.dataset.sufixo || '');
        }, 16);

        observer.unobserve(el);
      });
    }, { threshold: 0.5 });

    contadores.forEach(el => observer.observe(el));
  }

  animarContadores();

  // =========================================================
  // FORMULÁRIO DE CONTACTO
  // =========================================================
  const form = document.getElementById('form-contacto');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const mensagemEl = document.getElementById('form-mensagem');
      const btnSubmit  = form.querySelector('.form-submit');
      const textoOriginal = btnSubmit ? btnSubmit.textContent : 'Enviar';

      if (btnSubmit) {
        btnSubmit.textContent = 'A enviar…';
        btnSubmit.disabled = true;
      }

      const dados = new FormData(form);
      dados.append('action', 'sobreiro_contacto');
      dados.append('nonce', (window.sobJsVars && sobJsVars.nonce) || '');

      fetch((window.sobJsVars && sobJsVars.ajaxUrl) || '/wp-admin/admin-ajax.php', {
        method: 'POST',
        body: dados,
      })
        .then(r => r.json())
        .then(resp => {
          if (mensagemEl) {
            mensagemEl.className = 'form-mensagem ' + (resp.success ? 'sucesso' : 'erro');
            mensagemEl.textContent = resp.data && resp.data.msg
              ? resp.data.msg
              : (resp.success ? 'Mensagem enviada!' : 'Ocorreu um erro.');
            mensagemEl.style.display = 'block';

            mensagemEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }

          if (resp.success) {
            form.reset();
          }
        })
        .catch(() => {
          if (mensagemEl) {
            mensagemEl.className = 'form-mensagem erro';
            mensagemEl.textContent = 'Erro de ligação. Por favor tente novamente.';
            mensagemEl.style.display = 'block';
          }
        })
        .finally(() => {
          if (btnSubmit) {
            btnSubmit.textContent = textoOriginal;
            btnSubmit.disabled = false;
          }
        });
    });
  }

  // =========================================================
  // GALERIA: Lightbox simples
  // =========================================================
  function initLightbox() {
    const itens = document.querySelectorAll('.galeria-item');
    if (!itens.length) return;

    // Criar overlay
    const overlay = document.createElement('div');
    overlay.id = 'lightbox-overlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(26,17,8,0.95);
      display: none; align-items: center; justify-content: center;
      cursor: zoom-out;
    `;

    const img = document.createElement('img');
    img.style.cssText = `
      max-width: 90vw; max-height: 90vh;
      object-fit: contain;
      box-shadow: 0 20px 80px rgba(0,0,0,0.5);
    `;

    const fechar = document.createElement('button');
    fechar.innerHTML = '&times;';
    fechar.style.cssText = `
      position: absolute; top: 20px; right: 30px;
      background: none; border: none; color: white;
      font-size: 3rem; cursor: pointer; line-height: 1;
    `;

    overlay.appendChild(img);
    overlay.appendChild(fechar);
    document.body.appendChild(overlay);

    itens.forEach(item => {
      item.style.cursor = 'zoom-in';
      item.addEventListener('click', function () {
        const src = this.querySelector('img')?.src;
        if (!src) return;
        img.src = src;
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      });
    });

    function fecharLightbox() {
      overlay.style.display = 'none';
      document.body.style.overflow = '';
      img.src = '';
    }

    overlay.addEventListener('click', fecharLightbox);
    fechar.addEventListener('click', fecharLightbox);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') fecharLightbox();
    });
  }

  initLightbox();

  // =========================================================
  // SMOOTH SCROLL (links âncora)
  // =========================================================
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const destino = document.querySelector(href);
      if (!destino) return;
      e.preventDefault();
      const offset = 80;
      const topo = destino.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: topo, behavior: 'smooth' });
    });
  });

})();
