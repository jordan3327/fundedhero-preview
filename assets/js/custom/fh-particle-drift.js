/* ====================================================================
 * FH Particle Drift - fondo de particulas doradas con cursor
 * --------------------------------------------------------------------
 * Puerto vanilla JS del componente "Particle Drift" (21st.dev - @mengto)
 * adaptado a la paleta de marca FundedHero (#ffc500 / #edc940) y a este
 * stack sin build (WordPress child theme + export estatico).
 *
 * Mecanica (identica al componente original):
 *  - beams: columnas ASCII ascendentes con estela en degradado dorado.
 *  - nodes: glifos ASCII con deriva lenta + twinkle que se conectan en
 *    constelacion cuando estan a menos de 120 px.
 *  - cursor: a menos de 180 px el nodo se ilumina, cambia de caracter
 *    y dibuja una linea dorada hacia el puntero.
 *
 * Extras de produccion:
 *  - DPR con tope (2 desktop / 1.5 movil), ResizeObserver,
 *    IntersectionObserver, pausa en pestaña oculta y prefers-reduced-motion
 *    (frame estatico sin bucle).
 *  - Cola inferior desvanecida opcional: data-fh-extend="2.5" replica el
 *    comportamiento del fondo anterior (pf-golden-ext); las particulas
 *    siguen bajando tras el hero y se funden hacia la seccion negra.
 *
 * Uso:
 *   <div class="fh-particle-drift" data-fh-extend="2.5" data-fh-density="1">
 *
 * API:
 *   FHParticleDrift.init(scope) / refresh(scope) / destroy(el) / boot()
 *   Cada contenedor expone el._fhDestroy para limpieza desde el theme.
 * ================================================================== */
