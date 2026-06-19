const preview3d = document.getElementById('dimension3dCanvas');
const preview4d = document.getElementById('dimension4dCanvas');
const preview3p1 = document.getElementById('dimension3p1Canvas');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function fitCanvas(canvas) {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width * ratio));
    const height = Math.max(1, Math.round(rect.height * ratio));
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }
    return { width, height, ratio };
}

function draw3dBoard(canvas, time) {
    if (!canvas) return;
    const { width, height, ratio } = fitCanvas(canvas);
    const context = canvas.getContext('2d');
    const centerX = width * 0.5;
    const centerY = height * 0.53;
    const scale = Math.min(width, height) * 0.33;
    const angle = -0.58 + Math.sin(time * 0.00022) * 0.07;
    const layers = [-0.58, 0, 0.58];
    context.clearRect(0, 0, width, height);
    context.lineJoin = 'round';

    function project(x, y, z) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const rotatedX = x * cos - y * sin;
        const rotatedY = x * sin + y * cos;
        return {
            x: centerX + rotatedX * scale,
            y: centerY + (rotatedY * 0.48 - z * 0.86) * scale
        };
    }

    layers.forEach((z, layerIndex) => {
        for (let row = 0; row < 4; row++) {
            for (let column = 0; column < 4; column++) {
                const x0 = column / 2 - 1;
                const x1 = (column + 1) / 2 - 1;
                const y0 = row / 2 - 1;
                const y1 = (row + 1) / 2 - 1;
                const corners = [
                    project(x0, y0, z),
                    project(x1, y0, z),
                    project(x1, y1, z),
                    project(x0, y1, z)
                ];
                context.beginPath();
                context.moveTo(corners[0].x, corners[0].y);
                corners.slice(1).forEach((point) => context.lineTo(point.x, point.y));
                context.closePath();
                const light = (row + column) % 2 === 0;
                context.fillStyle = light
                    ? `rgba(215, 232, 223, ${0.72 - layerIndex * 0.09})`
                    : `rgba(49, 67, 76, ${0.82 - layerIndex * 0.08})`;
                context.fill();
                context.strokeStyle = 'rgba(218, 237, 239, 0.28)';
                context.lineWidth = ratio;
                context.stroke();
            }
        }
    });

    const pieces = [
        [-0.72, -0.72, 0.58, true], [-0.2, -0.7, 0.58, true],
        [-0.7, -0.2, 0, true], [0.72, 0.72, -0.58, false],
        [0.2, 0.7, -0.58, false], [0.7, 0.2, 0, false]
    ];
    pieces.forEach(([x, y, z, white]) => {
        const point = project(x, y, z);
        const radius = Math.max(3 * ratio, scale * 0.075);
        const gradient = context.createRadialGradient(
            point.x - radius * 0.32,
            point.y - radius * 0.38,
            radius * 0.1,
            point.x,
            point.y,
            radius
        );
        gradient.addColorStop(0, white ? '#ffffff' : '#71808c');
        gradient.addColorStop(0.5, white ? '#d7e8df' : '#17212a');
        gradient.addColorStop(1, white ? '#8fa1a8' : '#020407');
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(point.x, point.y, radius, 0, Math.PI * 2);
        context.fill();
    });
}

const vertices4d = Array.from({ length: 16 }, (_, index) => [
    index & 1 ? 1 : -1,
    index & 2 ? 1 : -1,
    index & 4 ? 1 : -1,
    index & 8 ? 1 : -1
]);
const edges4d = [];
for (let vertex = 0; vertex < 16; vertex++) {
    for (let axis = 0; axis < 4; axis++) {
        const other = vertex ^ (1 << axis);
        if (vertex < other) edges4d.push([vertex, other]);
    }
}

function rotatePair(point, first, second, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const a = point[first];
    const b = point[second];
    point[first] = a * cos - b * sin;
    point[second] = a * sin + b * cos;
}

