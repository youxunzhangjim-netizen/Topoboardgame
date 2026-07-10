const PROFILES = {
    ising_domain_game: {
        objective: {
            en: 'Compare finite-size energy, magnetization, domain morphology, and winding across boundary identifications under matched J, h, T, initial states, schedules, and seeds.',
            zh: '在匹配的 J、h、T、初始態、排程與種子下，比較不同邊界識別的有限尺寸能量、磁化、domain 形態與繞行。'
        },
        model: {
            en: 'Classical graph Ising spins with H(s)=−J∑₍ᵢ,ⱼ₎∈E sᵢsⱼ−h∑ᵢsᵢ; each undirected edge is counted once.',
            zh: '古典圖 Ising 自旋，H(s)=−J∑₍ᵢ,ⱼ₎∈E sᵢsⱼ−h∑ᵢsᵢ；每條無向邊只計一次。'
        },
        dynamics: {
            en: 'Local or connected-domain proposals; optional seeded Metropolis acceptance p = exp(-Delta E/T) for Delta E > 0, with k_B = 1.',
            zh: '局部或連通 domain 提案；Delta E > 0 時可選定種子 Metropolis 接受率 p = exp(-Delta E/T)，並設 k_B = 1。'
        },
        ensemble: {
            en: 'The formal Gibbs weight is exp(-E/T), but Z, free energy, equilibration, and autocorrelation are not estimated by this interface.',
            zh: '形式 Gibbs 權重為 exp(-E/T)，但本介面不估計 Z、自由能、平衡化或自相關。'
        }
    },
    two_phase_competition_game: {
        objective: {
            en: 'Measure topology-dependent phase selection, coarsening, metastable retention, and noncontractible interfaces under matched initial conditions.',
            zh: '在匹配初始條件下，測量拓撲依賴的相選擇、粗化、metastable 保留與不可收縮界面。'
        },
        model: {
            en: 'Discrete objective E = gamma L - b_A A_A - b_B A_B + kappa C, using interface count L, occupied areas A_A/A_B, and a graph-bend penalty C.',
            zh: '離散目標 E = gamma L - b_A A_A - b_B A_B + kappa C，使用界面數 L、佔據面積 A_A/A_B 與圖彎折懲罰 C。'
        },
        dynamics: {
            en: 'Event-driven nucleation, growth, and interface flips; current interface flips reject positive Delta E, with optional seeded droplet perturbations.',
            zh: '事件驅動的成核、成長與界面翻轉；目前界面翻轉拒絕正 Delta E，並可加入定種子 droplet 擾動。'
        },
        ensemble: {
            en: 'No Gibbs ensemble or partition function is sampled; trajectories are finite controlled updates.',
            zh: '不取樣 Gibbs 系綜或配分函數；軌跡是有限受控更新。'
        }
    },
    physical_cluster_go: {
        objective: {
            en: 'Compare connected-component growth, finite-size crossing, cluster statistics, and topology wrapping under matched occupancy rules and seeds.',
            zh: '在匹配的佔據規則與種子下，比較連通分量成長、有限尺寸跨越、cluster 統計與拓撲繞行。'
        },
        model: {
            en: 'Finite graph occupancy process with sectors A/B, vacant contacts, component removal at zero contact, and wrapping classification from topology metadata.',
            zh: '有限圖佔據過程，包含 A/B 扇區、空缺接觸、零接觸分量移除，以及由拓撲資料得到的繞行分類。'
        },
        dynamics: {
            en: 'Manual or automatic placement, connected growth, contact-loss removal, and optional seeded diffusion/noise; update order is stored in the experiment.',
            zh: '手動或自動放置、連通成長、失去接觸後移除，以及可選定種子 diffusion／noise；更新順序會存入實驗。'
        },
        ensemble: {
            en: 'No random-cluster partition function is computed; percolation outputs are finite-run connectivity estimators.',
            zh: '不計算 random-cluster 配分函數；percolation 輸出是有限執行連通性估計。'
        }
    },
    physical_jump_particles: {
        objective: {
            en: 'Characterize topology-dependent reachability, path statistics, exchange parity, recombination, and survival under a fixed event protocol.',
            zh: '在固定事件流程下，描述拓撲依賴的可達性、路徑統計、交換 parity、重組與存活。'
        },
        model: {
            en: 'Finite graph token transport with adjacency hops, validated exchange/scattering paths, optional parity, and compatible recombination events.',
            zh: '有限圖 token 傳輸，包含鄰接躍遷、已驗證交換／scattering 路徑、可選 parity 與相容重組事件。'
        },
        dynamics: {
            en: 'Manual event-driven hopping, exchange, scattering, and recombination; seeded randomness is used only by enabled stochastic rules.',
            zh: '手動事件驅動的躍遷、交換、scattering 與重組；只有啟用的隨機規則使用定種子亂數。'
        },
        ensemble: {
            en: 'No kinetic Hamiltonian, master-equation integration, equilibrium ensemble, or reaction-rate partition function is computed.',
            zh: '不計算動能 Hamiltonian、master equation 積分、平衡系綜或反應速率配分函數。'
        }
    },
    spin_ice_vertex_game: {
        objective: {
            en: 'Compare defect production, string evolution, loop winding, and local ice-constraint recovery across finite graph topologies.',
            zh: '比較有限圖拓撲上的缺陷產生、string 演化、loop 繞行與局部 ice constraint 復原。'
        },
        model: {
            en: 'Signed edge-arrow vertex model with charge q_v from incident orientations and penalty E = Delta sum_v max(1, |q_v|/2) over violating vertices.',
            zh: '帶符號圖邊箭頭頂點模型，以關聯方向得到 q_v，違規頂點懲罰 E = Delta sum_v max(1, |q_v|/2)。'
        },
        dynamics: {
            en: 'Manual edge, open-string, and closed-loop flips; candidate local updates may be ranked by the simplified defect-energy change.',
            zh: '手動圖邊、開放 string 與封閉 loop 翻轉；候選局部更新可依簡化缺陷能量變化排序。'
        },
        ensemble: {
            en: 'No six/eight-vertex transfer matrix, dipolar Hamiltonian, or thermal partition function is computed.',
            zh: '不計算 six/eight-vertex 轉移矩陣、dipolar Hamiltonian 或熱配分函數。'
        }
    },
    z2_gauge_loop_game: {
        objective: {
            en: 'Test topology dependence of syndrome removal, Wilson-loop sectors, loop statistics, and logical-memory outcomes under matched Z2 error protocols.',
            zh: '在匹配的 Z2 誤差流程下，檢驗 syndrome 移除、Wilson loop 扇區、loop 統計與邏輯記憶結果的拓撲依賴性。'
        },
        model: {
            en: 'Z2 edge variables U_e in {+1,-1}; star/face products define syndrome and noncontractible loop products define logical sectors. Displayed E is the unit-weight violation count.',
            zh: 'Z2 圖邊變數 U_e 屬於 {+1,-1}；star／face 乘積定義 syndrome，不可收縮 loop 乘積定義邏輯扇區。畫面 E 是單位權重違反數。'
        },
        dynamics: {
            en: 'Manual edge, path, and loop flips with optional decoder and seeded edge noise; checks and logical sectors are recomputed after each event.',
            zh: '手動圖邊、路徑與 loop 翻轉，可選 decoder 與定種子圖邊噪聲；每個事件後重新計算檢查與邏輯扇區。'
        },
        ensemble: {
            en: 'No quantum state, gauge path integral, spectrum, or finite-temperature partition function is evaluated.',
            zh: '不計算量子態、gauge 路徑積分、能譜或有限溫度配分函數。'
        }
    },
    physical_clifford_reversi: {
        objective: {
            en: 'Compare finite-graph Pauli-frame recovery and logical-sector outcomes across topologies under matched error seeds and recovery protocols.',
            zh: '在匹配的誤差種子與復原流程下，比較不同拓撲的有限圖 Pauli frame 復原與邏輯扇區結果。'
        },
        model: {
            en: 'Classical symbolic stabilizer bookkeeping over graph-local Pauli frames, check violations, commutation diagnostics, ancillas, and logical cycles.',
            zh: '對圖局部 Pauli frame、檢查違反、對易診斷、ancilla 與邏輯循環進行古典符號式 stabilizer 記帳。'
        },
        dynamics: {
            en: 'Manual recovery and optional ancilla measurement events with deterministic replay of seeded measurement/noise errors.',
            zh: '手動復原與可選 ancilla 測量事件，並確定重播定種子的測量／噪聲誤差。'
        },
        ensemble: {
            en: 'No quantum amplitude, channel simulation, Hamiltonian expectation, or equilibrium partition function is computed.',
            zh: '不計算量子振幅、通道模擬、Hamiltonian 期望值或平衡配分函數。'
        }
    },
    physical_anyon_jump: {
        objective: {
            en: 'Test topology dependence of symbolic worldlines, braid history, fusion recovery, and logical memory under a fixed anyon algebra and seeded protocol.',
            zh: '在固定 anyon 代數與定種子流程下，檢驗符號式 worldline、編織歷史、融合復原與邏輯記憶的拓撲依賴性。'
        },
        model: {
            en: 'Graph-local topological-charge labels with model-specific fusion tables, braid words/parity, fusion-channel metadata, and winding sectors.',
            zh: '圖局部拓撲電荷標記，包含模型專屬融合表、braid word／parity、融合通道資料與繞行扇區。'
        },
        dynamics: {
            en: 'Manual hops, exchanges, braids, inverse unbraids, fusion, and measurements; every accepted event is stored for deterministic replay.',
            zh: '手動躍遷、交換、編織、反向解編織、融合與測量；每個已接受事件都會儲存以供確定重播。'
        },
        ensemble: {
            en: 'No microscopic anyon Hamiltonian, wavefunction, path integral, or thermal partition function is solved.',
            zh: '不求解微觀 anyon Hamiltonian、波函數、路徑積分或熱配分函數。'
        }
    },
    physical_virasoro_go: {
        objective: {
            en: 'Measure sensitivity of finite-graph OPE-channel, correlation, block-weight, entropy, and stress proxies to topology and insertion geometry.',
            zh: '測量有限圖 OPE 通道、相關、block 權重、熵與 stress proxy 對拓撲及插入幾何的敏感度。'
        },
        model: {
            en: 'Topology-aware graph contacts with symbolic primary labels, explicit OPE tables, channel metadata, and truncated L_n update operators.',
            zh: '拓撲感知圖接觸，包含符號式 primary 標記、明確 OPE 表、通道資料與截斷 L_n 更新算符。'
        },
        dynamics: {
            en: 'Manual insertion, local OPE/contact update, truncated Virasoro action, and measurement events with optional seeded measurement error.',
            zh: '手動 insertion、局部 OPE／接觸更新、截斷 Virasoro 動作與測量事件，並可加入定種子測量誤差。'
        },
        ensemble: {
            en: 'No continuum action, Hilbert-space Hamiltonian, exact conformal-block decomposition, path integral, or partition function is computed.',
            zh: '不計算連續作用量、Hilbert 空間 Hamiltonian、精確 conformal block 分解、路徑積分或配分函數。'
        }
    },
    clifford_reversi: {
        objective: {
            en: 'Determine how topology and path structure alter symbolic Pauli transport, Clifford-frame updates, and commutation diagnostics.',
            zh: '研究拓撲與路徑結構如何改變符號式 Pauli 傳輸、Clifford frame 更新與對易診斷。'
        },
        model: {
            en: 'Topology-aware graph rays carry symbolic I/X/Y/Z labels, owner sectors, and optional sign/phase metadata through explicit Pauli/Clifford tables.',
            zh: '拓撲感知圖射線透過明確 Pauli／Clifford 表傳輸符號式 I/X/Y/Z 標記、控制扇區與可選正負號／相位資料。'
        },
        dynamics: {
            en: 'Manual event-driven placement, transport, exchange, and Clifford transformation with optional seeded rule noise.',
            zh: '手動事件驅動的放置、傳輸、交換與 Clifford 轉換，並可加入定種子規則噪聲。'
        },
        ensemble: {
            en: 'No state vector, density matrix, Hamiltonian evolution, thermal ensemble, or partition function is computed.',
            zh: '不計算態向量、密度矩陣、Hamiltonian 演化、熱系綜或配分函數。'
        }
    }
};

