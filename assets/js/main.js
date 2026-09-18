/* Brio Intelligent — site scripts (shared by all pages) */
(function () {
  'use strict';

  var html = document.documentElement;

  /* ---------- 语言切换 / language toggle ---------- */
  var LANG_KEY = 'brio-lang';

  function setLang(lang) {
    html.setAttribute('data-lang', lang);
    document.querySelectorAll('.lang button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-lang') === lang);
    });
    document.querySelectorAll('input[data-ph-zh]').forEach(function (i) {
      i.placeholder = lang === 'en' ? i.getAttribute('data-ph-en') : i.getAttribute('data-ph-zh');
    });
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    document.title = lang === 'en'
      ? (html.getAttribute('data-title-en') || document.title)
      : (html.getAttribute('data-title-zh') || document.title);
  }

  var saved = null;
  try { saved = localStorage.getItem(LANG_KEY); } catch (e) {}
  if (saved !== 'en' && saved !== 'zh') {
    saved = (navigator.language || '').toLowerCase().indexOf('zh') === 0 ? 'zh' : 'zh';
  }
  if (html.hasAttribute('data-title-zh')) {
    html.setAttribute('data-title-en', html.getAttribute('data-title-en') || document.title);
  }
  setLang(saved);

  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); });
  });

  /* ---------- 顶部导航：滚动吸顶 ---------- */
  var hdr = document.querySelector('.hdr');
  function stick() {
    if (hdr) hdr.classList.toggle('is-stuck', window.scrollY > 6);
  }
  stick();

  /* ---------- 移动端菜单 ---------- */
  var burger = document.querySelector('.burger');
  var nav = document.querySelector('.nav');

  function closeNav() {
    if (!nav) return;
    nav.classList.remove('is-open');
    if (burger) burger.classList.remove('is-on');
    document.body.style.overflow = '';
    nav.querySelectorAll('.nav__item.is-open').forEach(function (i) { i.classList.remove('is-open'); });
  }

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.classList.toggle('is-on', open);
      document.body.style.overflow = open ? 'hidden' : '';
      if (!open) nav.querySelectorAll('.nav__item.is-open').forEach(function (i) { i.classList.remove('is-open'); });
    });

    /* 手机端：有子菜单的项点击展开/收起，不跳转 */
    nav.querySelectorAll('.nav__item').forEach(function (item) {
      var link = item.querySelector(':scope > a');
      var drop = item.querySelector('.nav__drop');
      if (!link || !drop) return;
      link.addEventListener('click', function (e) {
        if (window.innerWidth <= 860) {
          e.preventDefault();
          item.classList.toggle('is-open');
        }
      });
      drop.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { if (window.innerWidth <= 860) closeNav(); });
      });
    });
  }

  window.addEventListener('resize', function () { if (window.innerWidth > 860) closeNav(); });

  /* ---------- 当前页高亮 ---------- */
  (function () {
    function norm(h) {
      if (!h || h.charAt(0) !== '/') return null;
      var v = h.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
      return v.charAt(v.length - 1) === '/' ? v : v + '/';
    }
    var path = norm(location.pathname);
    document.querySelectorAll('.nav__item').forEach(function (item) {
      var own = item.querySelector(':scope > a');
      var hit = norm(own && own.getAttribute('href')) === path;
      /* 子页要点亮它所属的一级项：/services/eor.html → 服务方案 */
      if (!hit) {
        hit = Array.prototype.some.call(item.querySelectorAll('.nav__drop a'), function (a) {
          return norm(a.getAttribute('href')) === path;
        });
      }
      if (hit) item.classList.add('is-active');
    });
  })();

  /* ---------- 选项卡 ---------- */
  document.querySelectorAll('.tabs').forEach(function (bar) {
    var btns = bar.querySelectorAll('button[data-tab]');
    var scope = bar.parentNode;
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-tab');
        btns.forEach(function (b) { b.classList.toggle('on', b === btn); });
        scope.querySelectorAll('.tabpanel').forEach(function (p) {
          var on = p.getAttribute('data-panel') === id;
          p.classList.toggle('on', on);
          if (on) {
            p.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); });
          }
        });
      });
    });
  });

  /* ---------- 数字滚动 ---------- */
  var counted = false;
  function countUp() {
    if (counted) return;
    counted = true;
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var dec = (el.getAttribute('data-count').split('.')[1] || '').length;
      var suffix = el.getAttribute('data-suffix') || '';
      var start = performance.now();
      var dur = 1400;
      (function step(now) {
        var t = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = (target * eased).toFixed(dec) + suffix;
        if (t < 1) requestAnimationFrame(step);
      })(start);
    });
  }

  /* ---------- 滚动显现 ----------
     用滚动位置判断，而非 IntersectionObserver：
     锚点跳转时元素会从「视口下方」直接跳到「视口上方」，Observer 不会补触发。 */
  var items = Array.prototype.slice.call(document.querySelectorAll('.rv'));
  var ticking = false;

  function reveal() {
    ticking = false;
    var vh = window.innerHeight;
    items = items.filter(function (el) {
      if (el.getBoundingClientRect().top < vh * 0.92) {
        el.classList.add('in');
        return false;
      }
      return true;
    });
    if (!items.length) {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('hashchange', onScroll);
    }
  }

  function onScroll() {
    stick();
    if (!ticking) { ticking = true; requestAnimationFrame(reveal); }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('hashchange', onScroll);
  reveal();

  /* 首屏数字：进入视口后开始滚动 */
  if ('IntersectionObserver' in window && document.querySelector('[data-count]')) {
    var statBar = document.querySelector('.statsbar') || document.querySelector('[data-count]');
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { countUp(); io.disconnect(); }
    }, { threshold: 0.3 });
    io.observe(statBar);
  } else {
    countUp();
  }

  /* ---------- 表单：mailto 直投 ---------- */
  document.querySelectorAll('form[data-mailto]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var lang = html.getAttribute('data-lang');
      var f = form.elements;
      var name = (f.name && f.name.value || '').trim();
      var company = (f.company && f.company.value || '').trim();
      var mail = (f.email && f.email.value || '').trim();
      var msg = (f.message && f.message.value || '').trim();
      /* 主题优先带公司名，收件时一眼能分辨来源 */
      var who = [company, name].filter(Boolean).join(' / ');
      var subject = (lang === 'en' ? 'Website enquiry — ' : '官网咨询 — ')
        + (who || (lang === 'en' ? 'New enquiry' : '新咨询'));
      var body = (lang === 'en' ? 'Name: ' : '姓名：') + name + '\n'
        + (lang === 'en' ? 'Company: ' : '公司：') + company + '\n'
        + (lang === 'en' ? 'Email: ' : '邮箱：') + mail + '\n\n' + msg;
      window.location.href = 'mailto:' + form.getAttribute('data-mailto')
        + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    });
  });

  /* ---------- 页脚年份 ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
