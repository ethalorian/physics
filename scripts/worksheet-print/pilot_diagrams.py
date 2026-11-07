"""Original approved vector diagrams; no curriculum mutations."""
import math

def install(renderer):
    old_draw = renderer.base.draw
    ink, grid, gray = renderer.INK, renderer.GRID, renderer.GRAY

    def draw(s, v, x, y, w=255, h=110):
        k = v['kind']
        if k == 'graph':
            left, right, top, bottom = x + 36, x + w - 8, y + 19, y + h - 26
            xmin, xmax, ymin, ymax = v.get('xmin', 0), v['xmax'], v.get('ymin', 0), v['ymax']
            px = lambda z: left + (z - xmin) / (xmax - xmin) * (right - left)
            py = lambda z: bottom - (z - ymin) / (ymax - ymin) * (bottom - top)
            nx = min(8, max(4, int(xmax - xmin)))
            for i in range(nx + 1):
                z = xmin + (xmax - xmin) * i / nx
                s.line(px(z), top, px(z), bottom, grid, .4)
                s.txt(px(z) - 4, bottom + 4, f'{z:g}', 7.2)
            z = ymin
            while z <= ymax + v['step'] * .01:
                s.line(left, py(z), right, py(z), grid, .4)
                s.txt(x + 8, py(z) - 3, f'{z:g}', 7.2)
                z += v['step']
            s.line(left, top, left, bottom, ink, .7)
            s.line(left, py(0), right, py(0), ink, .9)
            s.txt(x, y, v.get('ylabel', 'Velocity (m/s)'), 8)
            s.txt(x + 36, y + h - 8, v.get('xlabel', 'Time (s)'), 8)
            points = v.get('points', [])
            if points:
                assert all(xmin <= a <= xmax and ymin <= b <= ymax for a, b in points)
                mapped = [(px(a), py(b)) for a, b in points]
                s.poly(mapped, ink, 1.6)
                for i, (a, b) in enumerate(mapped):
                    s.circle(a, b, 2, ink, ink)
                    if v.get('pointLabels'):
                        dx = -20 if i == len(mapped) - 1 else 5
                        s.txt(a + dx, b - 12, v['pointLabels'][i], 7.2, 'DB')
            return

        if k == 'velocity_snapshots':
            s.txt(x + 30, y, 'West (-)', 7.3)
            s.txt(x + 195, y, 'East (+)', 7.3)
            s.arrow(x + 30, y + 13, x + 240, y + 13, gray, .6)
            origin = x + (77 if v['values'][0] > 0 else 220)
            s.line(origin, y + 24, origin, y + 72, grid, .5, (2, 2))
            scale = 12
            for i, (value, time) in enumerate(zip(v['values'], v['times'])):
                yy = y + 38 + i * 30
                end = origin + value * scale
                s.txt(x, yy - 4, f'{time} s', 8, 'DB')
                s.circle(origin, yy, 2, ink, ink)
                s.arrow(origin, yy, end, yy, ink, 1.5)
                s.txt(min(origin, end) + 3, yy - 15, f'{abs(value):g} m/s', 8)
            s.txt(x, y + 87, 'Acceleration: add a separate arrow.', 8)
            return

        if k == 'curved_path':
            cx, cy, radius = x + 125, y + 65, 42
            s.arrow(cx - 50, cy, x + 222, cy, grid, .6)
            s.arrow(cx, y + 98, cx, y + 6, grid, .6)
            s.txt(x + 227, cy - 4, 'East', 7)
            s.txt(cx - 45, y + 8, 'North', 7)
            arc = []
            for i in range(66):
                angle = math.radians(-20 + i * 2)
                arc.append((cx + radius * math.cos(angle), cy - radius * math.sin(angle)))
            s.poly(arc, ink, 1.3)
            for a, b, name, dx, dy in [(cx + radius, cy, 'A', 7, 2), (cx, cy - radius, 'B', -14, -12)]:
                s.circle(a, b, 2.7, ink, ink)
                s.txt(a + dx, b + dy, name, 8, 'DB')
            s.txt(x + 20, y + 105, 'Path sketch: runner moves from A toward B.', 7.5)
            return
        old_draw(s, v, x, y, w, h)

    renderer.base.draw = draw