const FORMAL_OVERRIDES = {
    ising_domain_game: {
        en: {
            model: 'Spins sᵢ∈{−1,+1} on graph G=(V,E).  H(s)=−J∑₍ᵢ,ⱼ₎∈E sᵢsⱼ − h∑ᵢsᵢ.',
            dynamics: 'Single-site/domain proposals use ΔH; if T>0, accept uphill moves with p=min(1, exp(−ΔH/T)).',
            ensemble: 'Reference weight: P(s)∝exp(−H(s)/T).  Z=∑ₛexp(−H(s)/T) is not evaluated here.'
        },
        zh: {
            model: '圖 G=(V,E) 上的自旋 sᵢ∈{−1,+1}。H(s)=−J∑₍ᵢ,ⱼ₎∈E sᵢsⱼ − h∑ᵢsᵢ。',
            dynamics: '單點或 domain 提案使用 ΔH；若 T>0，升能量步以 p=min(1, exp(−ΔH/T)) 接受。',
            ensemble: '參考權重：P(s)∝exp(−H(s)/T)。本介面不計算 Z=∑ₛexp(−H(s)/T)。'
        }
    },
    two_phase_competition_game: {
        en: {
            model: 'Two labels A/B define a finite phase field φ. The graph energy is E(φ)=γL(φ) − b_A A_A(φ) − b_B A_B(φ) + κC(φ), where L is interface length and C is bend cost.',
            dynamics: 'Nucleation, growth, and boundary flips update φ locally; accepted flips lower ΔE unless seeded noise or an explicitly stochastic protocol is enabled.',
            ensemble: 'A thermal reference would use π(φ)=Z^{-1}exp(−E(φ)/T), Z=∑_φ exp(−E(φ)/T). This tool reports controlled finite trajectories instead of sampling that Gibbs ensemble.'
        },
        zh: {
            model: '兩相 A/B 定義有限相場 φ。圖能量為 E(φ)=γL(φ) − b_A A_A(φ) − b_B A_B(φ) + κC(φ)；L 為界面長度，C 為彎折代價。',
            dynamics: '成核、成長與界面翻轉會局部更新 φ；未開啟定種子噪聲或明確隨機流程時，只接受降低 ΔE 的翻轉。',
            ensemble: '熱力學參考可寫成 π(φ)=Z^{-1}exp(−E(φ)/T)，Z=∑_φ exp(−E(φ)/T)。本工具回報受控有限軌跡，而不是對該 Gibbs 系綜取樣。'
        }
    },
    physical_cluster_go: {
        en: {
            model: 'Occupancy field nᵢ∈{0,A,B}. Components use graph adjacency N(i); cluster size |C| and wrapping class w(C) are measured.',
            dynamics: 'Placement and removal update connected components on the board graph; liberties/contacts are graph neighbors.',
            ensemble: 'Percolation and cluster results are finite-run estimators; no random-cluster partition function is computed.'
        },
        zh: {
            model: '佔據場 nᵢ∈{0,A,B}。連通分量使用圖鄰接 N(i)，並測量 |C| 與繞行類別 w(C)。',
            dynamics: '放置與移除在棋盤圖上更新連通分量；氣與接觸都來自圖鄰居。',
            ensemble: 'Percolation 與 cluster 結果是有限執行估計；不計算 random-cluster 配分函數。'
        }
    },
    physical_jump_particles: {
        en: {
            model: 'Tokens live on graph sites.  Moves are paths i→j constrained by adjacency, occupancy, exchange parity π, and recombination rules.',
            dynamics: 'Each event stores a path, exchange, scattering, or recombination record and is replayed deterministically from the seed.',
            ensemble: 'No kinetic Hamiltonian H=p²/2m+V, master equation, or reaction partition function is solved.'
        },
        zh: {
            model: '粒子位於圖頂點。走法為受鄰接、佔據、交換 parity π 與重組規則限制的路徑 i→j。',
            dynamics: '每個事件儲存路徑、交換、散射或重組紀錄，並可由種子確定重播。',
            ensemble: '不求解動能 Hamiltonian H=p²/2m+V、master equation 或反應配分函數。'
        }
    },
    spin_ice_vertex_game: {
        en: {
            model: 'Oriented edge spins σₑ=±1 induce vertex charge qᵥ=∑ₑ incident(v) oᵥₑσₑ.  Ice defects are qᵥ≠0.',
            dynamics: 'Edge, string, and loop flips update σₑ and recompute qᵥ after each accepted event.',
            ensemble: 'No transfer matrix, dipolar Hamiltonian, or thermal partition function is evaluated.'
        },
        zh: {
            model: '有向邊自旋 σₑ=±1 產生頂點電荷 qᵥ=∑ₑ incident(v) oᵥₑσₑ；qᵥ≠0 為 ice 缺陷。',
            dynamics: '邊、string 與 loop 翻轉更新 σₑ，並在每個接受事件後重算 qᵥ。',
            ensemble: '不計算轉移矩陣、dipolar Hamiltonian 或熱配分函數。'
        }
    },
    z2_gauge_loop_game: {
        en: {
            model: 'Z₂ edge variables Uₑ∈{+1,−1}; plaquette checks Bₚ=∏ₑ∈∂p Uₑ and Wilson loops Wγ=∏ₑ∈γUₑ.',
            dynamics: 'Edge/path/loop flips change Uₑ; checks Bₚ and logical loops Wγ are recomputed after each event.',
            ensemble: 'This is symbolic gauge bookkeeping; no path integral, spectrum, or finite-temperature Z is computed.'
        },
        zh: {
            model: 'Z₂ 邊變數 Uₑ∈{+1,−1}；plaquette 檢查 Bₚ=∏ₑ∈∂p Uₑ，Wilson loop 為 Wγ=∏ₑ∈γUₑ。',
            dynamics: '邊、路徑或 loop 翻轉改變 Uₑ；每次事件後重算 Bₚ 與邏輯 loop Wγ。',
            ensemble: '這是符號式 gauge 記帳；不計算路徑積分、能譜或有限溫 Z。'
        }
    },
    physical_clifford_reversi: {
        en: {
            model: 'Pauli labels Pᵢ∈{I,X,Y,Z} with owner sector and syndrome checks Sₐ=∏ᵢPᵢ over graph-local supports.',
            dynamics: 'Recovery and measurement events update a symbolic Clifford frame; seeded errors are replayed deterministically.',
            ensemble: 'No state vector |ψ⟩, density matrix ρ, or Hamiltonian expectation ⟨H⟩ is computed.'
        },
        zh: {
            model: 'Pauli 標記 Pᵢ∈{I,X,Y,Z} 帶有控制扇區；syndrome 檢查 Sₐ=∏ᵢPᵢ 作用在圖局部支撐上。',
            dynamics: '復原與測量事件更新符號 Clifford frame；定種子的錯誤可確定重播。',
            ensemble: '不計算態向量 |ψ⟩、密度矩陣 ρ 或 Hamiltonian 期望值 ⟨H⟩。'
        }
    },
    physical_anyon_jump: {
        en: {
            model: 'Charges a,b,c follow fusion rules Nᶜₐᵦ and braid word β.  Worldlines store winding class [γ].',
            dynamics: 'Hops, exchanges, braids, unbraids, fusion, and measurement update β, fusion channel, and winding metadata.',
            ensemble: 'No microscopic anyon Hamiltonian, wavefunction, path integral, or thermal partition function is solved.'
        },
        zh: {
            model: '電荷 a,b,c 遵守融合規則 Nᶜₐᵦ 與 braid word β；worldline 儲存繞行類別 [γ]。',
            dynamics: '躍遷、交換、編織、解編織、融合與測量更新 β、融合通道與繞行資料。',
            ensemble: '不求解微觀 anyon Hamiltonian、波函數、路徑積分或熱配分函數。'
        }
    },
    physical_virasoro_go: {
        en: {
            model: 'Primary insertions φᵢ carry weights hᵢ.  Local OPE uses φᵢφⱼ≈∑ₖ Cᵏᵢⱼ φₖ and truncated Lₙ actions.',
            dynamics: 'Insertions, contacts, OPE updates, and measurements evolve a finite graph proxy for correlation blocks.',
            ensemble: 'No continuum action S, exact conformal block, Hilbert-space Hamiltonian, or partition function is computed.'
        },
        zh: {
            model: 'Primary 插入 φᵢ 帶權重 hᵢ。局部 OPE 使用 φᵢφⱼ≈∑ₖ Cᵏᵢⱼ φₖ 與截斷 Lₙ 作用。',
            dynamics: '插入、接觸、OPE 更新與測量演化有限圖上的 correlation block proxy。',
            ensemble: '不計算連續作用量 S、精確 conformal block、Hilbert 空間 Hamiltonian 或配分函數。'
        }
    },
    clifford_reversi: {
        en: {
            model: 'Symbolic Pauli ray Pᵢ∈{I,X,Y,Z} is transported along graph paths with Clifford table updates C(Pᵢ).',
            dynamics: 'Placement, transport, exchange, and Clifford transformations update local labels and commutation checks.',
            ensemble: 'No quantum amplitude, density matrix, Hamiltonian evolution, or partition function is computed.'
        },
        zh: {
            model: '符號 Pauli 射線 Pᵢ∈{I,X,Y,Z} 沿圖路徑傳輸，並以 Clifford 表更新 C(Pᵢ)。',
            dynamics: '放置、傳輸、交換與 Clifford 轉換更新局部標記與對易檢查。',
            ensemble: '不計算量子振幅、密度矩陣、Hamiltonian 演化或配分函數。'
        }
    }
};

