import * as THREE from 'three';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import {
    BOARD_HEIGHT,
    BOARD_WIDTH,
    PAWN_DIR
} from './BoardSetup.js';

const TWO_PI = Math.PI * 2;
const BOARD_LIGHT_COLOR = 0xd7e8df;
const BOARD_DARK_COLOR = 0x31434c;

export class TorusThreeJSRenderer {
    constructor(game) {
        this.game = game;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.boardGroup = new THREE.Group();
        this.piecesGroup = new THREE.Group();
        this.highlightGroup = new THREE.Group();
        this.labelGroup = new THREE.Group();
        this.decorGroup = new THREE.Group();

        this.majorRadius = 3.95;
        this.minorRadius = 0.92;
        this.surfaceLift = 0.035;
        this.pieceLift = 0.2;
        this.secondSheetLift = 0.035;
        this.shineLight = null;
        this.maxPixelRatio = 1.35;
        this.pieceShapeCache = new Map();

        this.materials = this.createMaterials();
    }

    init3D() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            throw new Error('Missing #gameCanvas element.');
        }

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x101216);

        this.camera = new THREE.PerspectiveCamera(52, 1, 0.1, 1000);
        this.camera.position.set(6.4, 4.3, 7.2);

        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: false,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance'
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.maxPixelRatio));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.08;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMap.autoUpdate = false;
        this.renderer.shadowMap.needsUpdate = true;

        this.controls = new TrackballControls(this.camera, this.renderer.domElement);
        this.controls.rotateSpeed = 3.6;
        this.controls.zoomSpeed = 0.42;
        this.controls.panSpeed = 0.55;
        this.controls.dynamicDampingFactor = 0.08;
        this.controls.minDistance = 4.4;
        this.controls.maxDistance = 22;
        this.controls.target.set(0, 0, 0);

        this.scene.add(this.decorGroup);
        this.scene.add(this.boardGroup);
        this.scene.add(this.piecesGroup);
        this.scene.add(this.highlightGroup);
        this.scene.add(this.labelGroup);

        this.addLighting();
        this.createBoard3D();
        this.addBoardLabels();
        this.resize();

        window.addEventListener('resize', () => this.resize());
    }

    createMaterials() {
        const physical = (options) => new THREE.MeshPhysicalMaterial({
            metalness: 0.08,
            roughness: 0.42,
            clearcoat: 0.45,
            clearcoatRoughness: 0.2,
            side: THREE.DoubleSide,
            ...options
        });

        return {
            base: physical({
                color: BOARD_DARK_COLOR,
                roughness: 0.34,
                clearcoat: 0.7
            }),
            light: physical({
                color: BOARD_LIGHT_COLOR
            }),
            dark: physical({
                color: BOARD_DARK_COLOR
            })
        };
    }

    addLighting() {
        this.scene.add(new THREE.HemisphereLight(0xf7fbff, 0x141820, 0.86));

        const key = new THREE.DirectionalLight(0xffffff, 2.25);
        key.position.set(5.5, 7.2, 4.6);
        key.castShadow = true;
        key.shadow.mapSize.set(1024, 1024);
        key.shadow.camera.near = 0.5;
        key.shadow.camera.far = 22;
        key.shadow.camera.left = -7;
        key.shadow.camera.right = 7;
        key.shadow.camera.top = 7;
        key.shadow.camera.bottom = -7;
        this.scene.add(key);

        const fill = new THREE.DirectionalLight(0x7dd3fc, 0.42);
        fill.position.set(-5, 3.5, -6);
        this.scene.add(fill);

        this.shineLight = new THREE.PointLight(0xfff1c2, 1.15, 8.5, 1.7);
        this.shineLight.position.set(4.2, 2.4, 0);
        this.scene.add(this.shineLight);

        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(12, 12),
            new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.28 })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -2.25;
        floor.receiveShadow = true;
        this.decorGroup.add(floor);
    }

    createBoard3D() {
        this.boardGroup.clear();

        const base = new THREE.Mesh(
            this.createTorusSurfaceGeometry(0, TWO_PI, 0, TWO_PI, 224, 64, -0.018),
            this.materials.base
        );
        base.castShadow = true;
        base.receiveShadow = true;
        this.boardGroup.add(base);

        if (typeof this.game?.validCells === 'function') {
            for (const { x, y, sheet } of this.game.validCells()) {
                const cell = new THREE.Mesh(
                    this.createCellGeometry(x, y, 0.018, 0.022, sheet),
                    this.materialForCell(x, y, sheet)
                );
                cell.castShadow = true;
                cell.receiveShadow = true;
                cell.userData = { type: 'cell', x, y, sheet };
                this.boardGroup.add(cell);
            }
        } else {
            for (let y = 0; y < BOARD_HEIGHT; y++) {
                for (let x = 0; x < BOARD_WIDTH; x++) {
                    const cell = new THREE.Mesh(
                        this.createCellGeometry(x, y, 0.018, 0.022, 0),
                        this.materialForCell(x, y, 0)
                    );
                    cell.castShadow = true;
                    cell.receiveShadow = true;
                    cell.userData = { type: 'cell', x, y, sheet: 0 };
                    this.boardGroup.add(cell);
                }
            }
        }

        this.addGridLines();
        this.addWindingGuides();
        if (this.renderer) this.renderer.shadowMap.needsUpdate = true;
    }

    materialForCell(x, y, sheet = 0) {
        return this.checkerMaterialForCell(x, y, sheet);
    }

    checkerMaterialForCell(x, y, sheet = 0) {
        const row = typeof this.visualRowFor === 'function' ? this.visualRowFor(y, sheet) : y;
        return (x + row) % 2 === 0 ? this.materials.light : this.materials.dark;
    }

    homeRowFor(color) {
        return this.game?.homeRowFor?.(color) ?? (color === 'white' ? 6 : 2);
    }

    addGridLines() {
        const gridMaterial = new THREE.LineBasicMaterial({
            color: BOARD_LIGHT_COLOR,
            transparent: true,
            opacity: 0.28,
            depthWrite: false
        });
        const seamMaterial = new THREE.LineBasicMaterial({
            color: BOARD_LIGHT_COLOR,
            transparent: true,
            opacity: 0.48,
            depthWrite: false
        });

        for (let x = 0; x < BOARD_WIDTH; x++) {
            const v = (x / BOARD_WIDTH) * TWO_PI;
            this.boardGroup.add(this.createTorusLine('v', v, x === 0 ? seamMaterial : gridMaterial));
        }

        for (let row = 0; row < this.visualRowCount(); row++) {
            const u = (row / this.visualRowCount()) * TWO_PI;
            this.boardGroup.add(this.createTorusLine('u', u, this.isSeamVisualRow(row) ? seamMaterial : gridMaterial));
        }
    }

    isSeamVisualRow(row) {
        return new Set([1, 5, 8, 12]).has(row);
    }

    addWindingGuides() {
        const guideMaterial = {
            white: new THREE.MeshStandardMaterial({
                color: 0x7dd3fc,
                emissive: 0x38bdf8,
                emissiveIntensity: 0.42,
                roughness: 0.28
            }),
            black: new THREE.MeshStandardMaterial({
                color: 0xf4a261,
                emissive: 0xf59e0b,
                emissiveIntensity: 0.34,
                roughness: 0.32
            })
        };
        const cone = new THREE.ConeGeometry(0.075, 0.28, 18);
        const yAxis = new THREE.Vector3(0, 1, 0);

        for (const color of ['white', 'black']) {
            const rows = this.game?.pawnRowsFor?.(color) ?? [
                this.homeRowFor(color) + PAWN_DIR[color],
                this.homeRowFor(color) - PAWN_DIR[color]
            ];
            for (const row of rows) {
                const direction = this.game?.pawnDirectionFromHome?.(color, row, 0) ?? (row < this.homeRowFor(color) ? -1 : 1);
                for (const x of [1, 3, 5, 7]) {
                    const pose = this.getCellPose(x, row, 0.28);
                    const tangent = pose.tangentV.clone().multiplyScalar(direction).normalize();
                    const arrow = new THREE.Mesh(cone, guideMaterial[color]);
                    arrow.position.copy(pose.position).add(tangent.clone().multiplyScalar(0.2));
                    arrow.quaternion.setFromUnitVectors(yAxis, tangent);
                    arrow.castShadow = true;
                    arrow.userData = { type: 'guide' };
                    this.boardGroup.add(arrow);
                }
            }
        }
    }

    createTorusLine(axis, value, material) {
        const points = [];
        const segments = axis === 'u' ? 80 : 160;
        for (let i = 0; i <= segments; i++) {
            const t = (i / segments) * TWO_PI;
            const u = axis === 'u' ? value : t;
            const v = axis === 'u' ? t : value;
            points.push(this.pointOnTorus(u, v, this.surfaceLift + 0.032));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.LineLoop(geometry, material);
        line.userData = { type: 'grid' };
        return line;
    }

    addBoardLabels() {
        this.labelGroup.clear();

        for (let x = 0; x < BOARD_WIDTH; x++) {
            const pose = this.getCellPose(x, 0, 0.5, 0);
            const sprite = this.createTextSprite(String(x), 0xc9d7df, 58);
            sprite.position.copy(pose.position);
            sprite.scale.set(0.34, 0.34, 0.34);
            this.labelGroup.add(sprite);
        }
    }

    renderPieces3D(board) {
        this.piecesGroup.clear();
        const layeredBoard = Array.isArray(board[0]?.[0]);

        if (!layeredBoard) {
            for (let y = 0; y < BOARD_HEIGHT; y++) {
                for (let x = 0; x < BOARD_WIDTH; x++) {
                    const piece = board[y]?.[x];
                    if (piece) this.addPiece3D(x, y, piece, 0);
                }
            }
        } else if (typeof this.game?.validCells === 'function') {
            for (const { x, y, sheet } of this.game.validCells()) {
                const piece = board[sheet]?.[y]?.[x];
                if (piece) this.addPiece3D(x, y, piece, sheet);
            }
        } else {
            for (let sheet = 0; sheet < board.length; sheet++) {
                for (let y = 0; y < BOARD_HEIGHT; y++) {
                    for (let x = 0; x < BOARD_WIDTH; x++) {
                        const piece = board[sheet]?.[y]?.[x];
                        if (piece) this.addPiece3D(x, y, piece, sheet);
                    }
                }
            }
        }
        if (this.renderer) this.renderer.shadowMap.needsUpdate = true;
    }

    addPiece3D(x, y, piece, sheet = 0) {
        const group = this.createPieceInstance(piece);
        const pose = this.getCellPose(x, y, this.pieceLift, sheet);

        group.position.copy(pose.position);
        group.quaternion.setFromRotationMatrix(this.surfaceBasisMatrix(pose));
        if (piece.color === 'black') group.rotateY(Math.PI);
        group.userData = { type: 'piece', x, y, sheet, piece };
        group.traverse((child) => {
            child.userData = { type: 'piece', x, y, sheet, piece };
        });
        this.piecesGroup.add(group);
    }

    createPieceInstance(piece) {
        const key = `${piece.color}:${piece.type}`;
        if (!this.pieceShapeCache.has(key)) {
            this.pieceShapeCache.set(key, this.createPieceShape(piece));
        }
        return this.pieceShapeCache.get(key).clone(true);
    }

    surfaceBasisMatrix(pose) {
        const up = pose.normal.clone().normalize();
        const forward = (pose.tangentV || new THREE.Vector3(0, 0, 1)).clone();
        forward.addScaledVector(up, -forward.dot(up));

        if (forward.lengthSq() < 1e-8 && pose.tangentU) {
            forward.copy(pose.tangentU);
            forward.addScaledVector(up, -forward.dot(up));
        }

        if (forward.lengthSq() < 1e-8) {
            const fallback = Math.abs(up.y) < 0.92
                ? new THREE.Vector3(0, 1, 0)
                : new THREE.Vector3(1, 0, 0);
            forward.crossVectors(fallback, up);
        }

        forward.normalize();
        const right = new THREE.Vector3().crossVectors(up, forward).normalize();
        const correctedForward = new THREE.Vector3().crossVectors(right, up).normalize();
        return new THREE.Matrix4().makeBasis(right, up, correctedForward);
    }

    createPieceShape(piece) {
        const color = piece.color === 'white' ? 0xf5f7fb : 0x202633;
        const accent = piece.color === 'white' ? 0x38bdf8 : 0xf59e0b;
        const outline = piece.color === 'white' ? 0x9bdcff : 0xffc56a;
        const material = new THREE.MeshStandardMaterial({
            color,
            metalness: piece.color === 'white' ? 0.14 : 0.2,
            roughness: piece.color === 'white' ? 0.28 : 0.31,
            emissive: accent,
            emissiveIntensity: piece.color === 'white' ? 0.07 : 0.18
        });
        const trimMaterial = new THREE.MeshStandardMaterial({
            color: accent,
            metalness: 0.22,
            roughness: 0.26,
            emissive: accent,
            emissiveIntensity: piece.color === 'white' ? 0.18 : 0.32
        });
        const edgeMaterial = new THREE.LineBasicMaterial({
            color: outline,
            transparent: true,
            opacity: piece.color === 'white' ? 0.62 : 0.85
        });

        const group = new THREE.Group();
        const add = (mesh, meshMaterial = material) => {
            mesh.material = meshMaterial;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 24), edgeMaterial);
            edges.renderOrder = 12;
            mesh.add(edges);
            group.add(mesh);
        };

        add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.12, 24), trimMaterial), trimMaterial);

        switch (piece.type) {
            case 'P':
                add(new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.32, 24), material));
                group.children[1].position.y = 0.22;
                add(new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 16), material));
                group.children[2].position.y = 0.48;
                break;

            case 'R':
                add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.42, 24), material));
                group.children[1].position.y = 0.26;
                add(new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.14, 0.52), trimMaterial), trimMaterial);
                group.children[2].position.y = 0.53;
                break;

            case 'N':
                add(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.23, 0.34, 18), material));
                group.children[1].position.y = 0.24;
                add(new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.34, 0.3), material));
                group.children[2].position.set(0.08, 0.5, 0);
                group.children[2].rotation.z = 0.38;
                break;

            case 'B':
                add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.24, 0.42, 24), material));
                group.children[1].position.y = 0.28;
                add(new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 16), material));
                group.children[2].position.y = 0.57;
                add(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.05), trimMaterial), trimMaterial);
                group.children[3].position.y = 0.78;
                break;

            case 'Q':
                add(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 0.46, 24), material));
                group.children[1].position.y = 0.29;
                add(new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.35, 8), material));
                group.children[2].position.y = 0.66;
                add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), trimMaterial), trimMaterial);
                group.children[3].position.y = 0.88;
                break;

            case 'K':
                add(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.27, 0.48, 24), material));
                group.children[1].position.y = 0.3;
                add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.2, 8), material));
                group.children[2].position.y = 0.68;
                add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 0.06), trimMaterial), trimMaterial);
                group.children[3].position.y = 0.92;
                add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.06), trimMaterial), trimMaterial);
                group.children[4].position.y = 0.96;
                break;

            default:
                add(new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 16), material));
                group.children[1].position.y = 0.28;
                break;
        }

        group.scale.setScalar(0.72);
        return group;
    }

    showSelected(x, y, sheet = 0) {
        this.removeHighlightsByType('selection');
        const overlay = this.createCellOverlay(x, y, sheet, 0xf59e0b, 0.68, 'selection');
        this.highlightGroup.add(overlay);
    }

    showLegalMoves(moves) {
        this.removeHighlightsByType('legal-move');
        if (!this.game.showMoveHints) return;

        for (const move of moves) {
            const color = move.capture ? 0xef4444 : 0x22c55e;
            const sheet = move.sheet || 0;
            const pose = this.getCellPose(move.x, move.y, 0.36, sheet);
            const dot = new THREE.Mesh(
                new THREE.SphereGeometry(0.105, 24, 16),
                new THREE.MeshBasicMaterial({
                    color,
                    transparent: true,
                    opacity: 0.98,
                    depthTest: false,
                    depthWrite: false
                })
            );
            dot.position.copy(pose.position);
            dot.renderOrder = 30;
            dot.userData = { type: 'legal-move', x: move.x, y: move.y, sheet, move };
            this.highlightGroup.add(dot);

            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.2, 0.012, 8, 32),
                new THREE.MeshBasicMaterial({
                    color,
                    transparent: true,
                    opacity: 0.9,
                    depthTest: false,
                    depthWrite: false
                })
            );
            ring.position.copy(pose.position);
            ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pose.normal);
            ring.renderOrder = 29;
            ring.userData = dot.userData;
            this.highlightGroup.add(ring);
        }
    }

    showChosenMove(x, y, sheet = 0) {
        this.removeHighlightsByType('chosen-move');
        const overlay = this.createCellOverlay(x, y, sheet, 0xf59e0b, 0.5, 'chosen-move');
        this.highlightGroup.add(overlay);
    }

    clearChosenMove() {
        this.removeHighlightsByType('chosen-move');
    }

    clearLegalMoveHints() {
        this.removeHighlightsByType('legal-move');
    }

    clearHighlights() {
        this.highlightGroup.clear();
    }

    removeHighlightsByType(type) {
        const remove = this.highlightGroup.children.filter((child) => child.userData?.type === type);
        for (const child of remove) this.highlightGroup.remove(child);
    }

    async onMouseClick(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const hintHits = this.raycaster.intersectObjects(this.highlightGroup.children, true);
        const hint = hintHits.find((hit) => hit.object.userData?.type === 'legal-move');
        if (hint) {
            const { x, y, sheet = 0 } = hint.object.userData;
            await this.game.handleSquareClick(x, y, sheet);
            return;
        }

        const pieceHits = this.raycaster.intersectObjects(this.piecesGroup.children, true);
        if (pieceHits.length) {
            let obj = pieceHits[0].object;
            while (obj && !obj.userData?.piece) obj = obj.parent;
            if (obj?.userData?.piece) {
                await this.game.handleSquareClick(obj.userData.x, obj.userData.y, obj.userData.sheet || 0);
                return;
            }
        }

        const cellHits = this.raycaster.intersectObjects(this.boardGroup.children, false);
        const cell = cellHits.find((hit) => hit.object.userData?.type === 'cell');
        if (cell) {
            const { x, y, sheet = 0 } = cell.object.userData;
            await this.game.handleSquareClick(x, y, sheet);
        }
    }

    resetCamera() {
        this.camera.position.copy(this.homeCameraPosition());
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    resize() {
        const canvas = this.renderer.domElement;
        const width = Math.max(1, canvas.clientWidth);
        const height = Math.max(1, canvas.clientHeight);

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
        if (this.camera.aspect < 0.72 && this.camera.position.length() < 13.6) {
            this.camera.position.setLength(13.6);
            this.controls.update();
        }
        this.controls.handleResize?.();
    }

    homeCameraPosition() {
        const base = this.game.currentPlayer === 'black'
            ? new THREE.Vector3(-6.4, 4.2, -7.2)
            : new THREE.Vector3(6.4, 4.3, 7.2);
        if (this.camera?.aspect < 0.72) base.setLength(13.6);
        return base;
    }

    animate() {
        this.controls.update();
        if (this.shineLight) {
            const t = performance.now() * 0.00042;
            this.shineLight.position.set(Math.cos(t) * 4.5, 2.25 + Math.sin(t * 1.7) * 0.45, Math.sin(t) * 4.5);
        }
        this.renderer.render(this.scene, this.camera);
    }

    createCellOverlay(x, y, sheet, color, opacity, type) {
        const mesh = new THREE.Mesh(
            this.createCellGeometry(x, y, 0.082, 0.035, sheet),
            new THREE.MeshBasicMaterial({
                color,
                transparent: true,
                opacity,
                side: THREE.DoubleSide,
                depthTest: false,
                depthWrite: false
            })
        );
        mesh.renderOrder = type === 'selection' ? 22 : 26;
        mesh.userData = { type, x, y, sheet };
        return mesh;
    }

    createCellGeometry(x, y, lift = 0, inset = 0.022, sheet = 0) {
        const row = this.visualRowFor(y, sheet);
        const u0 = ((row + inset) / this.visualRowCount()) * TWO_PI;
        const u1 = ((row + 1 - inset) / this.visualRowCount()) * TWO_PI;
        const v0 = ((x + inset) / BOARD_WIDTH) * TWO_PI;
        const v1 = ((x + 1 - inset) / BOARD_WIDTH) * TWO_PI;
        return this.createTorusSurfaceGeometry(u0, u1, v0, v1, 8, 6, this.surfaceLift + lift + this.sheetLift(sheet));
    }

    createTorusSurfaceGeometry(u0, u1, v0, v1, uSegments, vSegments, lift = 0) {
        const vertices = [];
        const indices = [];

        for (let iu = 0; iu <= uSegments; iu++) {
            const u = THREE.MathUtils.lerp(u0, u1, iu / uSegments);
            for (let iv = 0; iv <= vSegments; iv++) {
                const v = THREE.MathUtils.lerp(v0, v1, iv / vSegments);
                const point = this.pointOnTorus(u, v, lift);
                vertices.push(point.x, point.y, point.z);
            }
        }

        const row = vSegments + 1;
        for (let iu = 0; iu < uSegments; iu++) {
            for (let iv = 0; iv < vSegments; iv++) {
                const a = iu * row + iv;
                const b = (iu + 1) * row + iv;
                const c = (iu + 1) * row + iv + 1;
                const d = iu * row + iv + 1;
                indices.push(a, b, d, b, c, d);
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        return geometry;
    }

    getCellPose(x, y, lift = 0, sheet = 0) {
        const pose = this.getParametricPose(
            ((this.visualRowFor(y, sheet) + 0.5) / this.visualRowCount()) * TWO_PI,
            ((x + 0.5) / BOARD_WIDTH) * TWO_PI,
            lift + this.sheetLift(sheet)
        );
        return {
            position: pose.position,
            normal: pose.normal,
            tangentU: pose.tangentV,
            tangentV: pose.tangentU
        };
    }

    sheetLift(sheet = 0) {
        return Number(sheet) === 1 ? this.secondSheetLift : 0;
    }

    visualRowCount() {
        return this.game?.visualRowCount?.() ?? (BOARD_HEIGHT + BOARD_HEIGHT - 2);
    }

    visualRowFor(y, sheet = 0) {
        if (typeof this.game?.visualRowForCoord === 'function') {
            return this.game.visualRowForCoord(y, sheet);
        }
        if (Number(sheet) !== 1) return y;
        return BOARD_HEIGHT + (BOARD_HEIGHT - 2 - y);
    }

    getParametricPose(u, v, lift = 0) {
        const normal = this.normalOnTorus(u, v);
        const position = this.pointOnTorus(u, v, this.surfaceLift + lift);
        const tangentU = new THREE.Vector3(-Math.sin(u), 0, Math.cos(u)).normalize();
        const tangentV = new THREE.Vector3(
            -Math.sin(v) * Math.cos(u),
            Math.cos(v),
            -Math.sin(v) * Math.sin(u)
        ).normalize();

        return { position, normal, tangentU, tangentV };
    }

    pointOnTorus(u, v, lift = 0) {
        const tubeRadius = this.minorRadius + lift;
        const ringRadius = this.majorRadius + tubeRadius * Math.cos(v);
        return new THREE.Vector3(
            ringRadius * Math.cos(u),
            tubeRadius * Math.sin(v),
            ringRadius * Math.sin(u)
        );
    }

    normalOnTorus(u, v) {
        return new THREE.Vector3(
            Math.cos(v) * Math.cos(u),
            Math.sin(v),
            Math.cos(v) * Math.sin(u)
        ).normalize();
    }

    createTextSprite(text, color = 0xffffff, fontSize = 80) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        ctx.font = `800 ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 64, 66);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false
        });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(0.52, 0.52, 0.52);
        sprite.renderOrder = 40;
        return sprite;
    }
}
