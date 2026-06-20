const MODEL_URL = new URL('../../models/jump/2d-diamond-triangular-s12-p2-linear.json', import.meta.url);

let scorerPromise = null;

export function loadLatestJumpTrainedScorer() {
  if (!scorerPromise) {
    scorerPromise = fetch(MODEL_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`Jump model request failed: ${response.status}`);
        return response.json();
      })
      .then(createJumpTrainedScorer)
      .catch((error) => {
        console.warn('[Jump robot] Trained model unavailable; using the local heuristic.', error);
        return null;
      });
  }
  return scorerPromise;
}

export function createJumpTrainedScorer(model) {
  const weights = model?.weights || {};
  if (model?.schema !== 'topoboardgame.ml.linear_policy_value.v1') return null;
  return (game, move) => {
    if (!supportsModel(game) || !move?.to) return null;
    const size = Math.max(2, Number(game.size) || 12);
    const normalized = move.to.map((value) => Number(value) / Math.max(1, size - 1));
    const distanceFromEdge = Math.min(...normalized.map((value) => Math.min(value, 1 - value)));
    const centerDistance = Math.sqrt(normalized.reduce((sum, value) => sum + (value - 0.5) ** 2, 0)) / Math.sqrt(normalized.length * 0.25);
    const edge = distanceFromEdge <= 0.001;
    const nearEdge = distanceFromEdge <= 1 / Math.max(2, size - 1);
    const corner = normalized.every((value) => value <= 0.001 || value >= 0.999);
    const features = {
      coord_0: normalized[0] || 0,
      coord_1: normalized[1] || 0,
      move_center_closeness: 1 - centerDistance,
      move_edge: edge ? 1 : 0,
      move_near_edge: nearEdge ? 1 : 0,
      move_corner_or_anchor: corner ? 1 : 0,
      [`move_type:${move.type || 'move'}`]: 1
    };
    return Object.entries(features).reduce((score, [key, value]) => score + (Number(weights[key]) || 0) * value, 0);
  };
}

function supportsModel(game) {
  return game?.dimension === 2
    && game?.topologyName === 'diamond'
    && game?.lattice === 'triangular'
    && game?.size === 12
    && game?.playerCount === 2;
}
