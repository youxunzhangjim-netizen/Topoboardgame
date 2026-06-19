import { JumpGameApp } from '../../../js/shared/JumpGameApp.js';
window.jumpApp = new JumpGameApp({ dimension: 4, topology: new URLSearchParams(location.search).get('topology') || 'hypercube', size: 5, targetAxis: 'x' });
