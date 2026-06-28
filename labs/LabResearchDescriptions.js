const PROFILES = {
    ising_domain_game: {
        objective: {
            en: 'Compare finite-size energy, magnetization, domain morphology, and winding across boundary identifications under matched J, h, T, initial states, schedules, and seeds.',
            zh: '在匹配的 J、h、T、初始態、排程與種子下，比較不同邊界識別的有限尺寸能量、磁化、domain 形態與繞行。'
        },
        model: {
            en: 'Classical graph Ising energy E = -J sum_(ij in E) s_i s_j - h sum_i s_i, with each undirected edge counted once.',
            zh: '古典圖 Ising 能量 E = -J sum_(ij in E) s_i s_j - h sum_i s_i，每條無向圖邊只計一次。'
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
    return {
        labels: LABELS[lang],
        objective: profile.objective[lang],
        model: profile.model[lang],
        dynamics: profile.dynamics[lang],
        ensemble: profile.ensemble[lang],
        method: DEFAULT_METHOD[lang],
        scope: DEFAULT_SCOPE[lang]
    };
}

export function researchWarning(value, language = 'en') {
    return String(language).toLowerCase().startsWith('zh') ? (WARNING_ZH[value] || value) : value;
}
