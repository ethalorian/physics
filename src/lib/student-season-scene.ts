import { STUDENT_HOME_THEMES } from './student-home-banner';
/** Decorative artwork from the approved seasonal banner; no animation or network assets. */
export function drawSeasonalScene(scene: HTMLCanvasElement, month: number) {
    const hero = scene.parentElement;
    if (!hero)
        return;
    const w = hero.clientWidth, h = hero.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
    scene.width = Math.round(w * dpr);
    scene.height = Math.round(h * dpr);
    const context = scene.getContext('2d');
    if (!context)
        return;
    const c = context;
    c.scale(dpr, dpr);
    const theme = STUDENT_HOME_THEMES[month] ?? STUDENT_HOME_THEMES[0], m = month, small = w < 500, s = small ? .76 : 1;
    const rand = (n: number) => { const v = Math.sin(n * 127.1 + 43.7) * 43758.5453; return v - Math.floor(v); };
    function circle(x: number, y: number, r: number, color: string | CanvasGradient) { c.fillStyle = color; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
    function ellipse(x: number, y: number, rx: number, ry: number, color: string, angle = 0) { c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2); c.fill(); }
    function glow(x: number, y: number, r: number, color: string) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(1, 'transparent'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
    function path(points: [
        number,
        number
    ][], color: string) { c.beginPath(); points.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.closePath(); c.fillStyle = color; c.fill(); }
    function star(x: number, y: number, r: number, color: string) { const points: [
        number,
        number
    ][] = []; for (let n = 0; n < 10; n++) {
        const a = n * Math.PI / 5 - Math.PI / 2;
        const rr = n % 2 ? r * .4 : r;
        points.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
    } path(points, color); }
    function leaf(x: number, y: number, size: number, color: string, angle: number) { c.save(); c.translate(x, y); c.rotate(angle); c.beginPath(); c.moveTo(0, size); c.bezierCurveTo(-size * .8, size * .2, -size * .8, -size * .5, 0, -size); c.bezierCurveTo(size * .8, -size * .5, size * .8, size * .2, 0, size); c.fillStyle = color; c.fill(); c.strokeStyle = '#ffecbf44'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -size * .8); c.lineTo(0, size * .85); c.stroke(); c.restore(); }
    function maple(x: number, y: number, size: number, color: string, angle: number) { c.save(); c.translate(x, y); c.rotate(angle); path([[0, -size], [-.19 * size, -.44 * size], [-.55 * size, -.68 * size], [-.45 * size, -.16 * size], [-size, -.36 * size], [-.68 * size, .17 * size], [-.96 * size, .38 * size], [-.12 * size, .52 * size], [0, size * .83], [.1 * size, .52 * size], [.96 * size, .38 * size], [.68 * size, .17 * size], [size, -.36 * size], [.45 * size, -.16 * size], [.55 * size, -.68 * size], [.19 * size, -.44 * size]], color); c.strokeStyle = '#ffedc549'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -size * .7); c.lineTo(0, size * .75); c.stroke(); c.restore(); }
    function heart(x: number, y: number, size: number, color: string, angle = 0) { c.save(); c.translate(x, y); c.rotate(angle); c.beginPath(); c.moveTo(0, size * .65); c.bezierCurveTo(-size * 1.4, -size * .1, -size * .7, -size, 0, -size * .45); c.bezierCurveTo(size * .7, -size, size * 1.4, -size * .1, 0, size * .65); c.fillStyle = color; c.fill(); c.restore(); }
    function clover(x: number, y: number, size: number, angle = 0) { c.save(); c.translate(x, y); c.rotate(angle); for (let n = 0; n < 4; n++) {
        const a = n * Math.PI / 2;
        c.save();
        c.rotate(a);
        heart(0, -size * .35, size * .5, '#79c97c99', Math.PI);
        c.restore();
    } c.strokeStyle = '#9ad67b88'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(size * .2, size * .6, size * .6, size); c.stroke(); c.restore(); }
    function firework(x: number, y: number, r: number, colors: string[]) { c.save(); c.lineCap = 'round'; for (let n = 0; n < 26; n++) {
        const a = n * Math.PI * 2 / 26, r1 = r * (.28 + rand(n + 3) * .12), r2 = r * (.75 + rand(n + 14) * .25);
        c.strokeStyle = colors[n % colors.length];
        c.lineWidth = n % 3 === 0 ? 2.3 : 1.3;
        c.beginPath();
        c.moveTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1);
        c.lineTo(x + Math.cos(a) * r2, y + Math.sin(a) * r2);
        c.stroke();
        circle(x + Math.cos(a) * r2, y + Math.sin(a) * r2, 1.8, colors[n % colors.length]);
    } glow(x, y, r * .4, colors[0].slice(0, 7) + '22'); c.restore(); }
    function pumpkin(x: number, y: number, size: number, face = false) { c.save(); c.translate(x, y); c.rotate(-.08); c.fillStyle = '#5c5e2e'; c.fillRect(-4, -size * .7, 8, 17); ellipse(-size * .22, 0, size * .43, size * .52, '#c65c18'); ellipse(size * .22, 0, size * .43, size * .52, '#df741d'); ellipse(0, 0, size * .34, size * .56, '#f39628'); ellipse(-size * .07, -size * .1, size * .12, size * .4, '#ffc46022'); if (face) {
        path([[-size * .32, -size * .12], [-size * .12, -size * .25], [-size * .11, -size * .02]], '#3b2030');
        path([[size * .32, -size * .12], [size * .12, -size * .25], [size * .11, -size * .02]], '#3b2030');
        path([[-size * .28, size * .14], [-size * .1, size * .22], [0, size * .17], [size * .1, size * .22], [size * .28, size * .14], [size * .18, size * .35], [-size * .18, size * .35]], '#3b2030');
    } c.restore(); }
    function bat(x: number, y: number, size: number, angle = 0) { c.save(); c.translate(x, y); c.rotate(angle); c.beginPath(); c.moveTo(0, 3); c.bezierCurveTo(-size * .25, -size * .3, -size * .45, -size * .45, -size, -size * .5); c.quadraticCurveTo(-size * .75, size * .25, -size * .45, size * .03); c.quadraticCurveTo(-size * .25, size * .35, 0, size * .1); c.quadraticCurveTo(size * .25, size * .35, size * .45, size * .03); c.quadraticCurveTo(size * .75, size * .25, size, -size * .5); c.bezierCurveTo(size * .45, -size * .45, size * .25, -size * .3, 0, 3); c.fillStyle = '#160c2b'; c.fill(); ellipse(0, 0, size * .1, size * .23, '#160c2b'); c.restore(); }
    function flower(x: number, y: number, r: number, color: string) { for (let n = 0; n < 8; n++) {
        const a = n * Math.PI / 4;
        ellipse(x + Math.cos(a) * r * .6, y + Math.sin(a) * r * .6, r * .48, r * .23, color, a);
    } circle(x, y, r * .28, '#efbd63'); circle(x - r * .06, y - r * .06, r * .15, '#ffe5a4'); }
    function egg(x: number, y: number, size: number, color: string, angle: number) { c.save(); c.translate(x, y); c.rotate(angle); c.beginPath(); c.ellipse(0, 0, size * .7, size, 0, 0, Math.PI * 2); c.clip(); c.fillStyle = color; c.fillRect(-size, -size, size * 2, size * 2); c.strokeStyle = '#ffffff66'; c.lineWidth = 4; c.beginPath(); for (let n = -4; n <= 4; n++) {
        const xx = n * size * .25, yy = (n % 2) * size * .18;
        if (n === -4) c.moveTo(xx, yy);
        else c.lineTo(xx, yy);
    } c.stroke(); for (let n = 0; n < 5; n++)
        circle((n - 2) * size * .3, -size * .45, 2, '#fff5'); c.restore(); }
    function firBranch(x: number, y: number, length: number, angle: number) { c.save(); c.translate(x, y); c.rotate(angle); c.strokeStyle = '#557d4d'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(length, 0); c.stroke(); for (let i = 0; i < length; i += 8) {
        const k = 1 - i / length;
        c.strokeStyle = i % 16 ? '#438054' : '#275a43';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(i, 0);
        c.lineTo(i + 24 * k, -22 * k);
        c.moveTo(i, 0);
        c.lineTo(i + 22 * k, 20 * k);
        c.stroke();
    } c.restore(); }
    function ornament(x: number, y: number, r: number, color: string) { c.strokeStyle = '#d9bb7488'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, y - r - 5); c.stroke(); c.fillStyle = '#c79c54'; c.fillRect(x - r * .23, y - r - 6, r * .46, 8); const g = c.createRadialGradient(x - r * .35, y - r * .4, 0, x, y, r * 1.3); g.addColorStop(0, color); g.addColorStop(1, '#371e2466'); circle(x, y, r, g); c.strokeStyle = '#ffe8aa77'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, r * .75, .2, 2.5); c.stroke(); ellipse(x - r * .3, y - r * .35, r * .13, r * .25, '#fff3', .5); }
    function wheat(x: number, y: number, height: number, angle: number) { c.save(); c.translate(x, y); c.rotate(angle); c.strokeStyle = '#e6b66caa'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-4, -height * .5, 0, -height); c.stroke(); for (let n = 0; n < 5; n++) {
        const yy = -height * .45 - n * height * .1;
        ellipse(-5, yy, 3, 8, '#e4b76cbb', -.6);
        ellipse(5, yy - 3, 3, 8, '#d99d50bb', .6);
    } c.restore(); }
    function ribbon(y: number, color: string, shift: number) { c.fillStyle = color; c.beginPath(); c.moveTo(-10, y); c.bezierCurveTo(w * .25, y - 60, w * .48, y + 35, w + 10, y - shift); c.lineTo(w + 10, y - shift + 13); c.bezierCurveTo(w * .48, y + 48, w * .25, y - 47, -10, y + 13); c.closePath(); c.fill(); }
    glow(w * .06, h * .1, Math.min(w * .55, 320), theme.accent + '22');
    if (m === 0) {
        firework(w * .10, 64, 98 * s, ['#ffe4ab88', '#e8f3ff99', '#b6ccff88']);
        firework(w * .94, h * .25, 90 * s, ['#f8d689aa', '#a8c9ff88']);
        for (let n = 0; n < 30; n++) {
            const x = rand(n + 1) * w, y = rand(n + 71) * h;
            if (x < w * .23 || y < 35 || x > w * .82) {
                c.save();
                c.translate(x, y);
                c.rotate(rand(n + 5) * 4);
                c.fillStyle = n % 2 ? '#efc568aa' : '#c4dfff88';
                c.fillRect(0, 0, 3, 9);
                c.restore();
            }
        }
    }
    if (m === 1) {
        [[.04, .08, 42, -.3], [.2, .06, 20, .2], [.94, .09, 34, .25], [.06, .89, 54, -.4], [.93, .9, 40, .3], [.24, .94, 17, -.2]].forEach(([x, y, r, a], i) => heart(x * w, y * h, r * s, i % 2 ? '#ffcfce66' : '#ed668d77', a));
        glow(0, h * .6, 250, '#f2587d30');
    }
    if (m === 2) {
        clover(w * .05, 65, 45 * s, -.3);
        clover(w * .96, 56, 39 * s, .4);
        clover(w * .08, h - 25, 50 * s, .5);
        clover(w * .9, h - 23, 34 * s, -.2);
        for (let n = 0; n < 18; n++) {
            const x = rand(n + 6) * w, y = rand(n + 55) * h;
            if (y < 40 || y > h - 35)
                star(x, y, 3 + rand(n + 3) * 4, '#f5d66eaa');
        }
    }
    if (m === 3) {
        flower(20, 22, 43 * s, '#edc1ce99');
        flower(w - 13, 64, 38 * s, '#dad0f3bb');
        flower(42, h - 20, 36 * s, '#f3dca077');
        egg(22, h - 20, 32 * s, '#acb9df', -.3);
        egg(68, h - 12, 28 * s, '#b9d3bc', .25);
        egg(w - 22, h - 15, 30 * s, '#d9aac3', .3);
        for (let n = 0; n < 8; n++)
            leaf(rand(n + 30) * w, n % 2 ? 18 : h - 15, 11, '#a8c6a855', n * .5);
    }
    if (m === 4) {
        for (let n = 0; n < 7; n++) {
            const x = n % 2 ? w - 8 : 8, y = 20 + n * h / 7;
            leaf(x, y, 34 * s, '#63a26488', n * .8);
        }
        flower(32, 38, 40 * s, '#f2c7adbb');
        flower(w - 20, 35, 35 * s, '#edc7dfbb');
        flower(10, h - 20, 48 * s, '#ffdb9abb');
        flower(w - 12, h - 10, 42 * s, '#d9b4d6aa');
    }
    if (m === 5 || m === 7) {
        const x = 45, y = 55, r = (m === 5 ? 86 : 105) * s;
        glow(x, y, r * 2.1, '#ffcb6877');
        circle(x, y, r, '#ffd28577');
        circle(x, y, r * .73, '#ffe4ad66');
        for (let n = 0; n < 5; n++) {
            c.strokeStyle = n % 2 ? '#ffcfac33' : '#a1dddf44';
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(0, h - 20 + n * 13);
            c.bezierCurveTo(w * .3, h - 85 + n * 11, w * .6, h + 15 + n * 10, w, h - 52 + n * 13);
            c.stroke();
        }
        if (m === 7) {
            flower(w - 9, h - 13, 54 * s, '#eab450aa');
            leaf(w - 20, h - 58, 34 * s, '#ab9f5a77', -.7);
        }
    }
    if (m === 6) {
        firework(w * .07, 68, 105 * s, ['#f1eeffaa', '#ef798cbb', '#9cc4ffbb']);
        firework(w * .95, 92, 94 * s, ['#f8deabcc', '#e67788bb', '#e7eaffaa']);
        firework(w * .10, h - 30, 60 * s, ['#ef7893aa', '#e7edff66']);
        ribbon(h - 18, '#b63d5b55', 12);
        ribbon(h - 4, '#d9dff044', 12);
        for (let n = 0; n < 10; n++)
            star(rand(n + 26) * w, rand(n + 88) * 35, 3, '#ebedff88');
    }
    if (m === 8) {
        maple(20, 35, 42 * s, '#e99c4b99', -.3);
        maple(w - 12, 50, 45 * s, '#db805799', .7);
        maple(40, h - 12, 49 * s, '#ca704c99', .1);
        for (let n = 0; n < 4; n++)
            leaf(w - 10 - n * 19, h - 10, 22 * s, ['#dcb567aa', '#bc765588'][n % 2], n * .6);
        c.save();
        c.translate(30, h - 55);
        c.rotate(-.3);
        c.fillStyle = '#ce9c5b88';
        c.fillRect(-7, -25, 14, 68);
        path([[-7, 43], [7, 43], [0, 58]], '#e6c79c99');
        path([[-2, 53], [2, 53], [0, 58]], '#302844');
        c.restore();
    }
    if (m === 9) {
        glow(w * .08, 68, 130 * s, '#f9ca8c55');
        circle(w * .08, 68, 62 * s, '#f7d599cc');
        circle(w * .08 + 16 * s, 50, 52 * s, '#6b3789');
        bat(w * .22, 39, 25 * s, .1);
        bat(w * .88, 56, 30 * s, -.2);
        bat(w * .95, 114, 20 * s, .3);
        pumpkin(32, h - 18, 68 * s, true);
        pumpkin(105 * s, h - 3, 45 * s, false);
        pumpkin(w - 15, h - 10, 56 * s, true);
        for (let n = 0; n < 20; n++) {
            const x = rand(n + 30) * w, y = rand(n + 43) * h;
            if (y < 40 || x > w * .92)
                circle(x, y, 1.2, '#e5d1f988');
        }
    }
    if (m === 10) {
        maple(18, 37, 54 * s, '#d58536cc', -.4);
        maple(w - 5, 33, 58 * s, '#b44438aa', .8);
        maple(30, h - 26, 48 * s, '#d7a846bb', -.1);
        pumpkin(w - 16, h - 8, 62 * s, false);
        pumpkin(w - 70 * s, h + 2, 38 * s, false);
        for (let n = 0; n < 6; n++)
            wheat(12 + n * 8, h, 75 + n * 9, (-.35 + n * .12));
        maple(w * .18, 13, 22 * s, '#ca734388', -.5);
    }
    if (m === 11) {
        firBranch(-15, 10, 180 * s, .15);
        firBranch(-5, 3, 140 * s, .65);
        firBranch(w + 5, 5, 190 * s, Math.PI - .1);
        firBranch(w + 8, 5, 140 * s, Math.PI - .65);
        ornament(w * .08, 62, 21 * s, '#d24950');
        ornament(w * .94, 86, 26 * s, '#e4b75b');
        ornament(w * .86, 37, 14 * s, '#be394e');
        c.strokeStyle = '#9a894b88';
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(w * .5, 57, w, 0);
        c.stroke();
        for (let n = 0; n < 15; n++) {
            const t = (n + .5) / 15, x = w * t, y = 114 * t * (1 - t);
            const col = n % 3 === 0 ? '#ffd68f' : n % 3 === 1 ? '#e9696b' : '#a4d7a0';
            glow(x, y, 11, col + '66');
            circle(x, y + 3, 3.2, col);
        }
        for (let n = 0; n < 52; n++) {
            const x = rand(n + 10) * w, y = rand(n + 56) * h;
            if (x < w * .20 || x > w * .84 || y < 38 || y > h - 30)
                circle(x, y, 1 + rand(n + 75) * 1.7, '#e3f0e788');
        }
        firBranch(0, h - 5, 130 * s, -.1);
        firBranch(w, h + 2, 150 * s, Math.PI + .12);
    }
    const shade = c.createLinearGradient(0, 0, w, 0);
    shade.addColorStop(0, '#05051b00');
    shade.addColorStop(.27, '#05051b12');
    shade.addColorStop(.4, '#05051b55');
    shade.addColorStop(.73, '#05051b55');
    shade.addColorStop(1, '#05051b08');
    c.fillStyle = shade;
    c.fillRect(0, 0, w, h);
}
