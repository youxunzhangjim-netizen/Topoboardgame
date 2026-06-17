import * as THREE from 'three';

const canvas = document.getElementById('launcherTorusCanvas');

if (canvas) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.86;

    const board = new THREE.Group();
    board.rotation.x = 0.42;
    board.rotation.z = -0.16;
    scene.add(board);

    const majorRadius = 3.85;
    const minorRadius = 1.18;
    const columns = 16;
    const rows = 12;
    const lightMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x9fb2aa,
        roughness: 0.46,
        metalness: 0.04,
        clearcoat: 0.3,
        side: THREE.DoubleSide
    });
    const darkMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x31434c,
        roughness: 0.5,
        metalness: 0.06,
        clearcoat: 0.24,
        side: THREE.DoubleSide
    });

    function pointOnTorus(u, v, lift = 0) {
        const tube = minorRadius + lift;
        const ring = majorRadius + tube * Math.cos(v);
        return new THREE.Vector3(
            ring * Math.cos(u),
            tube * Math.sin(v),
            ring * Math.sin(u)
        );
    }

    function cellGeometry(column, row) {
        const inset = 0.018;
        const u0 = ((column + inset) / columns) * Math.PI * 2;
        const u1 = ((column + 1 - inset) / columns) * Math.PI * 2;
        const v0 = ((row + inset) / rows) * Math.PI * 2;
        const v1 = ((row + 1 - inset) / rows) * Math.PI * 2;
        const uSegments = 5;
        const vSegments = 4;
        const vertices = [];
        const indices = [];

        for (let iu = 0; iu <= uSegments; iu++) {
            const u = THREE.MathUtils.lerp(u0, u1, iu / uSegments);
            for (let iv = 0; iv <= vSegments; iv++) {
                const v = THREE.MathUtils.lerp(v0, v1, iv / vSegments);
                const point = pointOnTorus(u, v, 0.035);
                vertices.push(point.x, point.y, point.z);
            }
        }

        const stride = vSegments + 1;
        for (let iu = 0; iu < uSegments; iu++) {
            for (let iv = 0; iv < vSegments; iv++) {
                const a = iu * stride + iv;
                const b = (iu + 1) * stride + iv;
                const c = b + 1;
                const d = a + 1;
                indices.push(a, b, d, b, c, d);
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        return geometry;
    }

    for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
            board.add(new THREE.Mesh(
                cellGeometry(column, row),
                (column + row) % 2 === 0 ? lightMaterial : darkMaterial
            ));
        }
    }

    function cellPose(column, row, lift = 0) {
        const u = ((column + 0.5) / columns) * Math.PI * 2;
        const v = ((row + 0.5) / rows) * Math.PI * 2;
        const normal = new THREE.Vector3(
            Math.cos(v) * Math.cos(u),
            Math.sin(v),
            Math.cos(v) * Math.sin(u)
        ).normalize();
        const tangentU = new THREE.Vector3(-Math.sin(u), 0, Math.cos(u)).normalize();
        const tangentV = new THREE.Vector3(
            -Math.sin(v) * Math.cos(u),
            Math.cos(v),
            -Math.sin(v) * Math.sin(u)
        ).normalize();
        return { position: pointOnTorus(u, v, 0.06 + lift), normal, tangentU, tangentV };
    }

    function pieceMaterial(color) {
        const white = color === 'white';
        return new THREE.MeshStandardMaterial({
            color: white ? 0xa7b1b5 : 0x10151c,
            roughness: 0.42,
            metalness: 0.12,
            emissive: white ? 0x142a34 : 0x2c1b0b,
            emissiveIntensity: white ? 0.035 : 0.06
        });
    }

    function createPiece(color, type) {
        const material = pieceMaterial(color);
        const piece = new THREE.Group();
        const add = (geometry, y) => {
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.y = y;
            piece.add(mesh);
        };
        add(new THREE.CylinderGeometry(0.18, 0.27, 0.12, 18), 0.06);
        add(new THREE.CylinderGeometry(0.11, 0.18, type === 'P' ? 0.28 : 0.38, 18), type === 'P' ? 0.24 : 0.29);
        if (type === 'R') {
            add(new THREE.BoxGeometry(0.36, 0.14, 0.36), 0.54);
        } else if (type === 'N') {
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.24), material);
            head.position.set(0.05, 0.55, 0);
            head.rotation.z = 0.34;
            piece.add(head);
        } else if (type === 'B') {
            add(new THREE.SphereGeometry(0.16, 18, 12), 0.55);
        } else if (type === 'Q') {
            add(new THREE.ConeGeometry(0.2, 0.3, 8), 0.59);
            add(new THREE.SphereGeometry(0.07, 12, 8), 0.78);
        } else if (type === 'K') {
            add(new THREE.CylinderGeometry(0.16, 0.13, 0.22, 8), 0.58);
            add(new THREE.BoxGeometry(0.06, 0.27, 0.06), 0.81);
            add(new THREE.BoxGeometry(0.2, 0.055, 0.055), 0.85);
        } else {
            add(new THREE.SphereGeometry(0.15, 18, 12), 0.44);
        }
        piece.scale.setScalar(0.74);
        return piece;
    }

    function placePiece(column, row, color, type) {
        const piece = createPiece(color, type);
        const pose = cellPose(column, row, 0.17);
        const up = pose.normal;
        const forward = pose.tangentV;
        const right = new THREE.Vector3().crossVectors(up, forward).normalize();
        const correctedForward = new THREE.Vector3().crossVectors(right, up).normalize();
        piece.position.copy(pose.position);
        piece.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, correctedForward));
        if (color === 'black') piece.rotateY(Math.PI);
        board.add(piece);
    }

    const mainRow = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
    mainRow.forEach((type, index) => {
        placePiece(index * 2, 2, 'white', type);
        placePiece(index * 2, 8, 'black', type);
        placePiece(index * 2, 3, 'white', 'P');
        placePiece(index * 2, 7, 'black', 'P');
    });

    scene.add(new THREE.HemisphereLight(0xd8eef0, 0x080c11, 0.94));
    const key = new THREE.DirectionalLight(0xf4fbff, 1.42);
    key.position.set(5, 8, 7);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x3b8ca3, 0.46);
    rim.position.set(-6, 2, -5);
    scene.add(rim);

    camera.position.set(0, 2.2, 12.7);
    camera.lookAt(0, 0, 0);

    function resize() {
        const width = Math.max(1, canvas.clientWidth);
        const height = Math.max(1, canvas.clientHeight);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
    }

    let last = performance.now();
    function animate(now) {
        const delta = Math.min(0.05, (now - last) / 1000);
        last = now;
        board.rotation.y += delta * 0.075;
        board.rotation.z += delta * 0.012;
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(animate);
}