function drawTesseract(canvas, time) {
    if (!canvas) return;
    const { width, height, ratio } = fitCanvas(canvas);
    const context = canvas.getContext('2d');
    const phase = reduceMotion ? 0.6 : time * 0.00028;
    const scale = Math.min(width, height) * 0.29;
    const points = vertices4d.map((source) => {
        const point = [...source];
        rotatePair(point, 0, 3, phase);
        rotatePair(point, 1, 2, phase * 0.71);
        rotatePair(point, 0, 1, phase * 0.43);
        const wDistance = 3.3 - point[3];
        const projected3d = [
            point[0] / wDistance,
            point[1] / wDistance,
            point[2] / wDistance
        ];
        const depth = 3.8 - projected3d[2];
        return {
            x: width * 0.5 + projected3d[0] / depth * scale * 4.6,
            y: height * 0.51 + projected3d[1] / depth * scale * 4.6,
            depth
        };
    });

    context.clearRect(0, 0, width, height);
    context.lineCap = 'round';
    edges4d
        .map(([from, to]) => ({ from: points[from], to: points[to] }))
        .sort((a, b) => b.from.depth + b.to.depth - a.from.depth - a.to.depth)
        .forEach(({ from, to }) => {
            const visibility = Math.max(0.32, Math.min(0.92, 1.45 - (from.depth + to.depth) * 0.13));
            context.strokeStyle = `rgba(117, 220, 255, ${visibility})`;
            context.lineWidth = (1.05 + visibility * 0.7) * ratio;
            context.beginPath();
            context.moveTo(from.x, from.y);
            context.lineTo(to.x, to.y);
            context.stroke();
        });
    points.forEach((point) => {
        context.fillStyle = 'rgba(245, 182, 71, 0.9)';
        context.beginPath();
        context.arc(point.x, point.y, 1.55 * ratio, 0, Math.PI * 2);
        context.fill();
    });
}

function drawStaticCubeStack(canvas) {
    if (!canvas) return;
    const { width, height, ratio } = fitCanvas(canvas);
    const context = canvas.getContext('2d');
    const centerX = width * 0.5;
    const centerY = height * 0.65;
    const base = Math.min(width, height) * 0.19;
    const layers = 10;
    context.clearRect(0, 0, width, height);
    context.lineJoin = 'round';
    context.lineCap = 'round';

    function project(x, y, z, layer) {
        const stackShift = (layer - (layers - 1) / 2) * base * 0.13;
        return {
            x: centerX + (x - y) * base * 0.64 + stackShift,
            y: centerY + (x + y) * base * 0.29 - z * base * 0.78 - stackShift * 0.42
        };
    }

    function strokeLine(a, b) {
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.stroke();
    }

    for (let layer = 0; layer < layers; layer++) {
        const opacity = 0.12 + layer / (layers - 1) * 0.5;
        const values = [-1, -0.5, 0, 0.5, 1];

        context.strokeStyle = `rgba(125, 211, 252, ${opacity * 0.58})`;
        context.lineWidth = 0.52 * ratio;
        for (const x of values) {
            for (const y of values) strokeLine(project(x, y, -1, layer), project(x, y, 1, layer));
        }
        for (const x of values) {
            for (const z of values) strokeLine(project(x, -1, z, layer), project(x, 1, z, layer));
        }
        for (const y of values) {
            for (const z of values) strokeLine(project(-1, y, z, layer), project(1, y, z, layer));
        }

        context.strokeStyle = `rgba(245, 182, 71, ${opacity * 0.68})`;
        context.lineWidth = 0.7 * ratio;
        for (const grid of [-0.5, 0, 0.5]) {
            strokeLine(project(-1, grid, 1, layer), project(1, grid, 1, layer));
            strokeLine(project(grid, -1, 1, layer), project(grid, 1, 1, layer));
            strokeLine(project(1, -1, grid, layer), project(1, 1, grid, layer));
            strokeLine(project(-1, 1, grid, layer), project(1, 1, grid, layer));
        }

        context.strokeStyle = `rgba(202, 241, 255, ${opacity + 0.14})`;
        context.lineWidth = (0.82 + layer * 0.035) * ratio;
        const cubeEdges = [
            [[-1, -1, -1], [1, -1, -1]], [[1, -1, -1], [1, 1, -1]], [[1, 1, -1], [-1, 1, -1]], [[-1, 1, -1], [-1, -1, -1]],
            [[-1, -1, 1], [1, -1, 1]], [[1, -1, 1], [1, 1, 1]], [[1, 1, 1], [-1, 1, 1]], [[-1, 1, 1], [-1, -1, 1]],
            [[-1, -1, -1], [-1, -1, 1]], [[1, -1, -1], [1, -1, 1]], [[1, 1, -1], [1, 1, 1]], [[-1, 1, -1], [-1, 1, 1]]
        ];
        for (const [from, to] of cubeEdges) strokeLine(project(...from, layer), project(...to, layer));
    }
}

function render(time = 0) {
    draw3dBoard(preview3d, time);
    drawTesseract(preview3p1, time);
    drawStaticCubeStack(preview4d);
    if (!reduceMotion) requestAnimationFrame(render);
}

window.addEventListener('resize', () => {
    draw3dBoard(preview3d, performance.now());
    drawTesseract(preview3p1, performance.now());
    drawStaticCubeStack(preview4d);
});

requestAnimationFrame(render);
