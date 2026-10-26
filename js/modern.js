(function () {
  /* reveal on scroll */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function (el, i) {
    el.style.transitionDelay = (i % 4) * 80 + 'ms';
    io.observe(el);
  });

  /* active nav link */
  var links = [].slice.call(document.querySelectorAll('.links a'));
  var secs = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  window.addEventListener('scroll', function () {
    var y = window.scrollY + window.innerHeight * 0.4, cur = -1;
    secs.forEach(function (s, i) { if (s && s.offsetTop <= y) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle('on', i === cur); });
  }, { passive: true });

  /* typing role */
  var roles = ['Web Developer', 'Laravel & PHP Engineer', 'Full-Stack Builder'];
  var el = document.getElementById('typed'), r = 0, c = 0, del = false;
  (function type() {
    var w = roles[r];
    el.textContent = w.slice(0, c);
    if (!del && c === w.length) { del = true; return setTimeout(type, 1600); }
    if (del && c === 0) { del = false; r = (r + 1) % roles.length; }
    c += del ? -1 : 1;
    setTimeout(type, del ? 35 : 80);
  })();

  /* card tilt */
  document.querySelectorAll('.card').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var b = card.getBoundingClientRect();
      var x = (e.clientX - b.left) / b.width - 0.5, y = (e.clientY - b.top) / b.height - 0.5;
      card.style.transform = 'perspective(900px) rotateY(' + x * 8 + 'deg) rotateX(' + -y * 8 + 'deg) translateY(-6px)';
    });
    card.addEventListener('mouseleave', function () { card.style.transform = ''; });
  });

  /* Three.js scene */
  if (typeof THREE === 'undefined') return;
  var canvas = document.getElementById('bg');
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(innerWidth, innerHeight);
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 200);
  camera.position.z = 9;

  var mobile = innerWidth < 768;

  var uniforms = { uTime: { value: 0 }, uMouse: { value: new THREE.Vector2() } };

  /* floating code tokens + wireframe blocks */
  var group = new THREE.Group();
  var tokens = ['</>', '{ }', 'PHP', '=>', 'SQL', ';', '[ ]', 'JS', '()', '$', '&&', 'API', '404', '++', '<?', 'git', '#', '0101', 'CSS', '{}'];
  var colors = ['#0284c7', '#0ea5e9', '#6366f1', '#1e3a8a', '#38bdf8'];
  var items = [];

  function makeSprite(text, color) {
    var cv = document.createElement('canvas');
    cv.width = 256; cv.height = 128;
    var cx = cv.getContext('2d');
    cx.font = '700 64px "Space Mono", Consolas, monospace';
    cx.textAlign = 'center'; cx.textBaseline = 'middle';
    cx.shadowColor = color; cx.shadowBlur = 18;
    cx.fillStyle = color;
    cx.fillText(text, 128, 64);
    var tex = new THREE.CanvasTexture(cv);
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.9 }));
    sp.scale.set(2, 1, 1);
    return sp;
  }

  var count = mobile ? 14 : tokens.length;
  for (var k = 0; k < count; k++) {
    var sp = makeSprite(tokens[k], colors[k % colors.length]);
    var phi = Math.acos(1 - 2 * (k + 0.5) / count), th = Math.PI * (1 + Math.sqrt(5)) * k;
    var R = 3.0 + (k % 3) * 0.5;
    sp.position.set(R * Math.sin(phi) * Math.cos(th), R * Math.sin(phi) * Math.sin(th) * 0.8, R * Math.cos(phi));
    var s = 0.7 + (k % 4) * 0.25;
    sp.scale.set(2 * s, 1 * s, 1);
    items.push({ obj: sp, base: sp.position.clone(), ph: k * 1.7 });
    group.add(sp);
  }

  var cubes = [];
  for (var j = 0; j < 4; j++) {
    var size = 0.6 + j * 0.25;
    var e = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(size, size, size)),
      new THREE.LineBasicMaterial({ color: j % 2 ? 0x6366f1 : 0x0ea5e9, transparent: true, opacity: 0.75 })
    );
    var a = j * 1.6;
    e.position.set(Math.cos(a) * 2.0, Math.sin(a * 1.3) * 1.6, Math.sin(a) * 2.0);
    cubes.push(e); group.add(e);
  }

  /* core: glowing wire cube */
  var core = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.6, 1.6, 1.6)),
    new THREE.LineBasicMaterial({ color: 0x0284c7 })
  );
  var core2 = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.5, 0)),
    new THREE.LineBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.6 })
  );
  group.add(core, core2);
  scene.add(group);

  var n = mobile ? 600 : 1600, pos = new Float32Array(n * 3);
  for (var i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 60;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 80;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 40 - 5;
  }
  var sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  var stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 0.05, color: 0x5b9bd5, transparent: true, opacity: 0.55, depthWrite: false }));
  scene.add(stars);

  var mx = 0, my = 0, tx = 0, ty = 0;
  addEventListener('mousemove', function (e) { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; });
  addEventListener('resize', function () {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  var clock = new THREE.Clock();
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function frame() {
    var t = clock.getElapsedTime();
    var p = window.scrollY / Math.max(1, document.body.scrollHeight - innerHeight);
    mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
    uniforms.uTime.value = t;
    uniforms.uMouse.value.set(mx, my);
    group.rotation.y = t * 0.12 + mx * 0.8 + p * 3;
    group.rotation.x = my * 0.5 - p * 0.6;
    core.rotation.x = t * 0.4; core.rotation.y = t * 0.5;
    core2.rotation.x = -t * 0.3; core2.rotation.z = t * 0.35;
    cubes.forEach(function (c, i) { c.rotation.x = t * (0.3 + i * 0.1); c.rotation.y = t * 0.4; });
    items.forEach(function (it) {
      it.obj.position.y = it.base.y + Math.sin(t * 0.8 + it.ph) * 0.18;
    });
    var side = innerWidth < 768 ? 0 : 4.2;
    group.position.x = side * Math.cos(p * Math.PI * 3);
    group.position.y = -p * 2 + Math.sin(t * 0.8) * 0.15;
    group.scale.setScalar(0.82 * (1 - Math.min(p * 0.45, 0.45)));
    stars.rotation.y = t * 0.01;
    stars.position.y = p * 14;
    camera.position.x = mx * 0.6; camera.position.y = -my * 0.4;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  if (still) frame();
  else (function loop() { requestAnimationFrame(loop); frame(); })();
})();
