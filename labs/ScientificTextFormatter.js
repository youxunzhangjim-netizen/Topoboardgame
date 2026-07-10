const ENTITY_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};

const FORMULA_REPLACEMENTS = [
    {
        pattern: /H\(s\)=−J∑₍ᵢ,ⱼ₎∈E sᵢsⱼ − h∑ᵢsᵢ/g,
        html: 'H(s) = −J∑<sub>(i,j)∈E</sub>s<sub>i</sub>s<sub>j</sub> − h∑<sub>i</sub>s<sub>i</sub>'
    },
    {
        pattern: /p=min\(1, exp\(−ΔH\/T\)\)/g,
        html: 'p = min(1, exp(−ΔH/T))'
    },
    {
        pattern: /P\(s\)∝exp\(−H\(s\)\/T\)/g,
        html: 'P(s) ∝ exp(−H(s)/T)'
    },
    {
        pattern: /Z=∑ₛexp\(−H\(s\)\/T\)/g,
        html: 'Z = ∑<sub>s</sub> exp(−H(s)/T)'
    },
    {
        pattern: /E=γL − bA·Area\(A\) − bB·Area\(B\) \+ κC/g,
        html: 'E(φ) = γL(φ) − b<sub>A</sub>A<sub>A</sub>(φ) − b<sub>B</sub>A<sub>B</sub>(φ) + κC(φ)'
    },
    {
        pattern: /E\(φ\)=γL\(φ\) − b_A A_A\(φ\) − b_B A_B\(φ\) \+ κC\(φ\)/g,
        html: 'E(φ) = γL(φ) − b<sub>A</sub>A<sub>A</sub>(φ) − b<sub>B</sub>A<sub>B</sub>(φ) + κC(φ)'
    },
    {
        pattern: /π\(φ\)=Z\^{-1}exp\(−E\(φ\)\/T\)/g,
        html: 'π(φ) = Z<sup>−1</sup> exp(−E(φ)/T)'
    },
    {
        pattern: /Z=∑_φ exp\(−E\(φ\)\/T\)/g,
        html: 'Z = ∑<sub>φ</sub> exp(−E(φ)/T)'
    },
    {
        pattern: /nᵢ∈\{0,A,B\}/g,
        html: 'n<sub>i</sub> ∈ {0,A,B}'
    },
    {
        pattern: /σₑ=±1/g,
        html: 'σ<sub>e</sub> = ±1'
    },
    {
        pattern: /qᵥ=∑ₑ incident\(v\) oᵥₑσₑ/g,
        html: 'q<sub>v</sub> = ∑<sub>e∋v</sub> o<sub>v,e</sub>σ<sub>e</sub>'
    },
    {
        pattern: /Uₑ∈\{\+1,−1\}/g,
        html: 'U<sub>e</sub> ∈ {+1,−1}'
    },
    {
        pattern: /Bₚ=∏ₑ∈∂p Uₑ/g,
        html: 'B<sub>p</sub> = ∏<sub>e∈∂p</sub>U<sub>e</sub>'
    },
    {
        pattern: /Wγ=∏ₑ∈γUₑ/g,
        html: 'W<sub>γ</sub> = ∏<sub>e∈γ</sub>U<sub>e</sub>'
    },
    {
        pattern: /Pᵢ∈\{I,X,Y,Z\}/g,
        html: 'P<sub>i</sub> ∈ {I,X,Y,Z}'
    },
    {
        pattern: /Sₐ=∏ᵢPᵢ/g,
        html: 'S<sub>a</sub> = ∏<sub>i</sub>P<sub>i</sub>'
    },
    {
        pattern: /φᵢφⱼ≈∑ₖ Cᵏᵢⱼ φₖ/g,
        html: 'φ<sub>i</sub>φ<sub>j</sub> ≈ ∑<sub>k</sub>C<sup>k</sup><sub>ij</sub>φ<sub>k</sub>'
    },
    {
        pattern: /sigma\^2 = mean\[\(x-mu\)\^2\]/g,
        html: 'σ<sup>2</sup> = mean[(x−μ)<sup>2</sup>]'
    },
    {
        pattern: /1\/\(1\+sigma\^2\)/g,
        html: '1/(1+σ<sup>2</sup>)'
    },
    {
        pattern: /sqrt\(sigma\^2\)\/\(\|mu\|\+1\)/g,
        html: '√σ<sup>2</sup>/(|μ|+1)'
    },
    {
        pattern: /exp\(-iHt\)/g,
        html: 'exp(−iHt)'
    }
];

export function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ENTITY_MAP[char]);
}

export function formatScientificText(value) {
    let html = escapeHtml(value);
    for (const replacement of FORMULA_REPLACEMENTS) {
        html = html.replace(replacement.pattern, `<span class="scientific-equation">${replacement.html}</span>`);
    }
    return html
        .replace(/\bDelta E\b/g, 'ΔE')
        .replace(/\bsigma\^2\b/g, 'σ<sup>2</sup>')
        .replace(/\bmu\b/g, 'μ');
}

export function setScientificText(element, value) {
    if (!element) return;
    element.innerHTML = formatScientificText(value);
}

export function createScientificMetadataRow(label, value) {
    const item = document.createElement('div');
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = String(label ?? '');
    description.innerHTML = formatScientificText(value);
    item.append(term, description);
    return item;
}