const LABELS = {
    en: {
        objective: 'Research objective',
        model: 'Model definition',
        dynamics: 'Evolution protocol',
        ensemble: 'Hamiltonian / ensemble boundary',
        method: 'Numerical method',
        scope: 'Validity and scope'
    },
    zh: {
        objective: '研究目標',
        model: '模型定義',
        dynamics: '演化流程',
        ensemble: 'Hamiltonian / 系綜界線',
        method: '數值方法',
        scope: '有效性與適用範圍'
    }
};

const DEFAULT_METHOD = {
    en: 'The registered adapter applies local updates on a reusable topology graph, uses explicit seeded randomness, and exports configuration, hashes, event logs, observables, and warnings.',
    zh: '已註冊 adapter 在可重用拓撲圖上套用局部更新、使用明確的定種子亂數，並匯出設定、hash、事件紀錄、觀測量與警告。'
};

const DEFAULT_SCOPE = {
    en: 'Finite toy/estimator output. Quantitative claims require model-specific benchmarks, convergence checks, repeated seeds, and uncertainty analysis.',
    zh: '屬於有限 toy／estimator 輸出。定量主張需要模型專屬基準、收斂檢查、重複種子與不確定性分析。'
};

const WARNING_ZH = {
    'Metropolis results are discrete finite-graph estimates.': 'Metropolis 結果是離散有限圖估計。',
    'Finite statistical-dynamics estimator; benchmark scaling before quantitative percolation claims.': '有限統計動力學估計器；提出定量 percolation 主張前必須進行 scaling 基準測試。',
    'Finite graph cluster estimator; benchmark lattice scaling before quantitative percolation claims.': '有限圖 cluster 估計器；提出定量 percolation 主張前必須進行晶格 scaling 基準測試。',
    'Toy transport model for topology comparison.': '用於拓撲比較的 toy 傳輸模型。',
    'Edge models are disabled on 3D/4D grid batch runs until edge-orientation exports are standardized there.': '在 3D／4D 圖邊方向匯出標準化前，這些網格的批次執行會停用圖邊模型。',
    'Plaquette estimates depend on the current graph face adapter.': 'Plaquette 估計取決於目前的圖 face adapter。',
    'Estimator only; not hardware-calibrated QEC.': '僅為估計器；不是硬體校準 QEC。',
    'Toy anyon algebra; validation depends on selected algebra.': 'Toy anyon 代數；驗證範圍取決於所選代數。',
    'Toy graph CFT estimator; not exact continuum CFT.': 'Toy 圖 CFT 估計器；不是精確連續 CFT。',
    'Toy symbolic algebra.': 'Toy 符號代數。'
};

export function researchDescription(modelId, language = 'en') {
    const lang = String(language).toLowerCase().startsWith('zh') ? 'zh' : 'en';
    const profile = PROFILES[modelId] || PROFILES.clifford_reversi;
    const formal = FORMAL_OVERRIDES[modelId]?.[lang] || {};
    return {
        labels: LABELS[lang],
        objective: profile.objective[lang],
        model: formal.model || profile.model[lang],
        dynamics: formal.dynamics || profile.dynamics[lang],
        ensemble: formal.ensemble || profile.ensemble[lang],
        method: DEFAULT_METHOD[lang],
        scope: DEFAULT_SCOPE[lang]
    };
}

export function researchWarning(value, language = 'en') {
    return String(language).toLowerCase().startsWith('zh') ? (WARNING_ZH[value] || value) : value;
}
