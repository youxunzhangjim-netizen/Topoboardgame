import { JumpGameApp } from '../../../js/shared/JumpGameApp.js';
window.jumpApp = new JumpGameApp({ dimension: 2, topology: new URLSearchParams(location.search).get('topology') || 'plane', size: 8 });
