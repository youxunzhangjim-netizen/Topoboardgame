import { JumpGameApp } from '../../../js/shared/JumpGameApp.js';
window.jumpApp = new JumpGameApp({ dimension: 3, topology: new URLSearchParams(location.search).get('topology') || 'cube', size: 4 });
