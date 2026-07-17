import { gammaDisplay } from './MajoranaRules.js';

export function majoranaModeDisplay(mode) {
    if (!mode) return '';
    const gamma = gammaDisplay(mode.gammaLabel || mode.id);
    return mode.active === false ? `${gamma}*` : gamma;
}

export function renderMajoranaMode(cell, coord, lab, {
    selectedModeId = '',
    exchangeAnimation = null
} = {}) {
    const mode = lab?.modeAt?.(coord);
    if (!mode) return;
    const node = document.createElement('span');
    node.className = 'majorana-mode-token';
    node.classList.add(mode.owner === 'white' ? 'sector-b' : 'sector-a');
    if (mode.id === selectedModeId) node.classList.add('selected');
    if ((mode.braidWord?.length || 0) > 0) node.classList.add('braided');
    if (mode.active === false) node.classList.add('inactive');
    if (exchangeAnimation && [exchangeAnimation.movingTokenId, exchangeAnimation.targetId].includes(mode.id)) {
        node.classList.add('exchange-participant');
    }

    const gamma = document.createElement('span');
    gamma.className = 'majorana-gamma';
    gamma.textContent = majoranaModeDisplay(mode);
    node.append(gamma);

    const flavor = document.createElement('span');
    flavor.className = 'majorana-flavor';
    flavor.textContent = `F${mode.flavor ?? 0}`;
    node.append(flavor);

    const channel = mode.fusionChannel || mode.hiddenFusionState?.currentChannel;
    if (channel) {
        const channelNode = document.createElement('span');
        channelNode.className = 'majorana-channel';
        channelNode.textContent = channel;
        node.append(channelNode);
    }

    const wordLength = mode.braidWord?.length || 0;
    node.title = [
        `${mode.id}: ${gammaDisplay(mode.gammaLabel)} (${mode.gammaLabel})`,
        `Flavor ${mode.flavor ?? 0}`,
        `site ${lab.topology?.displayCoord?.(mode.position) || mode.position?.join(',')}`,
        mode.parityPartnerId ? `partner ${mode.parityPartnerId}` : '',
        channel ? `fusion channel ${channel}` : '',
        wordLength ? `braid generators ${wordLength}` : 'unbraided',
        'Majorana toy model: braiding is exchange, not a jump.'
    ].filter(Boolean).join('; ');
    cell.append(node);
}
