const ENTITY_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};

const FORMULA_REPLACEMENTS = [
    {
        pattern: /E\s*=\s*-J\s+sum_&lt;ij&gt;\s+s_i\s+s_j\s*-\s*h\s+sum_i\s+s_i\.?/g,
        html: 'E = &minus;J&sum;<sub>(i,j)&isin;E</sub>s<sub>i</sub>s<sub>j</sub> &minus; h&sum;<sub>i</sub>s<sub>i</sub>'
    },
    {
        pattern: /E\s*=\s*-J\s+sum_s_i\s+s_j\s*-\s*h\s+sum_i\s+s_i\.?/g,
        html: 'E = &minus;J&sum;<sub>(i,j)&isin;E</sub>s<sub>i</sub>s<sub>j</sub> &minus; h&sum;<sub>i</sub>s<sub>i</sub>'
    },
    {
        pattern: /E\(s\)\s*=\s*-J\s+sum_\((?:ij|i,j)\s+in\s+E\)\s+s_i\s+s_j\s*-\s*h\s+sum_i\s+s_i\.?/g,
        html: 'E(s) = &minus;J&sum;<sub>(i,j)&isin;E</sub>s<sub>i</sub>s<sub>j</sub> &minus; h&sum;<sub>i</sub>s<sub>i</sub>'
    },
    {
        pattern: /M\s*=\s*\(1\/N_occ\)\s+sum_i\s+s_i\.?/g,
        html: 'M = N<sub>occ</sub><sup>&minus;1</sup>&sum;<sub>i</sub>s<sub>i</sub>'
    },
    {
        pattern: /E\s*=\s*gamma\s+L\s*-\s*b_A\s+A_A\s*-\s*b_B\s+A_B\s*\+\s*kappa\s+C\.?/g,
        html: 'E(&phi;) = &gamma;L(&phi;) &minus; b<sub>A</sub>A<sub>A</sub>(&phi;) &minus; b<sub>B</sub>A<sub>B</sub>(&phi;) + &kappa;C(&phi;)'
    },
    {
        pattern: /E\s*=\s*Delta\s+sum_v\s+max\(1,\s*\|q_v\|\/2\)(?:\s+over\s+violating\s+vertices)?\.?/g,
        html: 'E = &Delta;&sum;<sub>v</sub>max(1, |q<sub>v</sub>|/2)'
    },
    {
        pattern: /E\s*=\s*N_star-violations\s*\+\s*N_flux-violations\.?/g,
        html: 'E = N<sub>star violations</sub> + N<sub>flux violations</sub>'
    },
    {
        pattern: /Z\s*=\s*sum_s\s+exp\(-E\(s\)\/T\)/g,
        html: 'Z = &sum;<sub>s</sub> exp(&minus;E(s)/T)'
    },
    {
        pattern: /Z\(T,J,h\)\s*=\s*sum over all s_i=\+\/-1 of exp\[-H\(s\)\/T\]/g,
        html: 'Z(T,J,h) = &sum;<sub>{s<sub>i</sub>=&plusmn;1}</sub> exp[&minus;H(s)/T]'
    },
    {
        pattern: /Z\(T,J,h\)\s*=\s*sum_\{[^}]+\}\s*exp\[-H\(s\)\/T\]/g,
        html: 'Z(T,J,h) = &sum;<sub>{s<sub>i</sub>=&plusmn;1}</sub> exp[&minus;H(s)/T]'
    },
    {
        pattern: /Z\s*=\s*sum over phi_i in \{A,B,empty\} of exp\[-E\(phi\)\/T\]/g,
        html: 'Z = &sum;<sub>&phi;<sub>i</sub>&isin;{A,B,empty}</sub> exp[&minus;E(&phi;)/T]'
    },
    {
        pattern: /Z\s*=\s*sum_\{[^}]*phi_i[^}]*\}\s*exp\[-E\(phi\)\/T\]/g,
        html: 'Z = &sum;<sub>&phi;<sub>i</sub>&isin;{A,B,empty}</sub> exp[&minus;E(&phi;)/T]'
    },
    {
        pattern: /Z\(T,Delta\)\s*=\s*sum over all arrow configurations of exp\[-E\(arrows\)\/T\]/g,
        html: 'Z(T,&Delta;) = &sum;<sub>arrows</sub> exp[&minus;E(arrows)/T]'
    },
    {
        pattern: /Z\(T,Delta\)\s*=\s*sum_\{[^}]+\}\s*exp\[-E\(arrows\)\/T\]/g,
        html: 'Z(T,&Delta;) = &sum;<sub>arrows</sub> exp[&minus;E(arrows)/T]'
    },
    {
        pattern: /Z\(T\)\s*=\s*sum over all U_e=\+\/-1 of exp\[-E\(U\)\/T\]/g,
        html: 'Z(T) = &sum;<sub>U<sub>e</sub>=&plusmn;1</sub> exp[&minus;E(U)/T]'
    },
    {
        pattern: /Z\(T\)\s*=\s*sum_\{[^}]*U_e[^}]*\}\s*exp\[-E\(U\)\/T\]/g,
        html: 'Z(T) = &sum;<sub>U<sub>e</sub>=&plusmn;1</sub> exp[&minus;E(U)/T]'
    },
    {
        pattern: /F=-T log Z/g,
        html: 'F = &minus;T log Z'
    },
    {
        pattern: /p\s*=\s*exp\(-Delta E\s*\/\s*T\)/g,
        html: 'p = exp(&minus;&Delta;E/T)'
    },
    {
        pattern: /p\s*=\s*min\(1,\s*exp\(-Delta E\s*\/\s*T\)\)/g,
        html: 'p = min(1, exp(&minus;&Delta;E/T))'
    },
    {
        pattern: /Z\s*=\s*Tr exp\(-beta H\)/g,
        html: 'Z = Tr exp(&minus;&beta;H)'
    },
    {
        pattern: /Ue=\+1 or Ue=-1/g,
        html: 'U<sub>e</sub> &isin; {+1,&minus;1}'
    },
    {
        pattern: /U_e in \{\+1,\s*-1\}/g,
        html: 'U<sub>e</sub> &isin; {+1,&minus;1}'
    },
    {
        pattern: /sqrt\(sum_s s\^2 n_s \/ N_occ\)\.?/g,
        html: '&radic;(&sum;<sub>s</sub>s<sup>2</sup>n<sub>s</sub>/N<sub>occ</sub>)'
    },
    {
        pattern: /H\(s\)=−J∑₍ᵢ,ⱼ₎∈E sᵢsⱼ\s*−\s*h∑ᵢsᵢ/g,
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
        .replace(/\bDelta E\b/g, '&Delta;E')
        .replace(/\bsigma\^2\b/g, '&sigma;<sup>2</sup>')
        .replace(/\bmu\b/g, '&mu;');
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