(function (global) {
    'use strict';

    var ACCENT = '255, 197, 0';     // #ffc500 - dorado vivo (cursor / beams)
    var MUFFLED = '237, 201, 64';   // #edc940 - dorado suave (nodes / enlaces)
    var GLYPHS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&*()'.split('');

    var CFG = {
        nodesDesktop: 90,
        beamsDesktop: 25,
        nodesMobile: 40,
        beamsMobile: 12,
        mobileWidth: 640,
        proximityDist: 120,
        cursorLinkDist: 180,
        cursorLinkAlpha: 0.5,
        proximityAlpha: 0.15,
        beamAlphaMax: 0.55,
        beamAlphaMin: 0.25,
        beamLenMin: 50,
        beamLenMax: 150,
        charPx: 12,
        dprDesktop: 2,
        dprMobile: 1.5,
        tailPad: 240
    };

    var instances = {};
    var seq = 0;

    function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
    function rand(a, b) { return a + Math.random() * (b - a); }
    function glyph() { return GLYPHS[(Math.random() * GLYPHS.length) | 0]; }

    function prefersReducedMotion() {
        return global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function isSmall() {
        return global.matchMedia && global.matchMedia('(max-width: ' + CFG.mobileWidth + 'px)').matches;
    }

    function numAttr(el, name, fallback) {
        var v = parseFloat(el.getAttribute(name));
        return isFinite(v) ? v : fallback;
    }

    function createBeam(w, h) {
        return {
            x: w * rand(0.06, 0.94),
            y: Math.random() * h,
            len: rand(CFG.beamLenMin, CFG.beamLenMax),
            speed: rand(3, 9),
            alpha: rand(CFG.beamAlphaMin, CFG.beamAlphaMax),
            width: rand(0.8, 1.6),
            char: glyph()
        };
    }

    function createNode(w, h) {
        return {
            x: Math.random() * w,
            y: Math.random() * h,
            vy: rand(0.1, 0.6),
            char: glyph(),
            twinkle: rand(0.8, 2.2),
            phase: Math.random() * Math.PI * 2
        };
    }

    function boot(el) {
        if (el.getAttribute('data-fh-id')) return;

        var opts = {
            extend: Math.max(1, numAttr(el, 'data-fh-extend', 1)),
            density: Math.max(0.25, numAttr(el, 'data-fh-density', 1))
        };

        var canvas = document.createElement('canvas');
        canvas.className = 'fh-particle-drift__canvas';
        canvas.setAttribute('aria-hidden', 'true');
        el.appendChild(canvas);

        var ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) { if (canvas.parentNode) canvas.parentNode.removeChild(canvas); return; }

        var small = isSmall();
        var reduced = prefersReducedMotion();
        var nCount = Math.max(8, Math.round((small ? CFG.nodesMobile : CFG.nodesDesktop) * opts.density));
        var bCount = reduced ? 0 : Math.max(3, Math.round((small ? CFG.beamsMobile : CFG.beamsDesktop) * opts.density));

        var W = 1, H = 1, heroH = 1;
        var nodes = [], beams = [];
        var rafId = null, running = false, last = 0;
        var pointer = { x: -1e4, y: -1e4, active: false };
        var fadeStart = 0, fadeSpan = 1;

        function fadeAt(y) {
            if (y <= fadeStart) return 1;
            var t = Math.min(1, (y - fadeStart) / fadeSpan);
            return Math.max(0, 1 - t * t);
        }

        function seed() {
            nodes = new Array(nCount);
            for (var i = 0; i < nCount; i++) nodes[i] = createNode(W, H);
            beams = new Array(bCount);
            for (var j = 0; j < bCount; j++) beams[j] = createBeam(W, H);
        }

        function resize() {
            heroH = Math.max(1, el.clientHeight);
            W = Math.max(1, el.clientWidth);
            H = Math.max(1, Math.round(heroH * opts.extend));

            var dpr = Math.min(global.devicePixelRatio || 1, small ? CFG.dprMobile : CFG.dprDesktop);
            canvas.style.width = W + 'px';
            canvas.style.height = H + 'px';
            canvas.width = Math.max(1, Math.floor(W * dpr));
            canvas.height = Math.max(1, Math.floor(H * dpr));
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            fadeStart = heroH + CFG.tailPad;
            fadeSpan = Math.max(1, H - fadeStart);
            seed();
            if (reduced) renderStatic();
        }

        function drawBeam(b, dt) {
            b.y -= b.speed * dt * 60;
            if (b.y + b.len < -60) {
                b.y = H + 120 + Math.random() * 160;
                b.x = W * rand(0.06, 0.94);
                b.speed = rand(3, 9);
                b.char = glyph();
            }
            var alpha = Math.max(0, b.alpha * fadeAt(b.y));
            var grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.len);
            grad.addColorStop(0, 'rgba(' + ACCENT + ',' + alpha.toFixed(3) + ')');
            grad.addColorStop(1, 'rgba(' + ACCENT + ',0)');
            if (alpha > 0.012) {
                ctx.strokeStyle = grad;
                ctx.lineWidth = b.width;
                ctx.beginPath();
                ctx.moveTo(b.x, b.y);
                ctx.lineTo(b.x, b.y + b.len);
                ctx.stroke();
                ctx.fillStyle = 'rgba(' + ACCENT + ',' + (alpha * 0.9).toFixed(3) + ')';
                ctx.fillText(b.char, b.x, b.y);
            }
        }

        function drawLinks() {
            ctx.lineWidth = 0.5;
            var L = CFG.proximityDist;
            for (var i = 0; i < nodes.length; i++) {
                var a = nodes[i];
                for (var j = i + 1; j < nodes.length; j++) {
                    var b = nodes[j];
                    var dx = a.x - b.x, dy = a.y - b.y;
                    var d2 = dx * dx + dy * dy;
                    if (d2 < L * L) {
                        var d = Math.sqrt(d2);
                        var alpha = CFG.proximityAlpha * (1 - d / L) * Math.min(fadeAt(a.y), fadeAt(b.y));
                        if (alpha <= 0.01) continue;
                        ctx.strokeStyle = 'rgba(' + MUFFLED + ',' + alpha.toFixed(3) + ')';
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }
        }

        function drawNode(n, dt, now) {
            n.y += n.vy * dt * 60;
            if (n.y > H + 24) { n.y = -24; n.x = Math.random() * W; }
            if (n.x < -24) n.x = W + 24;
            if (n.x > W + 24) n.x = -24;

            var dx = n.x - pointer.x, dy = n.y - pointer.y;
            var d2 = dx * dx + dy * dy;
            var near = pointer.active && d2 < CFG.cursorLinkDist * CFG.cursorLinkDist;

            if (near || Math.random() > 0.98) n.char = glyph();

            if (near) {
                var d = Math.sqrt(d2);
                var alpha = CFG.cursorLinkAlpha * (1 - d / CFG.cursorLinkDist) * fadeAt(n.y);
                if (alpha > 0.01) {
                    ctx.strokeStyle = 'rgba(' + ACCENT + ',' + clamp(alpha, 0, 1).toFixed(3) + ')';
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(n.x, n.y);
                    ctx.lineTo(pointer.x, pointer.y);
                    ctx.stroke();
                }
                ctx.fillStyle = 'rgb(' + ACCENT + ')';
            } else {
                ctx.fillStyle = 'rgba(' + MUFFLED + ',0.55)';
            }

            ctx.globalAlpha = fadeAt(n.y) * (0.72 + 0.28 * Math.sin(now * n.twinkle + n.phase));
            ctx.fillText(n.char, n.x, n.y);
            ctx.globalAlpha = 1;
        }

        function tick(now) {
            if (!running) return;
            var dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
            last = now;

            ctx.clearRect(0, 0, W, H);
            ctx.font = CFG.charPx + 'px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            for (var i = 0; i < beams.length; i++) drawBeam(beams[i], dt);
            drawLinks();
            for (var j = 0; j < nodes.length; j++) drawNode(nodes[j], dt, now / 1000);

            rafId = global.requestAnimationFrame(tick);
        }

        function renderStatic() {
            ctx.clearRect(0, 0, W, H);
            ctx.font = CFG.charPx + 'px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            for (var i = 0; i < nodes.length; i++) {
                var n = nodes[i];
                ctx.globalAlpha = fadeAt(n.y) * 0.7;
                ctx.fillStyle = 'rgba(' + MUFFLED + ',0.6)';
                ctx.fillText(n.char, n.x, n.y);
            }
            ctx.globalAlpha = 1;
        }

        function start() {
            if (running || reduced) return;
            running = true;
            last = performance.now();
            rafId = global.requestAnimationFrame(tick);
        }

        function stop() {
            running = false;
            if (rafId) global.cancelAnimationFrame(rafId);
            rafId = null;
        }

        function clearPointer() { pointer.active = false; }

        function onPointerMove(e) {
            var rect = canvas.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            if (x < 0 || y < 0 || x > W || y > H) { clearPointer(); return; }
            pointer.x = x;
            pointer.y = y;
            pointer.active = true;
        }
        document.addEventListener('pointermove', onPointerMove, { passive: true });
        document.addEventListener('pointerleave', clearPointer, { passive: true });
        document.addEventListener('pointercancel', clearPointer, { passive: true });
        document.addEventListener('touchstart', function () {
            if (global.TouchEvent) pointer.active = false;
        }, { passive: true });

        if (!global.__fhpdVisibility) {
            global.__fhpdVisibility = true;
            document.addEventListener('visibilitychange', function () {
                for (var k in instances) {
                    if (!instances.hasOwnProperty(k)) continue;
                    if (document.hidden) instances[k].stop();
                    else instances[k].start();
                }
            });
        }

        var io = new IntersectionObserver(function (entries) {
            for (var e = 0; e < entries.length; e++) {
                if (entries[e].target !== canvas) continue;
                if (entries[e].isIntersecting) start();
                else stop();
            }
        }, { root: null, threshold: 0 });
        io.observe(canvas);

        var ro = new ResizeObserver(function () {
            resize();
            stop();
            if (!reduced) start();
        });
        ro.observe(el);

        var inst = {
            id: null,
            start: start,
            stop: stop,
            destroy: function () {
                stop();
                io.disconnect();
                ro.disconnect();
                document.removeEventListener('pointermove', onPointerMove);
                document.removeEventListener('pointerleave', clearPointer);
                document.removeEventListener('pointercancel', clearPointer);
                if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
                if (inst && inst.id && instances[inst.id]) delete instances[inst.id];
                if (el) {
                    el.removeAttribute('data-fh-id');
                    if (el._fhDestroy) delete el._fhDestroy;
                }
            }
        };

        inst.id = 'fhpd-' + (++seq);
        instances[inst.id] = inst;
        el.setAttribute('data-fh-id', inst.id);
        el._fhDestroy = inst.destroy;

        resize();
        var rect = el.getBoundingClientRect();
        if (rect.top < (global.innerHeight || 0) && rect.bottom > 0) start();
    }

    function init(scope) {
        var roots = (scope || document).querySelectorAll('.fh-particle-drift');
        for (var i = 0; i < roots.length; i++) boot(roots[i]);
    }

    function destroy(el) {
        if (el && typeof el._fhDestroy === 'function') el._fhDestroy();
    }

    function bootWhenReady() {
        function run() { init(); }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                run();
                setTimeout(run, 60);
            });
        } else {
            run();
            setTimeout(run, 60);
        }
        if (!global.__fhpdFallback) {
            global.__fhpdFallback = true;
            var tries = 0;
            var t = setInterval(function () {
                tries++;
                init();
                if (tries > 40) clearInterval(t);
            }, 250);
        }
    }

    global.FHParticleDrift = {
        init: init,
        refresh: function (scope) { init(scope); },
        destroy: destroy,
        destroyAll: function () {
            for (var k in instances) {
                if (instances.hasOwnProperty(k)) instances[k].destroy();
            }
        },
        boot: bootWhenReady
    };

    bootWhenReady();
})(window);