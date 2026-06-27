const ZH = new Map(Object.entries({
  'Language': '語言',
  'Home': '首頁',
  'Topological Board Game': '拓撲棋盤遊戲',
  'Strategy & Systems Labs': '策略與系統實驗室',
  'Topoboard Labs': 'Topoboard 實驗室',
  'Experimental Platform for Discrete Topological Dynamics': '離散拓撲動力學實驗平台',
  'Workspace detail level': '工作區詳細程度',
  'Simple': '簡易',
  'Research': '研究',
  'Labs Home': 'Labs 首頁',
  'Research Navigation': '研究導覽',
  'Physics, mathematics, topology, graph dynamics, and information experiments. Topoboard Life remains separate for cellular automata and biological simulation.': '物理、數學、拓撲、圖動力學與資訊實驗。Topoboard Life 仍獨立負責細胞自動機與生物模擬。',
  'Labs model catalog': 'Labs 模型目錄',
  'Current Experiment': '目前實驗',
  'Experiment metadata': '實驗中繼資料',
  'Unified Labs research workspace': '統一 Labs 研究工作區',
  'Experiment configuration controls': '實驗設定控制',
  'State space, rule, and initial condition details': '狀態空間、規則與初始條件細節',
  'Visualization and observable workspace': '視覺化與可觀測量工作區',
  'Observable panel': '可觀測量面板',
  'Lab move history and logs': 'Labs 更新歷史與紀錄',
  'Model': '模型',
  'Workspace': '工作區',
  'Algebraic Sandboxes': '代數沙盒',
  'Research Models': '研究模型',
  'Labs - Spin systems': 'Labs - 自旋系統',
  'Labs - Statistical and phase dynamics': 'Labs - 統計與相位動力學',
  'Labs - Field theory': 'Labs - 場論',
  'Labs - Topological matter and gauge systems': 'Labs - 拓撲物質與規範系統',
  'Labs - Spin ice / vertex models': 'Labs - Spin ice / 頂點模型',
  'Labs - Quantum information': 'Labs - 量子資訊',
  'Labs - Anyon / excitation systems': 'Labs - 任意子 / 激發系統',
  'Labs - CFT / Virasoro systems': 'Labs - CFT / Virasoro 系統',
  'Spin Systems': '自旋系統',
  'Statistical Dynamics': '統計動力學',
  'Quantum Information': '量子資訊',
  'Topological Matter': '拓撲物質',
  'Field Theory': '場論',
  'Pauli Algebra': 'Pauli 代數',
  'Stabilizer Codes': 'Stabilizer 碼',
  'Fusion': '融合',
  'Braiding': '編織',
  'Topological Memory': '拓撲記憶',
  'Toy CFT': 'Toy CFT',
  'Ising / Domain Wall': 'Ising / 疇壁',
  'Phase Competition': '相位競爭',
  'Cluster Growth': '團簇成長',
  'Reaction-Diffusion': '反應擴散',
  'Spin Ice': 'Spin Ice',
  'Wilson Loops': 'Wilson 迴路',
  'Spin Systems / Ising / Domain Wall': '自旋系統 / Ising / 疇壁',
  'Spin Systems / Phase Competition': '自旋系統 / 相位競爭',
  'Spin Systems / Spin Ice': '自旋系統 / Spin Ice',
  'Statistical Dynamics / Cluster Growth': '統計動力學 / 團簇成長',
  'Statistical Dynamics / Reaction-Diffusion': '統計動力學 / 反應擴散',
  'Quantum Information / Pauli Algebra': '量子資訊 / Pauli 代數',
  'Quantum Information / Stabilizer Codes': '量子資訊 / Stabilizer 碼',
  'Topological Matter / Fusion': '拓撲物質 / 融合',
  'Topological Matter / Braiding': '拓撲物質 / 編織',
  'Topological Matter / Topological Memory': '拓撲物質 / 拓撲記憶',
  'Topological Matter / Wilson Loops': '拓撲物質 / Wilson 迴路',
  'Field Theory / Toy CFT': '場論 / Toy CFT',
  'toy': 'toy 教學模型',
  'estimator': '估計器',
  'benchmarked': '已基準測試',
  'research_grade': '研究級',
  'Spin & Phase Domain Experiment': '自旋與相位疇實驗',
  'Two-Phase Competition Experiment': '雙相競爭實驗',
  'Z2 Gauge Loop Experiment': 'Z2 Gauge 迴路實驗',
  'Spin Ice Vertex Experiment': 'Spin Ice 頂點實驗',
  'Pauli-Frame Recovery Operators': 'Pauli-frame 恢復算符',
  'Particle Hopping / Reaction System': '粒子躍遷 / 反應系統',
  'Topological Memory Worldlines': '拓撲記憶世界線',
  'Anyon Charge Fusion Grid': '任意子電荷融合格',
  'Anyon Fusion & Braiding Worldlines': '任意子融合與編織世界線',
  'Virasoro Worldline Operators': 'Virasoro 世界線算符',
  'Stabilizer Operator Grid': 'Stabilizer 算符格',
  'Clifford Insertion Field': 'Clifford 插入場',
  'Clifford Worldline Operators': 'Clifford 世界線算符',
  'CFT Field Insertion Graph': 'CFT 場插入圖',
  'CFT Local OPE Operators': 'CFT 局部 OPE 算符',
  'Physical Cluster Field': '物理團簇場',
  'observables': '可觀測量',
  'beginner-friendly': '入門友善',
  'research-focused': '研究導向',
  'Topologies: flat, torus, Klein, Mobius, RP2, S2, R3, 4D where supported.': '拓撲：支援時可使用 flat（開放平面）、torus（環面）、Klein、Mobius、RP2、S2、R3、4D。',
  'Pauli-labeled local operators on topology-aware graph rays with Clifford frame transforms.': '在感知拓撲的圖射線上使用 Pauli 標記的局部算符，並套用 Clifford frame 變換。',
  'Local Pauli insertions on graph sites for comparing operator labels across topologies.': '在圖節點插入局部 Pauli，用來比較不同拓撲上的算符標記。',
  'Worldline-style Pauli operator transport through hops and exchanges on graph topology.': '以世界線方式讓 Pauli 算符在圖拓撲上透過躍遷與交換傳輸。',
  'Pauli-frame recovery workspace for syndrome defects, ancillas, and logical-sector checks.': '用於 syndrome 缺陷、ancilla 與邏輯扇區檢查的 Pauli-frame 恢復工作區。',
  'Physical Clifford insertion workspace for graph-local Pauli-frame experiments.': '用於圖局部 Pauli-frame 實驗的物理 Clifford 插入工作區。',
  'Physical Clifford worldline workspace for Pauli-frame transport and recovery events.': '用於 Pauli-frame 傳輸與恢復事件的物理 Clifford 世界線工作區。',
  'Anyon charge placement and fusion on topology-aware graph intervals.': '在感知拓撲的圖區間上放置並融合任意子電荷。',
  'Mobile anyon worldlines for braiding, unbraiding, and fusion-memory experiments.': '可移動任意子世界線，用於編織、解除編織與融合記憶實驗。',
  'Topological memory experiment for toric-code anyon pairs, logical sectors, braiding, and recovery.': '用於 toric-code 任意子對、邏輯扇區、編織與恢復的拓撲記憶實驗。',
  'Physical anyon charge grid for local fusion and charge-sector observables.': '用於局部融合與電荷扇區可觀測量的物理任意子電荷格。',
  'Discrete CFT field insertion graph for primary fields, correlations, entropy, and stress proxies.': '用於 primary fields、關聯、熵與 stress 代理量的離散 CFT 場插入圖。',
  'Local OPE operator workspace for primary insertions, domain signs, and channel updates.': '用於 primary 插入、疇符號與通道更新的局部 OPE 算符工作區。',
  'Virasoro worldline operator sandbox for graph-local field transport.': '用於圖局部場傳輸的 Virasoro 世界線算符沙盒。',
  'Physical Virasoro worldline workspace for graph-local CFT-inspired dynamics.': '用於圖局部 CFT 啟發動力學的物理 Virasoro 世界線工作區。',
  'Spin-domain experiment for local flips, domain-wall stability, energy, and topology winding.': '研究局部翻轉、疇壁穩定性、能量與拓撲繞行的自旋疇實驗。',
  'Two-phase substrate experiment for nucleation, growth, interface cost, and wrapped domains.': '研究成核、生長、界面成本與包繞疇的雙相基底實驗。',
  'Cluster growth and percolation workspace for resources, open contacts, and topology wrapping.': '用於資源、開放接觸與拓撲包繞的團簇成長與滲流工作區。',
  'Particle hopping, exchange scattering, recombination, and path parity on topology graphs.': '在拓撲圖上研究粒子躍遷、交換散射、重組與路徑奇偶。',
  'Edge-arrow spin ice workspace for vertex constraints, monopoles, strings, loops, and winding.': '用於頂點約束、單極、弦、迴路與繞行的邊箭頭 Spin Ice 工作區。',
  'Z2 gauge edge-field workspace for star checks, plaquette flux, Wilson loops, and logical sectors.': '用於 star 檢查、plaquette 通量、Wilson 迴路與邏輯扇區的 Z2 gauge 邊場工作區。',
  'Empty, Black/White controlled Pauli operators I/X/Y/Z with optional sign and phase.': '空位置，以及由 Black/White 控制、可帶符號與相位的 Pauli 算符 I/X/Y/Z。',
  'symbolic Pauli label plus owner sector': '符號 Pauli label 加上擁有者扇區',
  'Legal updates use graph rays, seam transport, and local Pauli-frame compatibility.': '合法更新使用圖射線、接縫傳輸與局部 Pauli-frame 相容性。',
  'A discrete operator sandbox for topology-dependent Pauli transport.': '用來研究拓撲相依 Pauli 傳輸的離散算符沙盒。',
  'Topology-aware Clifford local update': '拓撲感知 Clifford 局部更新',
  'Graph rays and adjacent vertices from the selected topology.': '來自所選拓撲的圖射線與相鄰頂點。',
  'Manual event-driven update': '手動事件驅動更新',
  'Deterministic unless noise controls are enabled.': '除非啟用 noise 控制，否則為確定性。',
  'Pauli distribution': 'Pauli 分布',
  'Owner counts': 'Owner 計數',
  'Phase/sign distribution': '相位 / 符號分布',
  'Commutation conflicts': '對易衝突',
  'Educational Pauli/Clifford operator transport on finite graphs.': '有限圖上的 Pauli/Clifford 算符傳輸教學實驗。',
  'Toy symbolic algebra; not a calibrated quantum device simulation.': '玩具符號代數模型；不是校準過的量子裝置模擬。',
  'Internal consistency and seeded replay checks are the intended baseline.': '目前基準是內部一致性與帶 seed 的重播檢查。',
  'Empty graph vertices and inserted X/Y/Z Pauli operators.': '空圖頂點與已插入的 X/Y/Z Pauli 算符。',
  'symbolic site state': '符號位置狀態',
  'Insertion and local interactions follow graph adjacency.': '插入與局部互動依照圖鄰接關係。',
  'Operator insertion field for discrete Pauli labels.': '用於離散 Pauli labels 的算符插入場。',
  'Pauli insertion field update': 'Pauli insertion field 更新',
  'Local graph adjacency and topology seams.': '局部圖鄰接關係與拓撲接縫。',
  'Inserted operators': '已插入 operators',
  'Label distribution': 'Label 分布',
  'Topology contacts': 'Topology contacts',
  'Graph insertion model for operator-label exploration.': '用於探索算符標記的圖插入模型。',
  'Toy symbolic estimator.': '玩具符號估計器。',
  'Requires benchmark adapters before research-grade claims.': '提出 research_grade 主張前，需要基準測試轉接器。',
  'Mobile X/Y/Z operator tokens and empty graph vertices.': '可移動的 X/Y/Z 算符 token 與空圖頂點。',
  'token state plus symbolic Pauli label': 'token 狀態加上符號 Pauli label',
  'Movement follows graph adjacency and selected exchange paths.': '移動依照圖鄰接關係與所選交換路徑。',
  'Worldline transport sandbox for local operator labels.': '用於局部算符標記的世界線傳輸沙盒。',
  'Pauli worldline hop/exchange': 'Pauli worldline 躍遷 / 交換',
  'Adjacent vertices and jump paths in the topology graph.': '拓撲圖中的相鄰頂點與跳躍路徑。',
  'Token counts': 'Token 計數',
  'Path history': '路徑歷史',
  'Pauli labels': 'Pauli 標記',
  'Exchange events': '交換事件',
  'Worldline visualization for topology-dependent label transport.': '用於拓撲相依標記傳輸的世界線視覺化。',
  'Toy transport model.': '玩具傳輸模型。',
  'Replay and event-log consistency only.': '僅檢查重播與事件紀錄一致性。',
  'I/X/Y/Z qubit-site operators with sign, phase, owner sector, and optional ancilla state.': '含符號、相位、擁有者扇區與可選 ancilla 狀態的 I/X/Y/Z qubit-site 算符。',
  'symbolic Pauli frame with integer phase': '帶整數相位的符號 Pauli frame',
  'Syndrome checks, logical cycle checks, and allowed ancilla actions.': 'Syndrome checks、logical cycle checks 與允許的 ancilla actions。',
  'Discrete stabilizer recovery estimator on a reusable topology graph.': '可重用拓撲圖上的離散 stabilizer recovery 估計器。',
  'Pauli-frame recovery update': 'Pauli-frame recovery 更新',
  'Local graph neighborhoods and topology cycles.': '局部圖鄰域與拓撲循環。',
  'Manual recovery actions with optional measurement/noise events': '手動 recovery 動作，可選 measurement / noise 事件',
  'Seeded stochastic when measurement error or noise is enabled.': '啟用 measurement error 或 noise 時，使用帶 seed 的隨機過程。',
  'Syndrome weight': 'Syndrome 權重',
  'Logical sector': '邏輯扇區',
  'Global parity': '全域奇偶',
  'Vacuum recovery': '真空恢復',
  'Stabilizer bookkeeping is discrete and graph-local.': 'Stabilizer 記帳是離散且圖局部的。',
  'Estimator for recovery behavior, not hardware-calibrated QEC.': '這是 recovery 行為估計器，不是硬體校準的 QEC。',
  'Benchmarks should compare against known stabilizer examples before upgrade.': '升級前應與已知 stabilizer 範例做基準比較。',
  'Vacuum and anyon charge labels from the selected anyon model.': '來自所選 anyon 模型的 vacuum 與 anyon 電荷標記。',
  'symbolic charge labels': '符號電荷標記',
  'Fusion rules and topology-aware local contacts.': 'Fusion rules 與感知拓撲的局部接觸。',
  'Discrete topological charge fusion sandbox.': '離散拓撲電荷融合沙盒。',
  'Local charge fusion update': '局部電荷融合更新',
  'Adjacent graph sites and local interval contacts.': '相鄰圖位置與局部區間接觸。',
  'Charge counts': 'Charge 計數',
  'Fusion outcomes': '融合結果',
  'Symbolic anyon fusion rules on finite graphs.': '有限圖上的符號 anyon fusion 規則。',
  'Toy topological matter visualization.': '玩具拓撲物質視覺化。',
  'Requires external benchmark examples for stronger claims.': '提出更強主張前，需要外部基準範例。',
  'Mobile anyon tokens, vacuum vertices, braid words, fusion channels, and energy metadata.': '可移動 anyon token、vacuum 頂點、braid word、fusion channel 與能量 metadata。',
  'token state plus symbolic charge and braid memory': 'token 狀態加上符號電荷與 braid memory',
  'Graph-local hops, exchanges, inverse unbraiding, and model-specific fusion rules.': '圖局部 hop、exchange、inverse unbraiding 與模型專屬 fusion rules。',
  'Worldline workspace for topological charge transport.': '用於拓撲電荷傳輸的世界線工作區。',
  'Anyon hop, braid, unbraid, and fusion update': 'Anyon hop、braid、unbraid 與 fusion 更新',
  'Adjacent vertices, jump paths, and topology cycles.': '相鄰頂點、跳躍路徑與拓撲循環。',
  'Seeded stochastic when anyon noise is enabled.': '啟用 anyon noise 時，使用帶 seed 的隨機過程。',
  'Total fusion charge': '總融合電荷',
  'Braid word length': 'Braid word 長度',
  'Energy history': '能量歷史',
  'Unbraid success': 'Unbraid 成功率',
  'Symbolic braid/fusion memory with graph-local moves.': '具有圖局部移動的符號 braid / fusion memory。',
  'Toy or estimator depending on model and settings.': '依模型與設定屬於 toy 或 estimator 等級。',
  'Replay and known fusion-rule checks are the baseline.': '目前基準是重播與已知 fusion-rule 檢查。',
  'Identity background and primary-field insertions such as sigma and epsilon.': 'Identity 背景，以及 sigma、epsilon 等 primary-field insertion。',
  'symbolic primary field with channel metadata': '帶 channel metadata 的符號 primary field',
  'Graph contact, OPE channel rules, and optional Virasoro truncation.': '圖接觸、OPE channel rules 與可選 Virasoro truncation。',
  'Graph estimator for field insertions and CFT-like observables.': '用於 field insertions 與 CFT-like observables 的圖估計器。',
  'Primary insertion and Virasoro graph update': 'Primary insertion 與 Virasoro graph 更新',
  'Local graph contacts, intervals, and selected generator direction.': '局部圖接觸、區間與所選 generator direction。',
  'Manual insertion, generator, and measurement events': '手動 insertion、generator 與 measurement 事件',
  'Seeded stochastic only when measurement/noise options are enabled.': '只有啟用 measurement / noise 選項時，才使用帶 seed 的隨機過程。',
  'Dominant conformal block': '主導 conformal block',
  'OPE channels': 'OPE channels',
  'Entropy estimate': '熵估計',
  'Correlation estimate': '關聯估計',
  'Stress proxy': 'Stress proxy',
  'Discrete graph estimators approximate selected CFT concepts.': '離散圖估計器只近似部分 CFT 概念。',
  'Estimator, not an exact continuum CFT calculation.': '這是估計器，不是精確的連續 CFT 計算。',
  'Known limitations should remain visible with every export.': '每次匯出都應保留已知限制。',
  'Spin up s=+1, spin down s=-1, and optional empty/undecided graph sites.': 'Spin up s=+1、spin down s=-1，以及可選空白 / 未決定圖位置。',
  'integer spin sector per site': '每個位置的整數 spin sector',
  'Graph-neighbor interactions and optional Metropolis acceptance.': '圖鄰居互動與可選 Metropolis acceptance。',
  'Discrete spin field on a topology-aware lattice graph.': '感知拓撲的晶格圖上的離散 spin field。',
  'Ising graph energy and domain-wall update': 'Ising graph energy 與 domain-wall 更新',
  'Nearest graph neighbors from the selected topology.': '來自所選拓撲的最近圖鄰居。',
  'Manual local update with optional Metropolis stochastic acceptance': '手動局部更新，可選 Metropolis stochastic acceptance',
  'Seeded stochastic when temperature/Metropolis or noise is enabled.': '啟用 temperature / Metropolis 或 noise 時，使用帶 seed 的隨機過程。',
  'Energy': 'Energy',
  'Magnetization': 'Magnetization',
  'Domain wall length': 'Domain wall length',
  'Domain count': 'Domain count',
  'Topology winding': 'Topology winding',
  'Finite graph Ising-like estimator with selected boundary conditions.': '具所選邊界條件的有限圖 Ising-like 估計器。',
  'Discrete estimator; not a continuum thermodynamic solver.': '離散估計器；不是連續熱力學求解器。',
  'Benchmarking should compare energy and magnetization against known Ising cases.': '基準測試應與已知 Ising 案例的 energy 與 magnetization 比較。',
  'Phase A, phase B, and metastable empty substrate.': 'Phase A、Phase B 與亞穩空基底。',
  'enum site state': '列舉式位置狀態',
  'Growth and interface updates follow graph contacts and energy settings.': '成長與界面更新依照圖接觸與能量設定。',
  'Discrete phase-field competition on a topology graph.': '拓撲圖上的離散 phase-field competition。',
  'Nucleation, growth, and interface update': '成核、成長與界面更新',
  'Adjacent graph sites and interface contacts.': '相鄰圖位置與界面接觸。',
  'Manual or auto-selected local update': '手動或自動選擇的局部更新',
  'Seeded stochastic when droplet noise is enabled.': '啟用 droplet noise 時，使用帶 seed 的隨機過程。',
  'Interface length': '界面長度',
  'Area fractions': '面積比例',
  'Wrapped interfaces': '包回界面',
  'Toy phase-field energy on a finite graph substrate.': '有限圖基底上的玩具 phase-field 能量。',
  'Estimator for qualitative interface behavior.': '用於定性界面行為的估計器。',
  'Needs benchmark cases before quantitative use.': '定量使用前需要基準案例。',
  'Empty resource sites and occupied cluster sectors A/B.': '空資源位置與已佔據的 cluster sector A/B。',
  'enum site state with connected-component metadata': '帶 connected-component metadata 的列舉式位置狀態',
  'Connected clusters require graph-neighbor contacts; zero-contact clusters can be removed.': '連通團簇需要圖鄰居接觸；零接觸團簇可被移除。',
  'Statistical cluster dynamics on finite topology graphs.': '有限拓撲圖上的統計團簇動力學。',
  'Cluster placement, growth, and zero-contact removal': '團簇放置、成長與零接觸移除',
  'Connected graph clusters and nearest-neighbor resource contacts.': '連通圖團簇與最近鄰資源接觸。',
  'Manual or auto local update with optional diffusion/noise': '手動或自動局部更新，可選 diffusion / noise',
  'Seeded stochastic when cluster noise is enabled.': '啟用 cluster noise 時，使用帶 seed 的隨機過程。',
  'Largest cluster': '最大團簇',
  'Cluster-size distribution': '團簇大小分布',
  'Percolation probability': '滲流機率',
  'Wrapping clusters': '包回團簇',
  'Statistical dynamics interpretation only; biological species language belongs in Topoboard Life.': '僅作統計動力學解釋；生物物種語言屬於 Topoboard Life。',
  'Estimator for graph percolation and cluster growth.': '用於圖滲流與團簇成長的估計器。',
  'Percolation benchmarks should be added for known lattices.': '應為已知晶格加入滲流基準測試。',
  'Empty vertices and mobile particle species/charge signs.': '空頂點與可移動粒子物種 / 電荷符號。',
  'token or site occupancy state': 'token 或位置佔據狀態',
  'Hops, exchanges, scattering paths, and recombination follow graph reachability.': 'Hop、exchange、scattering path 與 recombination 依照圖可達性。',
  'Discrete particle transport and reaction sandbox.': '離散粒子傳輸與反應沙盒。',
  'Particle hop, exchange, scatter, and recombine update': '粒子 hop、exchange、scatter 與 recombine 更新',
  'Adjacent vertices and allowed multi-step scattering paths.': '相鄰頂點與允許的多步散射路徑。',
  'Particle count': '粒子數',
  'Recombination count': '復合數',
  'Path parity': '路徑奇偶',
  'Average path length': '平均路徑長度',
  'Qualitative graph reaction-diffusion system.': '定性圖 reaction-diffusion 系統。',
  'Toy dynamics, not calibrated chemistry.': '玩具動力學；不是校準過的化學模型。',
  'Replay and graph-reachability checks only.': '僅提供重播與圖可達性檢查。',
  'Edge arrows aligned or anti-aligned with graph orientation.': '與圖方向同向或反向的邊箭頭。',
  'signed edge state': '帶符號邊狀態',
  'Vertex ice-rule checks and allowed string/loop flips.': '頂點 ice-rule 檢查與允許的 string / loop 翻轉。',
  'Discrete constrained edge system with monopole-like defects.': '具有 monopole-like defect 的離散受約束邊系統。',
  'Edge-arrow flip, string, loop, and monopole update': '邊箭頭翻轉、string、loop 與 monopole 更新',
  'Incident edges, vertex checks, paths, and cycles.': '入射邊、頂點檢查、路徑與循環。',
  'Ice-rule violations': 'Ice-rule 違反',
  'Monopole count': 'Monopole 數',
  'String length': 'String 長度',
  'Loop winding': 'Loop 繞行',
  'Finite graph vertex-model estimator.': '有限圖 vertex-model 估計器。',
  'Estimator for constrained edge dynamics.': '用於受約束邊動力學的估計器。',
  'Compare small graph sectors before stronger claims.': '提出更強主張前，請先比較 small graph sector。',
  'Edge field Ue=+1 or Ue=-1 with optional charge/flux syndrome metadata.': '邊場 Ue=+1 或 Ue=-1，並可帶 charge / flux syndrome metadata。',
  'Star checks, plaquette/cycle checks, and topology-cycle logical sectors.': 'Star check、plaquette / cycle check 與拓撲循環邏輯扇區。',
  'Discrete Z2 lattice gauge and memory estimator.': '離散 Z2 lattice gauge 與記憶估計器。',
  'Edge, path, loop, check, and decoder update': '邊、路徑、loop、check 與 decoder 更新',
  'Incident edges, open paths, closed loops, local faces, and cycles.': '入射邊、開放路徑、閉合 loop、局部面與循環。',
  'Manual event-driven update with optional decoder/noise': '手動事件驅動更新，可選 decoder / noise',
  'Seeded stochastic when noisy edge flips are enabled.': '啟用 noisy edge flip 時，使用帶 seed 的隨機過程。',
  'Star violations': 'Star 違反',
  'Plaquette flux': 'Plaquette 通量',
  'Wilson loops': 'Wilson loop',
  'Discrete Z2 gauge toy/estimator on graph topology.': '圖拓撲上的離散 Z2 gauge toy / estimator。',
  'Estimator; face definitions depend on available graph cell structure.': '估計器；face definitions 取決於可用的 graph cell structure。',
  'Small-code and known-loop tests should be benchmarked.': '應對 small-code 與 known-loop 測試做基準測試。',
  'Standard seeded configuration': '標準種子初始配置',
  'Standard worldline seed': '標準 worldline seed',
  'Local update': '局部更新',
  'Not configured': '尚未設定',
  'Custom Pauli setup is active; edit sites, then press Start.': '自訂 Pauli setup 已啟用；請編輯 sites，然後按「開始」。',
  'Manual edit is available where the selected model exposes a local palette or custom setup.': '當所選模型提供局部調色盤或自訂設定時，可使用手動編輯。',
  'References placeholder; attach benchmark notes before raising validation level.': '參考資料占位；提高驗證等級前請附上基準測試註記。',
  'Width / Nx': '寬度 / Nx',
  'Height / Ny': '高度 / Ny',
  'Higher-dimensional size': '高維尺寸',
  'Rule Parameters': '規則參數',
  'Algebra Set': '代數集合',
  'Frame Transform': '框架變換',
  'Phase / Sign Display': '相位 / 正負號顯示',
  'Initial Rule': '初始規則',
  'Initial Sign': '初始正負號',
  'View Mode': '視圖模式',
  'Physics View': '物理視圖',
  'Game View': '遊戲視圖',
  'Local Operator': '局部算符',
  'Apply Pauli Recovery Operator': '套用 Pauli 恢復算符',
  'Prepare Ancilla': '準備 Ancilla',
  'Entangle Ancilla': '糾纏 Ancilla',
  'Discard Ancilla': '丟棄 Ancilla',
  'Phase Action': '相位作用',
  'Positive': '正',
  'Negative': '負',
  'Local Pauli': '局部 Pauli',
  'Domain Parity': '疇奇偶',
  'Line Interval': '線區間',
  'Neighborhood Stabilizer': '鄰域 Stabilizer',
  'Logical Cycle': '邏輯循環',
  'Excitation Energy': '激發能量',
  'Move / Braid': '移動 / 編織',
  'Excite Anyon': '激發任意子',
  'Recombine / Recover': '重組 / 恢復',
  'Braid Memory': '編織記憶',
  'Abelian Parity': 'Abelian 奇偶',
  'Word Exact': '精確字詞',
  'Non-Abelian Channel': '非 Abelian 通道',
  'Anyon Model': '任意子模型',
  'General Z_n Phase': '一般 Z_n 相位',
  'Entanglement Range': '糾纏範圍',
  'Infinite': '無限',
  'Finite Distance': '有限距離',
  'Braid Cancellation': '編織抵消',
  'Adjacent Inverse': '相鄰反元',
  'Braid Relations': '編織群關係',
  'Braided capture': '編織捕獲',
  'Virasoro Layer': 'Virasoro 層',
  'Insert Field': '插入場',
  'Warning Only': '只警告',
  'Remove Group': '移除群組',
  'CFT Model': 'CFT 模型',
  'Free Boson CFT': '自由玻色子 CFT',
  'Primary Type': 'Primary 類型',
  'Place Primary': '放置 Primary',
  'Two-Point Correlator': '二點關聯函數',
  'Four-Point Block': '四點共形塊',
  'Dominant Block': '主導共形塊',
  'Region Entropy': '區域熵',
  'Dynamics': '動力學',
  'Noise settings': '噪聲設定',
  'Time settings': '時間設定',
  'Noise Type': '噪聲類型',
  'Noise Clock': '噪聲時鐘',
  'Noise Rate': '噪聲率',
  'After Move': '每步後',
  'After Round': '每回合後',
  'Manual Noise Tick': '手動噪聲刻',
  'Depolarizing': '去極化',
  'Bit Flip': '位元翻轉',
  'Phase Flip': '相位翻轉',
  'Erasure': '擦除',
  'Time Evolution Rule': '時間演化規則',
  'Field H': '場 H',
  'Coupled H': '耦合 H',
  'Experiment Controls': '實驗控制',
  'Reset Experiment': '重設實驗',
  'No Update': '不更新',
  'Summarize': '摘要',
  'Unbraid Hint': '解除編織提示',
  'Noise Tick': '噪聲刻',
  'Time Step': '時間步',
  'Collaboration': '協作',
  'Reconnect': '重新連線',
  'Leave': '離開',
  'State Space': '狀態空間',
  'Local states': '局部狀態',
  'Encoding': '編碼',
  'State encoding': '狀態編碼',
  'Constraints': '約束',
  'Interpretation': '詮釋',
  'Local Rule': '局部規則',
  'Rule': '規則',
  'Neighborhood': '鄰域',
  'Schedule': '排程',
  'Update schedule': '更新排程',
  'Determinism': '確定性',
  'Rule hash': '規則雜湊',
  'Initial Condition': '初始條件',
  'Preset': '預設',
  'Seed': '種子',
  'Manual edit': '手動編輯',
  'Available when supported by this model.': '此模型支援時可使用。',
  'Import / reset': '匯入 / 重設',
  'Use import state from exported JSON and Reset Experiment to rebuild from the selected configuration.': '可從匯出的 JSON 匯入狀態，並用「重設實驗」依目前設定重建。',
  'Custom Pauli setup is active; edit sites, then press Start.': '自訂 Pauli 設定已啟用；請先編輯節點，再按 Start。',
  'Manual edit is available where the selected model exposes a local palette or custom setup.': '當所選模型提供局部調色盤或自訂設定時，可使用手動編輯。',
  'orientable, periodic cycles': '可定向，週期循環',
  'non-orientable, twisted cycle': '不可定向，扭轉循環',
  'closed surface with poles': '含極點的閉合曲面',
  'computed from graph adjacency when adapter data is available': '有 adapter 資料時由圖鄰接關係計算',
  'Topology Summary': '拓撲摘要',
  'Dimension': '維度',
  'Boundary': '邊界',
  'Invariants': '不變量',
  'Topology hash': '拓撲雜湊',
  'z layer': 'z 層',
  'w layer': 'w 層',
  'Visualization Panel': '視覺化面板',
  'Snapshot': '快照',
  'Active Sector': '目前扇區',
  'Introduction': '介紹',
  'Close introduction': '關閉介紹',
  'Observable export': '可觀測量匯出',
  'Research Notes': '研究筆記',
  'Assumptions': '假設',
  'Approximation': '近似',
  'Validation notes': '驗證註記',
  'References': '參考資料',
  'References placeholder; attach benchmark notes before raising validation level.': '參考資料占位；提高驗證等級前請附上基準測試註記。',
  'Event Log': '事件紀錄',
  'Export Config JSON': '匯出設定 JSON',
  'Export Result JSON': '匯出結果 JSON',
  'Export Observable CSV': '匯出可觀測量 CSV',
  'Export Snapshot': '匯出快照',
  'Copy Citation': '複製引用',
  'Copy Experiment Link': '複製實驗連結',
  'Game': '遊戲',
  'Game Layer': '遊戲層',
  'Algebraic Games': '代數遊戲',
  'Research Problem': '研究問題',
  'None': '無',
  'On': '開啟',
  'Off': '關閉',
  'Game Controls': '遊戲控制',
  'Play': '遊玩',
  'Game Mode': '遊戲模式',
  'Mode': '模式',
  'Local': 'Local（本機）',
  'Online': 'Online（線上）',
  'Robot': 'Robot（機器人）',
  'Disconnected': '未連線',
  'Find Match': '尋找對手',
  'Create Room': '建立房間',
  'Join Room': '加入房間',
  'Join': '加入',
  'Copy': '複製',
  'Copy Share Link': '複製分享連結',
  'Leave Room': '離開房間',
  'PRIVATE ROOM': '私人房間',
  'OR': '或',
  'Room code': '房間代碼',
  'Room:': '房間：',
  'Online Chat': '線上聊天',
  'Connect online to chat.': '連線後即可聊天。',
  'Message opponent': '傳訊息給對手',
  'Message online opponent': '傳訊息給線上對手',
  '5-digit room code or shared link': '5 位數房號或分享連結',
  'Connect online before chatting.': '請先連線再聊天。',
  'Synced online game.': '已同步線上棋局。',
  'Send': '傳送',
  'Board Size': '棋盤大小',
  'Board size': '棋盤大小',
  'Board Scale': '棋盤尺度',
  'Boundary Condition': '邊界條件',
  'Topology': '拓撲',
  'Lattice': '晶格',
  'Standard': '標準',
  'Custom': '自訂',
  'Square': '方格',
  'Honeycomb': '蜂巢格',
  'Triangular': '三角格',
  'Polar Center Node': '極座標中心點',
  'Cylinder x-wrap': '圓柱 x 週期',
  'PBC All Sides': '全邊週期 PBC',
  'Klein Bottle': 'Klein 瓶',
  'All layers': '所有層',
  'Zoom Layer': '縮放層',
  'Visible R3 z-layer': '可見 R3 z 層',
  'R3 coordinate view filter': 'R3 座標視圖篩選',
  'Rotate X': '旋轉 X',
  'Rotate Y': '旋轉 Y',
  'Rotate Z': '旋轉 Z',
  'Zoom': '縮放',
  'Reset View': '重設視圖',
  'Reset Camera': '重設相機',
  'Focus Own': '聚焦己方',
  'Timer per Player': '每位玩家計時',
  'Timer': '計時',
  'No Timer': '不計時',
  'No time': '不計時',
  '5 Minutes': '5 分鐘',
  '10 Minutes': '10 分鐘',
  '30 Minutes': '30 分鐘',
  '1 Hour': '1 小時',
  '1 Day': '1 天',
  '3 min': '3 分鐘',
  '5 min': '5 分鐘',
  '10 min': '10 分鐘',
  '15 min': '15 分鐘',
  '30 min': '30 分鐘',
  'Pass': '停一手',
  'Agree Count': '同意數目',
  'New Game': '新遊戲',
  'Surrender': '認輸',
  'Final Count': '最終計分',
  'Move History': '移動歷史',
  'Move History + Analysis': '移動歷史 + 分析',
  'Rules': '規則',
  'Info': '說明',
  'Black': '黑方',
  'White': '白方',
  'Black to play': '黑方行動',
  'White to play': '白方行動',
  'Captured by Black': '黑方提子',
  'Captured by White': '白方提子',
  'Local pass and play': '本機輪流遊玩',
  'Robot & Analysis': '機器人與分析',
  'Robot Side': '機器人方',
  'Robot side': '機器人方',
  'Robot Depth': '機器人深度',
  'Strength': '強度',
  'Robot Move': '機器人移動',
  'Analyze Position': '分析局面',
  'Top plays': '最佳著法',
  'Bad plays': '不佳著法',
  'Current group values': '目前棋群價值',
  'Depth 1 - fast': '深度 1 - 快速',
  'Depth 2': '深度 2',
  'Depth 2 - balanced': '深度 2 - 平衡',
  'Depth 3 - stronger': '深度 3 - 較強',
  'Depth 3 - balanced': '深度 3 - 平衡',
  'Depth 4 - Strongest (slow)': '深度 4 - 最強（較慢）',
  'Level 1': '等級 1',
  'Level 2': '等級 2',
  'Level 3': '等級 3',
  'Level 4': '等級 4 - 最強（較慢）',
  'Choose Robot, or click Analyze Position.': '選擇 Robot，或按「分析局面」。',
  'Click Analyze Position to rank legal plays, estimate win rate, and show group values.': '按「分析局面」可排列合法著法、估計勝率並顯示棋群價值。',
  'Click Analyze Position to rank legal moves, estimate win rate, and show Reversi signals.': '按「分析局面」可排列合法著法、估計勝率並顯示 Reversi 指標。',
  'Players': '玩家數',
  '2 players': '2 位玩家',
  '3 players': '3 位玩家',
  'Standard Jump': '標準跳棋',
  'Square Board Jump': '方形棋盤跳棋',
  'Polar Jump': '極座標跳棋',
  'Cylinder Jump': '圓柱跳棋',
  'Torus Jump': '環面跳棋',
  'Mobius Jump': 'Mobius 跳棋',
  'Klein Jump': 'Klein 跳棋',
  'Sphere Jump': '球面跳棋',
  '3D Jump': '3D 跳棋',
  '3D Cylinder Jump': '3D 圓柱跳棋',
  '3D Torus Jump': '3D 環面跳棋',
  '3D Reflective Jump': '3D 反射跳棋',
  '3D Sphere / Shell Jump': '3D 球面／球殼跳棋',
  '4D Jump': '4D 跳棋',
  '4D Cylinder Jump': '4D 圓柱跳棋',
  '4D Torus Jump': '4D 環面跳棋',
  '4D Hypercube Jump': '4D 超立方體跳棋',
  '4D Projection Jump': '4D 投影跳棋',
  'Target axis': '目標軸',
  'Target Mode': '目標模式',
  'Opponent Home Zone': '對手本區',
  'Antipodal Zone': '對蹠區',
  'Same Charge Sector': '同電荷扇區',
  'Fusion Target': '融合目標',
  'Braid Target': '編織目標',
  'Custom Marked Target': '自訂標記目標',
  'Stop Jump Chain': '停止連跳',
  'Zones': '區域',
  'Player A home / B target': '玩家 A 本區／B 目標',
  'Player B home / A target': '玩家 B 本區／A 目標',
  'Legal step': '合法步行',
  'Legal jump': '合法跳躍',
  'Analyze / Suggest': '分析／建議',
  'Ready': '準備',
  'Reversi Space': 'Reversi 空間',
  'Go Space': '圍棋空間',
  'Sphere View': '球面視圖',
  '3D Sphere': '3D 球面',
  '2D Cut-open Fallback': '2D 切開備用視圖',
  'Standard / Simple Cubic': '標準／簡單立方',
  'Standard / Square': '標準／方格',
  'Standard uses ordinary open board edges.': '標準使用普通的開放棋盤邊界。',
  'Square uses the usual four orthogonal graph neighbors.': '方格使用一般的上下左右四個正交圖鄰居。',
  'Square uses the usual eight 2D rays.': '方格使用一般的八個 2D 射線方向。',
  'Honeycomb uses regular hexagonal cells. Stones occupy cell centers and bracket along six axial rays.': '蜂巢格使用正六邊形單元。棋子位於單元中心，並沿六個軸向射線夾擊。',
  'Honeycomb uses three graph neighbors per interior point; groups, liberties, captures, and territory use those links.': '蜂巢格每個內部點有三個圖鄰居；棋群、氣、提子和地盤都使用這些連結。',
  'Triangular uses six graph neighbors per interior point. A group is captured only after every exposed axial and diagonal liberty is enclosed.': '三角格每個內部點有六個圖鄰居；必須封住所有外露的軸向和斜向氣後才會提子。',
  'Cylinder identifies only left-right edges, while top and bottom remain ordinary open Reversi edges.': '圓柱只把左右邊界相接，上下仍是普通的開放 Reversi 邊界。',
  'Cylinder identifies only the left-right edges. Top and bottom stay open, so liberties can vanish at the caps.': '圓柱只把左右邊界相接。上下保持開放，所以棋子在端點可能失去氣。',
  'Cylinder Reversi wraps left-right around the circumference while top and bottom remain open.': '圓柱 Reversi 會把左右方向繞成圓周，上下仍保持開放。',
  'Cylinder Go wraps left-right around the circumference while top and bottom remain open.': '圓柱圍棋會把左右方向繞成圓周，上下仍保持開放。',
  'PBC identifies both left-right and top-bottom edges.': 'PBC 會同時接合左右與上下邊界。',
  'PBC identifies both left-right and top-bottom edges. Every point has periodic neighbors in both board directions.': 'PBC 會同時接合左右與上下邊界。每個點在棋盤兩個方向都有週期鄰居。',
  '2D RBC uses one fixed random map from each boundary exit to another boundary point. The map is stored with the game state.': '2D RBC 會把每個邊界出口固定隨機映射到另一個邊界點，並把映射保存在局面狀態中。',
  '2D RBC uses one fixed random map from each boundary exit to another boundary square. The map stays static for this game.': '2D RBC 會把每個邊界出口固定隨機映射到另一個邊界格，這局遊戲中映射保持不變。',
  'Polar coordinates use one true center node, radial rings, circular angular neighbors, and center-to-first-ring links.': '極座標棋盤使用一個真正中心點、徑向環、圓周角向鄰居，以及中心到第一圈的連線。',
  'Polar coordinates use one true center node, radial rings, circular angular neighbors, and ring/ray bracketing.': '極座標棋盤使用一個真正中心點、徑向環、圓周角向鄰居，並可沿環向與射線方向夾擊。',
  'Polar rays can bracket around rings and radially through the center.': '極座標射線可以沿圓環夾擊，也可以沿徑向穿過中心夾擊。',
  'R3 uses open boundaries in x, y, and z.': 'R3 在 x、y、z 方向使用開放邊界。',
  'T2 wraps both directions on the torus board.': 'T2 環面會在棋盤兩個方向週期包回。',
  'T3 PBC wraps x, y, and z, so every cubic axis is periodic.': 'T3 PBC 會在 x、y、z 三個方向週期包回，因此每個立方軸都是週期的。',
  '3D RBC uses one fixed seeded random map from each cube-boundary exit to another boundary point.': '3D RBC 會用固定種子的隨機映射，把每個立方體邊界出口連到另一個邊界點。',
  'Klein bottle uses normal left-right wrap and flipped top-bottom wrap on the board graph.': 'Klein 瓶在棋盤圖上左右正常包回，上下包回時會翻轉。',
  'Mobius strip uses one twisted horizontal wrap with open vertical edges.': 'Mobius 帶使用單一扭轉的水平方向包回，垂直方向保持開放。',
  'Mobius strip is rendered as a solid twisted band. Horizontal seam crossings flip the transverse coordinate.': 'Mobius 帶會顯示為實心扭轉帶；穿過水平接縫時橫向座標會翻轉。',
  'Area scoring with 7.5 komi. Captures, liberties, superko, and territory use the selected board graph.': '使用 7.5 貼目的面積計分。提子、氣、超劫與地盤都依照所選棋盤圖計算。',
  'R3 Standard uses ordinary open boundaries in x, y, and z.': 'R3 標準在 x、y、z 方向都使用普通開放邊界。',
  'R3 Standard uses ordinary open cubic boundaries. Reversi brackets can run through all 26 graph ray directions.': 'R3 標準使用普通開放立方邊界。Reversi 夾擊可沿 26 個圖射線方向進行。',
  '4D Go': '4D 圍棋',
  '4D Reversi': '4D 黑白棋',
  'Open-boundary and fully periodic Go on 9x9, 13x13, and 19x19 boards.': '在 9x9、13x13、19x19 棋盤上遊玩開放邊界與全週期邊界圍棋。',
  'Standard 4D graph Go on configurable (x,y,z,w) boards. Default size: 5 x 5 x 5 x 5.': '標準 4D 圖圍棋，可設定 (x,y,z,w) 棋盤。預設大小：5 x 5 x 5 x 5。',
  'Standard 4D graph Reversi on empty Jump-style 4D boards, with only the alternating center 2 x 2 x 2 x 2 opening occupied.': '標準 4D 圖黑白棋，使用跳棋式空 4D 棋盤，開局只佔據中心 2 x 2 x 2 x 2 的交錯位置。',
  'Every (x,y,z,w) coordinate is a playable vertex. Liberties are only the eight possible 4D axis-neighbors inside the board; no diagonal liberties. A six-face enclosure in one 3D slice is not a capture if the two w-direction liberties remain open. Captures, suicide, superko, and territory use this full 4D graph.': '每個 (x,y,z,w) 座標都是可下的頂點。氣只來自棋盤內八個可能的 4D 軸向鄰居，沒有斜向氣。若同一個 3D 切片內只被六面包住，但 w 方向兩側仍有氣，就不算被提。提子、自殺、超劫與地盤都依照完整 4D 圖計算。',
  'Every (x,y,z,w) coordinate is a playable Reversi vertex. Legal moves bracket opponent chains along 4D topology-aware rays. There are 80 possible ray directions on an interior 4D point.': '每個 (x,y,z,w) 座標都是可下的黑白棋頂點。合法著法會沿著符合 4D 拓撲的射線夾住對手棋鏈。4D 內部點共有 80 個可能射線方向。',
  'Select a highlighted vertex for Black.': '請為黑方選擇高亮頂點。',
  'Select a highlighted vertex for White.': '請為白方選擇高亮頂點。',
  'Select an empty vertex for Black.': '請為黑方選擇空頂點。',
  'Select an empty vertex for White.': '請為白方選擇空頂點。',
  'Select an empty intersection for Black.': '請為黑方選擇空交點。',
  'Select an empty intersection for White.': '請為白方選擇空交點。',
  'No active selection.': '目前沒有選取。',
  'Board View': '棋盤視角',
  'Time Layer': '時間層',
  '2+1D Time Layer': '2+1D 時間層',
  '3+1D Time Layer': '3+1D 時間層',
  '2+1D TIME LAYER': '2+1D 時間層',
  '3+1D TIME LAYER': '3+1D 時間層',
  'Time mode': '時間模式',
  'Time schedule': '時間排程',
  'Time period (Go +1D only)': '時間週期（僅 Go +1D）',
  'Time lattice dt': '時間格距 dt',
  'Max schedule delay': '最大排程延遲',
  'Action delay': '行動延遲',
  'Appear turns': '出現回合數',
  'Disappear turns': '消失回合數',
  'Age rules': '年齡規則',
  'Age lifetime': '年齡壽命',
  'Lifetime': '壽命',
  'Old age warning': '老化警告',
  'Noise': '噪聲',
  'Aged pieces only': '僅老化棋子',
  'Whole board': '整個棋盤',
  'Noise rate': '噪聲率',
  'Noise period': '噪聲週期',
  'Apply Time Settings': '套用時間設定',
  '2+1D / 3+1D selector': '2+1D / 3+1D 選擇器',
  'Schedule action': '排程行動',
  'Pick schedule time': '選擇排程時間',
  'Instant': '立即',
  'Cancel': '取消',
  'Copied': '已複製',
  'Game started.': '遊戲開始。',
  'Draw': '平手',
  'No active selection.': '目前沒有選取。',
  'No legal move. Pass is likely required.': '沒有合法著法，可能需要停手。',
  'No bad move list.': '沒有不佳著法列表。',
  'No signals.': '沒有局面指標。',
  'Side': '方',
  'Boundary': '邊界',
  'Score': '分數',
  'Win rate': '勝率',
  'Top moves': '最佳著法',
  'Bad moves': '不佳著法',
  'Position signals': '局面指標',
  'Final win-rate flow': '終局勝率曲線',
  'Robot heuristic replay from the move record; it is an evaluation curve, not a solved-game proof.': '機器人依移動紀錄重放啟發式評估；這是評估曲線，不是已解證明。',
  'Algebraic Game Guide': '代數遊戲指南',
  'Introduction': '介紹',
  'Close introduction': '關閉介紹',
  'Clifford Introduction and Observables': 'Clifford 介紹與可觀測量',
  'Spin & Phase Domain Introduction and Observables': '自旋與相位疇介紹與可觀測量',
  'Two-Phase Competition Introduction and Observables': '兩相競爭介紹與可觀測量',
  'Particle Hopping / Reaction Introduction and Observables': '粒子躍遷／反應介紹與可觀測量',
  'Spin Ice Vertex Introduction and Observables': '自旋冰頂點模型介紹與可觀測量',
  'Z2 Gauge Loop Introduction and Observables': 'Z2 規範迴路介紹與可觀測量',
  'Clifford Intro': 'Clifford 簡介',
  'Clifford Introduction': 'Clifford 介紹',
  'Stabilizer Intro': 'Stabilizer 簡介',
  'Stabilizer Introduction': 'Stabilizer 介紹',
  'Spin Domain Intro': '自旋疇簡介',
  'Spin Domain Introduction': '自旋疇介紹',
  'Two-Phase Intro': '兩相簡介',
  'Two-Phase Introduction': '兩相介紹',
  'Spin Ice Intro': '自旋冰簡介',
  'Spin Ice Introduction': '自旋冰介紹',
  'Z2 Gauge Intro': 'Z2 規範簡介',
  'Z2 Gauge Introduction': 'Z2 規範介紹',
  'Particle Hopping Introduction': '粒子躍遷介紹',
  'Cluster Field Introduction': '團簇場介紹',
  'Anyon Intro': '任意子簡介',
  'Anyon Introduction': '任意子介紹',
  'CFT Field Graph Introduction': 'CFT 場圖介紹',
  'CFT Local OPE Introduction': 'CFT 局部 OPE 介紹',
  'Clifford Worldline Introduction': 'Clifford 世界線介紹',
  'Virasoro Worldline Introduction': 'Virasoro 世界線介紹',
  'Worldline mode:': '世界線模式：',
  'Spin seed': '自旋種子',
  'Local update': '局部更新',
  'Domain wall': '疇壁',
  'Phase answer': '相位答案',
  'Nucleate': '成核',
  'Grow domain': '生長疇',
  'Interface cost': '界面代價',
  'Winner answer': '勝方答案',
  'Particle seed': '粒子種子',
  'Hop / scatter': '躍遷／散射',
  'Recombine': '復合',
  'Path answer': '路徑答案',
  'Edge arrows': '邊箭頭',
  'Ice rule': '冰規則',
  'String / loop': '弦／迴路',
  'Monopole answer': '磁單極答案',
  'Edge field': '邊場',
  'Star / flux': '星算符／通量',
  'Loop update': '迴路更新',
  'Logical sector': '邏輯扇區',
  'Clifford Worldline Operators use X, Z, and Y tokens moving on the graph. Their labels propagate through hops and exchanges so you can compare operator transport on the same topology.': 'Clifford 世界線算符使用在圖上移動的 X、Z、Y 粒子。標籤會隨躍遷與交換傳遞，讓你比較同一拓撲上的算符運輸。',
  'black is spin up s=+1 and white is spin down s=-1. Empty vertices are unoccupied or undecided graph sites when the selected initial state leaves gaps.': '黑方是自旋向上 s=+1，白方是自旋向下 s=-1。當所選初始狀態留下空隙時，空頂點代表未佔據或尚未決定的圖位置。',
  'build, move, and stabilize domain walls while checking how topology and lattice geometry change energy, magnetization, and coarsening.': '建立、移動並穩定疇壁，同時檢查拓撲與晶格幾何如何改變能量、磁化與粗化。',
  'place or flip one spin, flip a connected domain, rewrite a line interval, pass, or enable Metropolis acceptance for temperature-driven trials.': '放置或翻轉單一自旋、翻轉連通疇、重寫線區間、停手，或啟用 Metropolis 接受率來做溫度驅動的試驗。',
  'every move records energy, magnetization, domain-wall length, domain-wall density, up/down domain counts, accepted or rejected updates, and the final phase.': '每一步都記錄能量、磁化、疇壁長度、疇壁密度、上下自旋疇數、接受或拒絕的更新，以及最終相位。',
  'neighbors, domains, and walls use the selected graph, so torus, Klein, Mobius, RP2, S2, R3, 4D, square, honeycomb, and triangular boards can produce different wall loops.': '鄰居、疇與疇壁都使用所選圖，因此環面、Klein、Mobius、RP2、S2、R3、4D、方格、蜂巢與三角棋盤會產生不同的疇壁迴路。',
  'export summarizes whether the position ordered, stayed mixed, formed stable walls, or kept topology-winding interfaces.': '匯出會總結局面是否已排序、保持混合、形成穩定疇壁，或保留繞拓撲的界面。',
  'black is phase A, white is phase B, and empty vertices are metastable substrate that can nucleate or be converted.': '黑方是相位 A，白方是相位 B，空頂點是可成核或可轉換的亞穩基底。',
  'compare how two competing phases invade, coarsen, pin interfaces, or wrap through the selected topology.': '比較兩個競爭相如何入侵、粗化、釘住界面，或穿過所選拓撲形成包繞。',
  'nucleate a phase on empty substrate, grow from a neighboring same-phase domain, flip an interface when the energy allows it, pass, or add optional droplet noise.': '在空基底上讓相位成核、從相鄰同相疇生長、在能量允許時翻轉界面、停手，或加入可選液滴噪聲。',
  'every move records energy, interface length, area fractions A and B, domain count, nucleation count, coarsening events, and topology-wrapping interfaces.': '每一步都記錄能量、界面長度、A/B 面積比例、疇數、成核數、粗化事件，以及繞拓撲的界面。',
  'the same phase rule uses graph neighbors, so boundary seams and lattice geometry can change which phase connects or gets trapped.': '同一套相位規則使用圖鄰接，因此邊界接縫與晶格幾何會改變哪個相位連通或被困住。',
  'export reports the winning phase, whether an interface is stable, and whether either phase forms a noncontractible connected region.': '匯出會報告勝出相位、界面是否穩定，以及是否有任一相位形成不可收縮的連通區域。',
  'black and white are two particle species or charge signs. Empty vertices are available sites on the selected graph.': '黑白代表兩種粒子物種或電荷符號。空頂點是所選圖上的可用位置。',
  'study local hopping, exchange scattering, recombination, and path parity on different topologies and lattices.': '研究不同拓撲與晶格上的局部躍遷、交換散射、復合與路徑奇偶。',
  'hop to an adjacent empty vertex, exchange across an occupied interaction particle, follow a multi-step scattering path, recombine adjacent opposite charges, or measure path parity.': '躍遷到相鄰空頂點、跨過已佔據的交互粒子交換、沿多步散射路徑移動、復合相鄰相反電荷，或量測路徑奇偶。',
  'every move records particle count, recombination count, exchange events, braid-like parity, average path length, energy recovered, and the final reaction state.': '每一步都記錄粒子數、復合數、交換事件、類編織奇偶、平均路徑長度、回收能量，以及最終反應狀態。',
  'hop, exchange, and scattering paths use graph adjacency, so twisted seams and higher-dimensional boards change which reactions are locally reachable.': '躍遷、交換與散射路徑使用圖鄰接，因此扭轉接縫與高維棋盤會改變哪些反應在局部可達。',
  'export reports whether charges recombined, remained separated, formed a persistent scattering path, or changed the parity sector.': '匯出會報告電荷是否復合、保持分離、形成持續散射路徑，或改變奇偶扇區。',
  'variables live on graph edges, not vertices. Black arrows follow the chosen edge orientation and white arrows point opposite that orientation.': '變數位於圖的邊上，而不是頂點上。黑色箭頭順著所選邊方向，白色箭頭則反向。',
  'create, move, and annihilate monopole defects while testing how string and loop excitations depend on topology.': '建立、移動並湮滅磁單極缺陷，同時測試弦與迴路激發如何依賴拓撲。',
  'flip one arrow, flip a connected string, flip a closed loop, move a monopole along an edge path, annihilate a monopole pair, or pass.': '翻轉單一箭頭、翻轉連通弦、翻轉閉合迴路、沿邊路徑移動磁單極、湮滅磁單極對，或停手。',
  'every move records energy, ice-rule violations, monopole count, string length, closed-loop count, loop winding, and defect density.': '每一步都記錄能量、冰規則違反、磁單極數、弦長、閉合迴路數、迴路繞行與缺陷密度。',
  'edge paths, closed loops, and winding sectors come from the selected graph, so noncontractible loops can exist on wrapped spaces but not on ordinary open boards.': '邊路徑、閉合迴路與繞行扇區來自所選圖，因此不可收縮迴路可存在於包回空間，但不會出現在普通開放棋盤上。',
  'export reports the monopole sector, string/loop sector, energy trend, and whether the board returned to an ice-rule vacuum.': '匯出會報告磁單極扇區、弦／迴路扇區、能量趨勢，以及棋盤是否回到冰規則真空。',
  'variables live on graph edges with Ue=+1 or Ue=-1. Star checks multiply adjacent edge values, and plaquette checks multiply values around local faces or cycles.': '變數位於圖的邊上，取值為 Ue=+1 或 Ue=-1。星檢查會相乘相鄰邊值，plaquette 檢查會相乘局部面或循環周圍的邊值。',
  'create, measure, repair, and compare Z2 charge, flux, Wilson-loop, and logical-memory sectors on topology-aware graphs.': '在拓撲感知圖上建立、量測、修復並比較 Z2 電荷、通量、Wilson 迴路與邏輯記憶扇區。',
  'flip one edge, flip an open path, flip a closed loop, measure a star check, measure a plaquette check, enable noisy edge flips, or run the simple decoder.': '翻轉一條邊、翻轉開放路徑、翻轉閉合迴路、量測星檢查、量測 plaquette 檢查、啟用邊翻轉噪聲，或執行簡易解碼器。',
  'every move records syndrome weight, star violations, plaquette flux violations, logical sector, Wilson-loop values, decoder actions, and memory status.': '每一步都記錄 syndrome 權重、星違反、plaquette 通量違反、邏輯扇區、Wilson 迴路值、解碼器動作與記憶狀態。',
  'open strings create charge endpoints, closed loops preserve local constraints, and noncontractible loops can change the logical sector when the board supports cycles.': '開放弦會產生電荷端點，閉合迴路保持局部約束；當棋盤支援循環時，不可收縮迴路可以改變邏輯扇區。',
  'export reports whether the gauge state stayed in the vacuum sector, accumulated a logical loop error, or was repaired by decoder/recovery moves.': '匯出會報告規範狀態是否留在真空扇區、累積邏輯迴路錯誤，或被解碼器／修復步驟修好。',
  'Stabilizer Introduction and Observables': 'Stabilizer 介紹與可觀測量',
  'Physical Cluster Field Introduction and Observables': '物理團簇場介紹與可觀測量',
  'CFT Local OPE Operators Introduction and Observables': 'CFT 局部 OPE 算符介紹與可觀測量',
  'Anyon Introduction and Observables': '任意子介紹與可觀測量',
  'CFT Field Insertion Graph Introduction and Observables': 'CFT 場插入圖介紹與可觀測量',
  'CFT Observables': 'CFT 可觀測量',
  'Toric-Code QEC Observables': 'Toric Code 量子糾錯可觀測量',
  'Stabilizer Observables': 'Stabilizer 可觀測量',
  'Time Evolution': '時間演化',
  'Local Rule Preview': '局部規則預覽',
  'Braid Event Log': '編織事件紀錄',
  'Stochastic Event Log': '隨機事件紀錄',
  'Research Export': '研究匯出',
  'Export JSON': '匯出 JSON',
  'Export CSV': '匯出 CSV',
  'Choose a legal move.': '選擇合法著法。',
  'Select an anyon, then hop to a neighbor or exchange around an occupied vertex.': '先選擇一個 anyon（任意子），然後躍遷到相鄰位置，或繞過已佔據的頂點交換。',
  'Select one of your anyons first.': '請先選擇你的一個 anyon（任意子）。',
  'Select one of your anyons to drop.': '請選擇要放下的一個 anyon（任意子）。',
  'Single-click an empty site to move the selected anyon.': '單擊空位置以移動已選的 anyon（任意子）。',
  'Select one of your anyons first, or double-click an owned anyon for options.': '請先選擇你的一個 anyon（任意子），或雙擊己方 anyon 開啟選項。',
  'Click an empty vertex to excite the selected particle type.': '點擊空頂點以激發所選粒子類型。',
  'Choose an available excitation particle for this site.': '請為這個位置選擇可用的激發粒子。',
  'Select one of your own particles first.': '請先選擇你自己的粒子。',
  'Select one of your particles, then choose a hop, jump, chain jump, or recombination target.': '請先選擇你的一個粒子，再選擇 hop、jump、chain jump 或 recombination（復合）目標。',
  'Particle selection cleared.': '粒子選取已清除。',
  'Choose Pauli Error Correction / Recovery with Custom Setup first.': '請先選擇 Pauli Error Correction / Recovery 與 Custom Setup。',
  'Could not start custom recovery.': '無法開始自訂 recovery。',
  'Choose an occupied control site first.': '請先選擇已佔據的 control site（控制位置）。',
  'Entangling selection cleared.': '糾纏選取已清除。',
  'Click an ancilla to discard it.': '點擊 ancilla 以丟棄它。',
  'Choose a physical action.': '請選擇一個物理操作。',
  'Choose Measure in Turn Action, then select the required CFT sites on the board.': '請在 Turn Action 選擇 Measure，然後在棋盤上選取需要的 CFT sites。',
  'Noise is not available for this mode.': '此模式無法使用 noise（噪聲）。',
  'Drop recovery is only available in Jump excitation mode.': 'Drop recovery 只適用於 Jump excitation mode。',
  'Selection cleared.': '選取已清除。',
  'Select a braided anyon first. A green UNBRAID badge will mark the next inverse target.': '請先選擇已 braided 的 anyon（任意子）。綠色 UNBRAID 標記會指出下一個 inverse target（反向目標）。',
  'Time evolution off.': '時間演化關閉。',
  'Discrete CFT estimators appear here.': '離散 CFT 估計量會顯示在這裡。',
  'Discrete graph estimators only; these are not exact continuum CFT conformal blocks.': '這些僅為離散圖估計量，不是精確的連續 CFT 共形塊。',
  'Select the toric-code memory physical problem to begin.': '選擇 Toric Code 記憶物理問題以開始。',
  'Select the Pauli error-correction / recovery physical problem to begin.': '選擇 Pauli 糾錯／恢復物理問題以開始。',
  'Algebraic operator sandboxes - Clifford': '代數算符沙盒 - Clifford',
  'Algebraic operator sandboxes - Anyon': '代數算符沙盒 - Anyon',
  'Algebraic operator sandboxes - Virasoro': '代數算符沙盒 - Virasoro',
  'Strategy & Systems Labs - Spin / Ising systems': '策略與系統實驗室 - 自旋 / Ising 系統',
  'Strategy & Systems Labs - Two-phase competition': '策略與系統實驗室 - 兩相競爭',
  'Strategy & Systems Labs - Chiral systems': '策略與系統實驗室 - 手徵系統',
  'Strategy & Systems Labs - Z2 gauge / toric-code systems': '策略與系統實驗室 - Z2 gauge / toric-code 系統',
  'Strategy & Systems Labs - Spin ice / vertex models': '策略與系統實驗室 - Spin ice / 頂點模型',
  'Strategy & Systems Labs - Stabilizer / Pauli-frame systems': '策略與系統實驗室 - Stabilizer / Pauli-frame 系統',
  'Strategy & Systems Labs - Anyon / excitation systems': '策略與系統實驗室 - Anyon / 激發系統',
  'Strategy & Systems Labs - CFT / Virasoro systems': '策略與系統實驗室 - CFT / Virasoro 系統',
  'Spin / Ising systems': '自旋 / Ising 系統',
  'Z2 gauge / toric-code systems': 'Z2 gauge / toric-code 系統',
  'Spin ice / vertex models': 'Spin ice / 頂點模型',
  'Stabilizer / Pauli-frame systems': 'Stabilizer / Pauli-frame 系統',
  'CFT / Virasoro systems': 'CFT / Virasoro 系統',
  'Two-Phase Competition Game': '兩相競爭遊戲',
  'Spin & Phase Domain Game': '自旋與相位疇遊戲',
  'Z2 Gauge Loop Game': 'Z2 Gauge 迴路遊戲',
  'Spin Ice Vertex Game': 'Spin Ice 頂點遊戲',
  'Physical Clifford Insertion Field': '物理 Clifford 插入場',
  'Physical Clifford Worldline Operators': '物理 Clifford 世界線算符',
  'Physical Anyon Charge Fusion Grid': '物理 Anyon 電荷融合格',
  'Physical Virasoro Worldline Operators': '物理 Virasoro 世界線算符',
  '2D Standard': '2D 標準',
  'R3 Standard': 'R3 標準',
  'T2 Torus': 'T2 Torus',
  'Mobius Strip': 'Mobius Strip',
  'S2 Sphere + NS Poles': 'S2 Sphere + NS Poles',
  '4D Grid': '4D 網格',
  'Ising Domain-Wall Topology': 'Ising 疇壁拓撲',
  'Topological Memory': '拓撲記憶',
  'Spin Ice Vertex Observables - built into Spin Ice Vertex Game': 'Spin Ice 頂點可觀測量 - 已內建於 Spin Ice Vertex Game',
  'Pauli Error Correction / Recovery': 'Pauli 錯誤校正 / Recovery',
  'CFT Conformal Block Observables': 'CFT 共形塊可觀測量',
  'Local e Pairs': '局部 e 對',
  'Local m Pairs': '局部 m 對',
  'Pair Separation': '配對距離',
  'Error Density': '錯誤密度',
  'Topology Checks': '拓撲檢查',
  'Ancilla Actions': 'Ancilla 動作',
  'Non-Clifford Kick': 'Non-Clifford Kick',
  'Maximum Turns': '最大回合數',
  'Ising Initial State': 'Ising 初始狀態',
  'Domain Wall Seed': '疇壁種子',
  'Random Spins': '隨機自旋',
  'Droplet Seed': '液滴種子',
  'Stripe Seed': '條紋種子',
  'Checkerboard': '棋盤格',
  'Thermal Sample': '熱樣本',
  'Ising Action': 'Ising 動作',
  'Place / Flip Spin': '放置 / 翻轉自旋',
  'Flip Connected Domain': '翻轉連通疇',
  'Line-Interval Rewrite (optional)': '線區間重寫（可選）',
  'Coupling J': '耦合 J',
  'Field h': '場 h',
  'Temperature T': '溫度 T',
  'Wall Thickness': '壁厚',
  'Metropolis': 'Metropolis',
  'Domain Flip': '疇翻轉',
  'Line-Interval Rewrite': '線區間重寫',
  'Two-Phase Initial State': '兩相初始狀態',
  'Phase Separated': '相分離',
  'Random Droplets': '隨機液滴',
  'Single Nucleus': '單一核',
  'Two Nuclei': '兩個核',
  'Stripe Domains': '條紋疇',
  'Metastable Empty': '亞穩空基底',
  'Two-Phase Action': '兩相動作',
  'Auto Nucleate / Grow / Flip': '自動成核 / 生長 / 翻轉',
  'Nucleate Phase': '相成核',
  'Grow Domain': '生長疇',
  'Flip Interface': '翻轉界面',
  'Interface Cost': '界面代價',
  'Bias A': '偏置 A',
  'Bias B': '偏置 B',
  'Curvature Penalty': '曲率懲罰',
  'Curvature Strength': '曲率強度',
  'Droplet Noise': '液滴噪聲',
  'Noise Rate': '噪聲率',
  'Cluster Initial State': '團簇初始狀態',
  'Sparse Seeds': '稀疏種子',
  'Random Density': '隨機密度',
  'Two-Cluster Competition': '雙團簇競爭',
  'Interface Seed': '界面種子',
  'Thermal Cluster Sample': '熱團簇樣本',
  'Cluster Action': '團簇動作',
  'Auto Place / Grow': '自動放置 / 生長',
  'Place Species': '放置物種',
  'Grow Connected Cluster': '生長連通團簇',
  'Diffusion / Noise Step': '擴散 / 噪聲步',
  'Cluster Model': '團簇模型',
  'Two-Species Competition': '雙物種競爭',
  'Percolation Clusters': '滲流團簇',
  'Reaction-Diffusion Domains': '反應-擴散疇',
  'Exciton / Hole Recombination': 'Exciton / Hole 復合',
  'Spin-Domain Growth': '自旋疇生長',
  'Diffusion / Noise': '擴散 / 噪聲',
  'Cluster Noise Rate': '團簇噪聲率',
  'Spin Ice Initial State': 'Spin Ice 初始狀態',
  'Ice-Rule Vacuum': 'Ice-Rule 真空',
  'Random Arrows': '隨機箭頭',
  'Monopole Pair': 'Monopole 對',
  'Loop Excitation': '迴路激發',
  'Thermal Ice Sample': '熱 Ice 樣本',
  'Spin Ice Action': 'Spin Ice 動作',
  'Flip One Arrow': '翻轉一支箭頭',
  'Flip Connected String': '翻轉連通弦',
  'Flip Closed Loop': '翻轉閉合迴路',
  'Move Monopole': '移動 Monopole',
  'Annihilate Pair': '湮滅配對',
  'Violation Energy': '違反能量',
  'String Length': '弦長',
  'Z2 Gauge Initial State': 'Z2 Gauge 初始狀態',
  'Gauge Vacuum': 'Gauge 真空',
  'Random Edge Errors': '隨機邊錯誤',
  'Paired Charge Defects': '成對電荷缺陷',
  'Paired Flux Defects': '成對通量缺陷',
  'Logical Loop Error': '邏輯迴路錯誤',
  'Z2 Gauge Action': 'Z2 Gauge 動作',
  'Flip One Edge': '翻轉一條邊',
  'Flip Connected Path': '翻轉連通路徑',
  'Measure Star Check': '測量 Star 檢查',
  'Measure Plaquette Check': '測量 Plaquette 檢查',
  'Noisy Edge Flip': '噪聲邊翻轉',
  'Path Length': '路徑長度',
  'Edge Noise': '邊噪聲',
  'Decoder Estimate': 'Decoder 估計',
  'Particle Model': '粒子模型',
  'Charge Recombination': '電荷復合',
  'Spin Exchange': '自旋交換',
  'Anyon Worldline': 'Anyon 世界線',
  'Particle Action': '粒子動作',
  'Auto Hop / Exchange / Recombine': '自動躍遷 / 交換 / 復合',
  'Hop Adjacent': '躍遷到相鄰點',
  'Recombine Opposite': '復合相反電荷',
  'Measure Path Parity': '測量路徑奇偶',
  'Higher-dimensional size': '高維大小',
  'Width / Nx': '寬度 / Nx',
  'Height / Ny': '高度 / Ny',
  'Algebra Set': '代數集合',
  'Standard Pauli Operator Grid': '標準 Pauli 算符格',
  'Stabilizer Algebra': 'Stabilizer 代數',
  'Frame Transform': 'Frame 變換',
  'Phase / Sign Display': '相位 / 符號顯示',
  'Initial Rule': '初始規則',
  'Paired Defects': '成對缺陷',
  'Stabilizer Vacuum': 'Stabilizer 真空',
  'Prepared Clifford Circuit': '已準備 Clifford 電路',
  'Custom Setup': '自訂設定',
  'Initial Sign': '初始符號',
  'Positive': '正',
  'Negative': '負',
  'View': '視圖',
  'Physics View': '物理視圖',
  'Game View': '遊戲視圖',
  'Physical Action': '物理動作',
  'Prepare Ancilla': '準備 Ancilla',
  'Entangle Ancilla': '糾纏 Ancilla',
  'Measure': '測量',
  'Discard Ancilla': '丟棄 Ancilla',
  'Phase Action': '相位動作',
  'Operator Pauli': '算符 Pauli',
  'Operator Phase': '算符相位',
  'Ancilla Basis': 'Ancilla 基底',
  'Entangling Gate': '糾纏閘',
  'Measurement': '測量',
  'Local Pauli': '局部 Pauli',
  'Domain Parity': '疇奇偶',
  'Line Interval': '線區間',
  'Neighborhood Stabilizer': '鄰域 Stabilizer',
  'Logical Cycle': '邏輯循環',
  'Measure Basis': '測量基底',
  'Phase Gate': '相位閘',
  'S dagger': 'S dagger',
  'Phase Kick': 'Phase Kick',
  'Theta': 'Theta',
  'Excitation': '激發',
  'Excitation Energy': '激發能量',
  'Turn Action': '回合動作',
  'Move / Braid': '移動 / 編織',
  'Excite Anyon': '激發 Anyon',
  'Recombine / Recover': '復合 / Recovery',
  'Excite Type': '激發類型',
  'Recombination Loss': '復合損失',
  'Braid Memory': '編織記憶',
  'Abelian Parity': 'Abelian 奇偶',
  'Word Exact': 'Word Exact',
  'Non-Abelian Channel': 'Non-Abelian 通道',
  'Anyon Model': 'Anyon 模型',
  'Toric Code': 'Toric Code',
  'Fibonacci': 'Fibonacci',
  'General Z_n Phase': 'General Z_n Phase',
  'Grade n': 'Grade n',
  'Entanglement': '糾纏',
  'Infinite': '無限',
  'Finite Distance': '有限距離',
  'Cancellation': '抵消',
  'Adjacent Inverse': '相鄰逆元',
  'Braid Relations': '編織關係',
  'Braided capture': '編織捕獲',
  'Shield': '護盾',
  'Need Unbraid': '需要解編織',
  'Penalty': '懲罰',
  'Virasoro Layer': 'Virasoro 層',
  'Field Turn': '場回合',
  'Insert Field': '插入場',
  'Direction': '方向',
  'Max Mode N': '最大模式 N',
  'Central Charge c': '中心荷 c',
  'Unstable Rule': '不穩定規則',
  'Warning Only': '僅警告',
  'Remove Group': '移除群組',
  'CFT Model': 'CFT 模型',
  'Initial State': '初始狀態',
  'Four Sigma Block': '四 Sigma 塊',
  'Boundary Condition Change': '邊界條件改變',
  'Thermal CFT Sample': '熱 CFT 樣本',
  'Two-Phase Interval Seed': '兩相區間種子',
  'Primary Field': 'Primary Field',
  'Place Primary': '放置 Primary',
  'Two-Point Correlator': '二點關聯器',
  'Line Parity': '線奇偶',
  'OPE Channel': 'OPE 通道',
  'Four-Point Block': '四點塊',
  'Region Entropy': '區域熵',
  'Stress': 'Stress',
  'Hidden OPE Channels': '隱藏 OPE 通道',
  'Virasoro Truncation': 'Virasoro 截斷',
  'Global CFT N=1': 'Global CFT N=1',
  'Virasoro Toy': 'Virasoro Toy',
  'Thermal Weight': '熱權重',
  'Dynamics': '動力學',
  'Anyon Pair': 'Anyon 配對',
  'Measurement Error': '測量錯誤',
  'Field Noise': '場噪聲',
  'Noise settings': '噪聲設定',
  'Pauli Noise': 'Pauli 噪聲',
  'Depolarizing': '去極化',
  'Bit Flip': 'Bit Flip',
  'Phase Flip': 'Phase Flip',
  'Erasure': '擦除',
  'Apply Noise': '套用噪聲',
  'After Move': '移動後',
  'After Round': '一輪後',
  'Manual Noise Tick': '手動噪聲 Tick',
  'Noise p': '噪聲 p',
  'Measure q': '測量 q',
  'RNG Seed': 'RNG Seed',
  'e/m Flip': 'e/m 翻轉',
  'Time settings': '時間設定',
  'Clock Period M': '時鐘週期 M',
  'Hamiltonian': 'Hamiltonian',
  'Field H': '場 H',
  'Coupled H': '耦合 H',
  'H Strength': 'H 強度',
  'Initial Momentum': '初始動量',
  'Initial Spin Bias': '初始自旋偏置',
  'Actions': '動作',
  'Count': '計數',
  'Unbraid Hint': '解編織提示',
  'Noise Tick': '噪聲 Tick',
  'Time Step': '時間步',
  'Room Code': '房間代碼',
  'Reconnect': '重新連線',
  'Leave': '離開',
  'z layer': 'z 層',
  'w layer': 'w 層',
  'Algebraic game board': '代數遊戲棋盤',
  'Interactive algebraic board in 3D space': '3D 空間互動代數棋盤',
  'Clifford lab flow': 'Clifford 實驗流程',
  'Pauli placement': 'Pauli 放置',
  'Topology ray': '拓撲射線',
  'Clifford flip': 'Clifford 翻轉',
  'Observable export': '可觀測量匯出',
  'Algebra': '代數',
  'Board': '棋盤',
  'Connection': '連線',
  'Start': '開始',
  'Distance': '距離',
  'Nw': 'Nw',
  'Nz': 'Nz',
  'Game controls': '遊戲控制',
  'Lab move history and logs': '實驗移動歷史與紀錄',
  'Clifford Reversi': 'Clifford Reversi',
  'Stabilizer Operator Grid': 'Stabilizer 算符格',
  'Pauli-Frame Recovery Operators': 'Pauli-frame Recovery 算符',
  'Clifford Insertion Field': 'Clifford 插入場',
  'Anyon Charge Fusion Grid': 'Anyon 電荷融合格',
  'Anyon Fusion & Braiding Worldlines': 'Anyon 融合與編織世界線',
  'CFT Field Insertion Graph': 'CFT 場插入圖',
  'CFT Local OPE Operators': 'CFT 局部 OPE 算符',
  'Virasoro Worldline Operators': 'Virasoro 世界線算符',
  'Topological Memory Worldlines': '拓撲記憶世界線',
  'Particle Hopping / Reaction System': '粒子躍遷 / 反應系統',
  'Physical Cluster Field': '物理團簇場',
  'Cylinder': 'Cylinder',
  'RP2': 'RP2',
  'Torus: x and y wrap periodically.': 'Torus: x 與 y 週期包回。',
  'Room code or shared link': '房間代碼或分享連結',
  'CNOT': 'CNOT',
  'CZ': 'CZ',
  'Magic': 'Magic',
  'X+': 'X+',
  'X-': 'X-',
  'Z0': 'Z0',
  'Z1': 'Z1',
  'Identity': 'Identity',
  'identity': 'identity',
  'identity 0': 'identity 0',
  'Sigma': 'Sigma',
  'Epsilon': 'Epsilon',
  'Ising': 'Ising',
  'Ising CFT': 'Ising CFT',
  'Free Boson CFT': 'Free Boson CFT',
  'L_-1 Shift': 'L_-1 Shift',
  'L_0 Add': 'L_0 Add',
  'L_0 Rescale': 'L_0 Rescale',
  'L_1 Focus': 'L_1 Focus',
  'L_-2 Shift': 'L_-2 Shift',
  'L_-2 Split': 'L_-2 Split',
  'L_2 Focus': 'L_2 Focus',
  'L_2 Concentrate': 'L_2 Concentrate',
  '2D RBC': '2D RBC',
  '2D RBC:': '2D RBC:',
  '3D boards:': '3D 棋盤：',
  'Actions:': '動作：',
  'Algebra set:': '代數設定：',
  'Ancillas:': 'Ancilla：',
  'Answer:': '答案：',
  'Braiding:': '編織：',
  'Default CFT:': '預設 CFT：',
  'Dynamics choices:': '動力學選項：',
  'Entanglement distance:': '糾纏距離：',
  'Estimator note:': '估計器說明：',
  'Excitation Energy:': '激發能量：',
  'Flip rule:': '翻轉規則：',
  'General Z_n phase:': 'General Z_n phase：',
  'Graph contact rule:': '圖接觸規則：',
  'H and S:': 'H 與 S：',
  'Initial states:': '初始狀態：',
  'Lab goal:': '實驗目標：',
  'Local excitation choice:': '局部激發選擇：',
  'Local operator choice:': '局部算符選擇：',
  'Measurements:': '測量：',
  'Move rule:': '移動規則：',
  'Non-Abelian fusion:': 'Non-Abelian fusion：',
  'Observables and results:': '可觀測量與結果：',
  'Observables:': '可觀測量：',
  'Pauli error-correction goal:': 'Pauli 錯誤校正目標：',
  'Pauli math:': 'Pauli 數學：',
  'Phase actions:': '相位動作：',
  'Physical meaning:': '物理意義：',
  'Physical problem / goal:': '物理問題 / 目標：',
  'Physical system:': '物理系統：',
  'Possible models:': '可能模型：',
  'QEC export:': 'QEC 匯出：',
  'Qubit sites:': 'Qubit 位置：',
  'Resource contacts:': '資源接觸：',
  'Results:': '結果：',
  'Reversi action:': 'Reversi 動作：',
  'Symbols:': '符號：',
  'Topology:': '拓撲：',
  'Toric code fusion:': 'Toric code fusion：',
  'Toric Memory Unbraid:': 'Toric Memory 解編織：',
  'Unbraiding:': '解編織：',
  'Vacuum 1:': 'Vacuum 1：',
  'Virasoro actions:': 'Virasoro 動作：',
  'Anyon memory flow': 'Anyon 記憶流程',
  'Braid / unbraid': '編織 / 解編織',
  'Braid Black': '編織黑方',
  'Braid White': '編織白方',
  'Block / entropy answer': '共形塊 / 熵答案',
  'CFT field-insertion flow': 'CFT 場插入流程',
  'CFT Reversi flow': 'CFT Reversi 流程',
  'CFT sector answer': 'CFT 扇區答案',
  'Create anyons': '建立 anyons',
  'Error X/Z': '錯誤 X/Z',
  'Exchange Across Particle': '跨粒子交換',
  'Fuse / recombine': '融合 / 復合',
  'Grow / capture': '生長 / 捕獲',
  'Local OPE graph': '局部 OPE 圖',
  'Local OPE interval': '局部 OPE 區間',
  'Memory answer': '記憶答案',
  'Multi-step Scattering': '多步散射',
  'OPE update': 'OPE 更新',
  'Pauli error correction flow': 'Pauli 錯誤校正流程',
  'Percolation answer': '滲流答案',
  'Physical cluster flow': '物理團簇流程',
  'Primary / domain': 'Primary / 疇',
  'Primary insertion': 'Primary 插入',
  'Recovery actions': 'Recovery 動作',
  'Seed species': '播種物種',
  'Spin domain flow': '自旋疇流程',
  'Spin ice vertex flow': 'Spin ice 頂點流程',
  'Syndrome checks': 'Syndrome 檢查',
  'Two-phase competition flow': '兩相競爭流程',
  'Vacuum / logical sector': 'Vacuum / 邏輯扇區',
  'Virasoro action': 'Virasoro 動作',
  'Wrap topology': '包回拓撲',
  'Z2 gauge loop flow': 'Z2 gauge 迴路流程',
  'Particle hopping flow': '粒子躍遷流程',
}));

const textOriginals = new WeakMap();
let language = detectLanguage();
let observer = null;
const GLOBE_ICON = '<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18"></path><path d="M12 3a14 14 0 0 1 0 18"></path><path d="M12 3a14 14 0 0 0 0 18"></path></svg>';

export function installGameUILocalizer() {
  document.documentElement.lang = language === 'zh' ? 'zh-Hant' : 'en';
  installStyles();
  installLanguageControl();
  translateTree(document.body);
  if (!observer) {
    observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'characterData') translateText(record.target);
        if (record.type === 'attributes') translateAttributes(record.target);
        for (const node of record.addedNodes) translateTree(node);
      }
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label', 'label']
    });
  }
  window.addEventListener('languagechange', (event) => setGameLanguage(event.detail?.language || detectLanguage()));
}

export function setGameLanguage(value) {
  language = normalizeLanguage(value);
  document.documentElement.lang = language === 'zh' ? 'zh-Hant' : 'en';
  for (const key of [
    'topological-boardgame:language',
    'topoboardgame-language',
    'topoboardgame.lang',
    '2dchess:language',
    '3dchess:language',
    '3dgo:language'
  ]) {
    localStorage.setItem(key, language);
  }
  const url = new URL(location.href);
  url.searchParams.set('lang', language);
  history.replaceState(history.state, '', url);
  translateTree(document.body, true);
  syncLanguageControl();
}

function translateTree(root, force = false) {
  if (!root) return;
  if (root.nodeType === Node.TEXT_NODE) return translateText(root, force);
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) translateText(walker.currentNode, force);
  if (root.nodeType === Node.ELEMENT_NODE) translateAttributes(root, force);
  root.querySelectorAll?.('[placeholder], [title], [aria-label], [label]').forEach((element) => translateAttributes(element, force));
}

function translateText(node, force = false) {
  if (!node?.parentElement || ['SCRIPT', 'STYLE'].includes(node.parentElement.tagName)) return;
  if (node.parentElement.closest('[data-no-localize]')) return;
  let state = textOriginals.get(node);
  if (!state) {
    state = { original: node.nodeValue, rendered: '' };
    textOriginals.set(node, state);
  } else if (!force && node.nodeValue !== state.original && node.nodeValue !== state.rendered) {
    state.original = node.nodeValue;
  }
  const original = state.original;
  const trimmed = original.trim();
  if (!trimmed) return;
  const translated = language === 'zh' ? translateValue(trimmed) : trimmed;
  const leading = original.match(/^\s*/)?.[0] || '';
  const trailing = original.match(/\s*$/)?.[0] || '';
  const next = `${leading}${translated}${trailing}`;
  state.rendered = next;
  if (node.nodeValue !== next) node.nodeValue = next;
}

function dataKeyForAttribute(prefix, attr) {
  return `topoboardgame${prefix}${attr.replace(/-([a-z])/g, (_, c) => c.toUpperCase()).replace(/^./, (c) => c.toUpperCase())}`;
}

function translateAttributes(element, force = false) {
  if (element.closest?.('[data-no-localize]')) return;
  for (const attr of ['placeholder', 'title', 'aria-label', 'label']) {
    if (!element.hasAttribute?.(attr)) continue;
    const originalKey = dataKeyForAttribute('Original', attr);
    const renderedKey = dataKeyForAttribute('Rendered', attr);
    const current = element.getAttribute(attr);
    const original = element.dataset[originalKey] || '';
    const rendered = element.dataset[renderedKey] || '';
    if (!original || (!force && current !== original && current !== rendered)) element.dataset[originalKey] = current;
    const source = element.dataset[originalKey] || '';
    const next = language === 'zh' ? translateValue(source) : source;
    element.dataset[renderedKey] = next;
    if (current !== next) element.setAttribute(attr, next);
  }
}

function translateValue(text) {
  if (ZH.has(text)) return ZH.get(text);
  return text
    .replace(/Select an anyon, then hop to a neighbor or exchange around an occupied vertex\./g, '先選擇一個 anyon（任意子），然後躍遷到相鄰位置，或繞過已佔據的頂點交換。')
    .replace(/Selected ([^:]+):/g, '已選擇 $1：')
    .replace(/Click an empty site to prepare ([^.]+)\./g, '點擊空位置以準備 $1。')
    .replace(/Click an occupied control, then target, for ([^.]+)\./g, '先點擊已佔據的 control（控制點），再點擊 target（目標），以執行 $1。')
    .replace(/Click a site for ([^ ]+) in the ([^ ]+) basis\./g, '點擊位置，以 $2 basis 執行 $1。')
    .replace(/Click an occupied site to apply ([^.]+)\./g, '點擊已佔據的位置以套用 $1。')
    .replace(/Violations (\d+); walls (\d+); ancillas (\d+)\./g, '違反數 $1；walls $2；ancillas $3。')
    .replace(/(\d+) local propagation\/exchange options?/g, '$1 個 local propagation / exchange 選項')
    .replace(/parity ([^,]+), word ([^,]+)/g, 'parity $1，word $2')
    .replace(/Click a braid target to try the inverse loop\./g, '點擊 braid target（編織目標）以嘗試 inverse loop（反向迴路）。')
    .replace(/Next cancel: ([^.]+)\./g, '下一個抵消目標：$1。')
    .replace(/Warning: attempting this unbraid appends (.+?) instead of cancelling\./g, '警告：這次 unbraid 會追加 $1，而不是抵消。')
    .replace(/Choose Recombine \/ Recover to reclaim its energy\./g, '選擇 Recombine / Recover 以回收其能量。')
    .replace(/(.+) energy ([\d.]+)\. Excite (.+) on an empty vertex\./g, '$1 能量 $2。於空頂點激發 $3。')
    .replace(/(.+) energy ([\d.]+)\. Click an owned anyon to recombine and recover energy\./g, '$1 能量 $2。點擊己方 anyon（任意子）以 recombine（復合）並回收能量。')
    .replace(/(.+) energy ([\d.]+)\. Select an owned anyon to move\/braid, or choose Excite Anyon\./g, '$1 能量 $2。選擇己方 anyon（任意子）以移動 / braid，或選擇 Excite Anyon。')
    .replace(/Recombine \/ Recover: click (.+?) or another owned anyon to recover energy\./g, 'Recombine / Recover：點擊 $1 或另一個己方 anyon（任意子）以回收能量。')
    .replace(/Excite (.+?): click an empty vertex\. Choose Move \/ Braid to move (.+?)\./g, 'Excite $1：點擊空頂點。選擇 Move / Braid 以移動 $2。')
    .replace(/Select four sigma insertions \((\d+)\/4\)\./g, '選擇四個 sigma insertions（$1/4）。')
    .replace(/Click a site to measure (.+?); line and entropy measurements use the latest interval when available\./g, '點擊位置以測量 $1；line 與 entropy measurement 會在可用時使用最新區間。')
    .replace(/(.+) will insert (.+?) and update (\d+) nearby OPE sites?\./g, '$1 將插入 $2，並更新附近 $3 個 OPE 位置。')
    .replace(/(.+) has (\d+) empty (.+?) insertion sites?\./g, '$1 有 $2 個空的 $3 插入位置。')
    .replace(/(.+) may apply (.+?)\. Current block: (.+?); entropy estimate ([^.]+)\./g, '$1 可套用 $2。目前 block：$3；熵估計 $4。')
    .replace(/(.+) affects (\d+) stress sites?\./g, '$1 會影響 $2 個 stress 位置。')
    .replace(/Choose a valid (.+?) target\./g, '請選擇有效的 $1 目標。')
    .replace(/Standard boundary: rays stop at the edge\./g, '標準邊界：rays（射線）在邊界停止。')
    .replace(/2D RBC: each boundary exit maps to one fixed random boundary square for this game\./g, '2D RBC：每個邊界離開點都會映射到本局固定的一個 random boundary square（隨機邊界格）。')
    .replace(/Cylinder: x wraps periodically while y remains open\./g, '圓柱：x 方向週期包回，y 方向保持開放。')
    .replace(/S2 latitude-ring graph: longitude wraps and the first\/last latitude rings connect to playable north\/south pole nodes\./g, 'S2 緯度環圖：longitude 方向包回，第一圈與最後一圈 latitude rings 連到可操作的 north / south pole nodes。')
    .replace(/Torus: x and y wrap periodically\./g, '環面：x 與 y 方向週期包回。')
    .replace(/Klein bottle: x wraps normally, y wraps with x flip and H\/twist seam transport\./g, 'Klein bottle：x 正常包回，y 包回時帶 x flip 與 H / twist seam transport。')
    .replace(/Mobius strip: x wraps with y flip and H\/twist seam transport; y is an open boundary\./g, 'Mobius strip：x 包回時帶 y flip 與 H / twist seam transport；y 是開放邊界。')
    .replace(/RP2: every boundary crossing uses antipodal identification with H\/twist seam transport\./g, 'RP2：每次 boundary crossing 都使用 antipodal identification，並帶 H / twist seam transport。')
    .replace(/ Honeycomb lattice: each interior vertex has three graph neighbors\./g, ' Honeycomb lattice：每個 interior vertex 有三個 graph neighbors。')
    .replace(/ Hex-cell lattice: pieces occupy hexagon centers and use six axial graph rays\./g, ' Hex-cell lattice：pieces 位於 hexagon centers，並使用六個 axial graph rays。')
    .replace(/ Triangular lattice: each interior vertex has six graph neighbors; capture requires enclosing every exposed graph liberty\./g, ' Triangular lattice：每個 interior vertex 有六個 graph neighbors；capture 需要包圍每個 exposed graph liberty。')
    .replace(/(\d+) observables/g, '$1 個可觀測量')
    .replace(/Counting pending: provisional draw/g, '等待計分：暫時和棋')
    .replace(/Counting pending: Black leads by ([\d.]+)/g, '等待計分：黑方暫時領先 $1')
    .replace(/Counting pending: White leads by ([\d.]+)/g, '等待計分：白方暫時領先 $1')
    .replace(/Standard uses ordinary open board edges\./g, '標準使用普通的開放棋盤邊界。')
    .replace(/Standard uses ordinary board edges\./g, '標準使用普通的棋盤邊界。')
    .replace(/Klein bottle identifies left-right normally and top-bottom with x flipped: leaving at x enters at size - 1 - x\./g, 'Klein 瓶左右正常相接，上下相接時 x 會翻轉：從 x 離開會進入 size - 1 - x。')
    .replace(/Klein bottle identifies left-right normally and top-bottom with x flipped\./g, 'Klein 瓶左右正常相接，上下相接時 x 會翻轉。')
    .replace(/The Klein bottle has normal left-right wrap and flipped top-bottom wrap: leaving at x enters at width - 1 - x\./g, 'Klein 瓶左右正常包回，上下包回時會翻轉：從 x 離開會進入 width - 1 - x。')
    .replace(/Klein connects left-right normally and top-bottom with an x-flip\./g, 'Klein 瓶會左右正常相接，上下相接時 x 會翻轉。')
    .replace(/Cylinder identifies only the left-right edges\. Top and bottom stay open, so liberties can vanish at the caps\./g, '圓柱只把左右邊界相接。上下保持開放，所以棋子在端點可能失去氣。')
    .replace(/Cylinder identifies only left-right edges, while top and bottom remain ordinary open Reversi edges\./g, '圓柱只把左右邊界相接，上下仍是普通的開放 Reversi 邊界。')
    .replace(/Cylinder wraps left-right only\./g, '圓柱只在左右方向週期包回。')
    .replace(/PBC identifies both left-right and top-bottom edges\. Every point has periodic neighbors in both board directions\./g, 'PBC 會同時接合左右與上下邊界。每個點在棋盤兩個方向都有週期鄰居。')
    .replace(/PBC identifies both left-right and top-bottom edges\./g, 'PBC 會同時接合左右與上下邊界。')
    .replace(/PBC connects both left-right and top-bottom sides\./g, 'PBC 會同時接合左右與上下兩側。')
    .replace(/2D RBC uses one fixed random map from each boundary exit to another boundary point\. The map is stored with the game state\./g, '2D RBC 會把每個邊界出口固定隨機映射到另一個邊界點，並把映射保存在局面狀態中。')
    .replace(/2D RBC uses one fixed random map from each boundary exit to another boundary square\. The map stays static for this game\./g, '2D RBC 會把每個邊界出口固定隨機映射到另一個邊界格，這局遊戲中映射保持不變。')
    .replace(/2D RBC creates one fixed random boundary map for this game\./g, '2D RBC 會為這局遊戲建立一份固定的隨機邊界映射。')
    .replace(/Polar coordinates use one true center node, radial rings, circular angular neighbors, and center-to-first-ring links\./g, '極座標棋盤使用一個真正中心點、徑向環、圓周角向鄰居，以及中心到第一圈的連線。')
    .replace(/Polar coordinates use one true center node, radial rings, circular angular neighbors, and ring\/ray bracketing\./g, '極座標棋盤使用一個真正中心點、徑向環、圓周角向鄰居，並可沿環向與射線方向夾擊。')
    .replace(/Polar adds one center node with radial rings\./g, '極座標會加入一個中心點與徑向環。')
    .replace(/Polar rays can bracket around rings and radially through the center\./g, '極座標射線可以沿圓環夾擊，也可以沿徑向穿過中心夾擊。')
    .replace(/Square uses the usual four orthogonal graph neighbors\./g, '方格使用一般的上下左右四個正交圖鄰居。')
    .replace(/Square uses the usual eight 2D rays\./g, '方格使用一般的八個 2D 射線方向。')
    .replace(/Honeycomb uses regular hexagonal cells\. Stones occupy cell centers and bracket along six axial rays\./g, '蜂巢格使用正六邊形單元。棋子位於單元中心，並沿六個軸向射線夾擊。')
    .replace(/Honeycomb uses three graph neighbors per interior point; groups, liberties, captures, and territory use those links\./g, '蜂巢格每個內部點有三個圖鄰居；棋群、氣、提子和地盤都使用這些連結。')
    .replace(/Triangular uses six graph neighbors per interior point\. A group is captured only after every exposed axial and diagonal liberty is enclosed\./g, '三角格每個內部點有六個圖鄰居；必須封住所有外露的軸向和斜向氣後才會提子。')
    .replace(/Square, honeycomb, and triangular boards use four, three, and six graph neighbors respectively\./g, '方格、蜂巢格、三角格棋盤分別使用四個、三個、六個圖鄰居。')
    .replace(/Area scoring with 7\.5 komi, capture by removing groups with no liberties, suicide forbidden, positional superko, and final scoring after two passes plus both players agreeing to count\./g, '使用 7.5 貼目的面積計分；無氣棋群會被提走；禁止自殺；採位置超劫；雙方連續停手並同意數目後進行終局計分。')
    .replace(/Endgame starts when both players pass or neither side can play\./g, '當雙方都停手，或雙方都沒有可下位置時進入終局。')
    .replace(/On Polar boards, the true center is useful for connection but the center alone does not claim a whole empty region\./g, '在極座標棋盤上，真正中心點有助於連接，但單靠中心點不會直接佔領整片空區。')
    .replace(/R3 Standard uses ordinary open cubic boundaries\. Reversi brackets can run through all 26 graph ray directions\./g, 'R3 標準使用普通開放立方邊界。Reversi 夾擊可沿 26 個圖射線方向進行。')
    .replace(/R3 Standard uses ordinary open boundaries in x, y, and z\./g, 'R3 標準在 x、y、z 方向都使用普通開放邊界。')
    .replace(/R3 uses open boundaries in x, y, and z\./g, 'R3 在 x、y、z 方向使用開放邊界。')
    .replace(/T2 wraps both directions on the torus board\./g, 'T2 環面會在棋盤兩個方向週期包回。')
    .replace(/T3 PBC wraps x, y, and z, so every cubic axis is periodic\./g, 'T3 PBC 會在 x、y、z 三個方向週期包回，因此每個立方軸都是週期的。')
    .replace(/3D RBC uses one fixed seeded random map from each cube-boundary exit to another boundary point\./g, '3D RBC 會用固定種子的隨機映射，把每個立方體邊界出口連到另一個邊界點。')
    .replace(/Cylinder Reversi wraps left-right around the circumference while top and bottom remain open\./g, '圓柱 Reversi 會把左右方向繞成圓周，上下仍保持開放。')
    .replace(/Cylinder Go wraps left-right around the circumference while top and bottom remain open\./g, '圓柱圍棋會把左右方向繞成圓周，上下仍保持開放。')
    .replace(/Klein bottle uses normal left-right wrap and flipped top-bottom wrap on the board graph\./g, 'Klein 瓶在棋盤圖上左右正常包回，上下包回時會翻轉。')
    .replace(/Mobius strip uses one twisted horizontal wrap with open vertical edges\./g, 'Mobius 帶使用單一扭轉的水平方向包回，垂直方向保持開放。')
    .replace(/Mobius strip is rendered as a solid twisted band\. Horizontal seam crossings flip the transverse coordinate\./g, 'Mobius 帶會顯示為實心扭轉帶；穿過水平接縫時橫向座標會翻轉。')
    .replace(/Area scoring with 7\.5 komi\. Captures, liberties, superko, and territory use the selected board graph\./g, '使用 7.5 貼目的面積計分。提子、氣、超劫與地盤都依照所選棋盤圖計算。')
    .replace(/^([23]\+1D) TIME LAYER$/g, '$1 時間層')
    .replace(/^([23]\+1D) Time Layer$/g, '$1 時間層')
    .replace(/^Time schedule: Instant\.\.\+(\d+), selected Instant$/g, '時間排程：立即到 +$1，已選立即')
    .replace(/^Time schedule: Instant\.\.\+(\d+), selected \+(\d+)$/g, '時間排程：立即到 +$1，已選 +$2')
    .replace(/^Time period scheduling, \+(\d+) action delay$/g, '時間週期排程，行動延遲 +$1')
    .replace(/^Time schedule scheduling, \+(\d+) action delay$/g, '時間排程，行動延遲 +$1')
    .replace(/^Time period: appear (\d+), disappear (\d+)$/g, '時間週期：出現 $1，消失 $2')
    .replace(/^Choose when this designed action should act\.$/g, '選擇這個設計好的行動要在何時作用。')
    .replace(/^([23]\+1D) (Chess|Go|Reversi|Jump) uses original (2D|3D) rules with (Time schedule|Time period) settings\.$/g, (_match, dim, family, baseDim, mode) => {
      const familyZh = { Chess: '西洋棋', Go: '圍棋', Reversi: '黑白棋', Jump: '跳棋' }[family] || family;
      const modeZh = mode === 'Time period' ? '時間週期' : '時間排程';
      return `${dim} ${familyZh} 使用原本 ${baseDim} 規則，並套用${modeZh}設定。`;
    })
    .replace(/^This mode uses the original (2D|3D) (Chess|Go|Reversi|Jump) board, pieces, topology, online room, and legal rules\. The controls below attach time properties to the existing game pieces\.$/g, (_match, dim, family) => {
      const familyZh = { Chess: '西洋棋', Go: '圍棋', Reversi: '黑白棋', Jump: '跳棋' }[family] || family;
      return `此模式使用原本的 ${dim} ${familyZh} 棋盤、棋子、拓撲、線上房間與合法規則。下方控制項會把時間性質附加到既有棋子上。`;
    })
    .replace(/^Time schedule: choose an Action delay from Instant to the Max schedule delay, then click a legal empty action site or piece destination\. Instant resolves immediately after this designed action; later delays resolve on their future turn if the source and target are still valid\.$/g, '時間排程：先在「立即」到「最大排程延遲」之間選擇行動延遲，再點合法的空行動位置或棋子目的地。立即會在設計此行動後立刻作用；較晚的延遲會在未來回合檢查來源與目標仍合法時才作用。')
    .replace(/^Player ([A-Z]) designed a (Instant|\+\d+) Jump action for turn (\d+)\.$/g, (_match, player, delay, turn) => `玩家 ${player} 設計了${delay === 'Instant' ? '立即' : delay}跳棋行動，將在第 ${turn} 回合執行。`)
    .replace(/^(Black|White) designed a (Instant|\+\d+) Go placement for turn (\d+)\.$/g, (_match, player, delay, turn) => `${player === 'Black' ? '黑方' : '白方'}設計了${delay === 'Instant' ? '立即' : delay}圍棋落子，將在第 ${turn} 回合執行。`)
    .replace(/^(Black|White) designed a (Instant|\+\d+) Reversi placement for turn (\d+)\.$/g, (_match, player, delay, turn) => `${player === 'Black' ? '黑方' : '白方'}設計了${delay === 'Instant' ? '立即' : delay}黑白棋落子，將在第 ${turn} 回合執行。`)
    .replace(/^(Black|White) designed a (Instant|\+\d+) hidden scheduled action for turn (\d+)\.$/g, (_match, player, delay, turn) => `${player === 'Black' ? '黑方' : '白方'}設計了${delay === 'Instant' ? '立即' : delay}隱藏排程行動，將在第 ${turn} 回合執行。`)
    .replace(/^(Black|White) future Go placement resolved\.$/g, (_match, player) => `${player === 'Black' ? '黑方' : '白方'}的未來圍棋落子已執行。`)
    .replace(/^(Black|White) future Reversi placement resolved\.$/g, (_match, player) => `${player === 'Black' ? '黑方' : '白方'}的未來黑白棋落子已執行。`)
    .replace(/^\+(\d+): hidden scheduled action$/g, '+$1：隱藏排程行動')
    .replace(/^([23]\+1D) Chess uses the original Chess board and rules with a time panel\.$/g, '$1 西洋棋使用原本棋盤與規則，並加入時間面板。')
    .replace(/^([23]\+1D) Chess uses the original Chess pieces and legal moves with Time schedule\.$/g, '$1 西洋棋使用原本棋子與合法走法，並加入時間排程。')
    .replace(/^New (.+) Reversi game started\.$/g, '新的 $1 黑白棋遊戲開始。')
    .replace(/^Waiting for (black|white)\.$/g, (_match, color) => `等待${color === 'black' ? '黑方' : '白方'}。`)
    .replace(/^(Black|White) flipped (\d+) stones?\.$/g, (_match, color, count) => `${color === 'Black' ? '黑方' : '白方'}翻轉 ${count} 顆棋子。`)
    .replace(/^Robot (black|white) flipped (\d+) stones?\.$/g, (_match, color, count) => `機器人${color === 'black' ? '黑方' : '白方'}翻轉 ${count} 顆棋子。`)
    .replace(/^Robot scheduled (.+)\.$/g, '機器人已排程 $1。')
    .replace(/^Robot scheduled (.+)\. Score (.+)\.$/g, '機器人已排程 $1。分數 $2。')
    .replace(/^Robot played (.+) and flipped (\d+)\.$/g, '機器人下在 $1，翻轉 $2 顆。')
    .replace(/^Robot found (.+) at score (.+); nodes (\d+)( \(time-limited\))?\.$/g, (_match, move, score, nodes, limited) => `機器人找到 ${move}，分數 ${score}；節點 ${nodes}${limited ? '（限時）' : ''}。`)
    .replace(/^Robot found no legal move\.$/g, '機器人沒有找到合法著法。')
    .replace(/^Robot found no move and pass was rejected\.$/g, '機器人沒有找到著法，且停手被拒絕。')
    .replace(/^Robot move was rejected(?:: (.+))?\.$/g, (_match, reason) => `機器人著法被拒絕${reason ? `：${reason}` : ''}。`)
    .replace(/^Robot error: (.+)$/g, '機器人錯誤：$1')
    .replace(/^Analysis error: (.+)$/g, '分析錯誤：$1')
    .replace(/^Analyzing (black|white) at (?:depth|search level) (\d+)\.\.\.$/g, (_match, color, depth) => `正在以深度 ${depth} 分析${color === 'black' ? '黑方' : '白方'}…`)
    .replace(/^Depth (\d+); completed (\d+); (\d+) searched nodes(?:, time\/node limit reached)?\. Win rate is heuristic, not solved\.$/g, '深度 $1；已完成 $2；搜尋 $3 個節點。勝率是啟發式估計，不是已解結果。')
    .replace(/^Black (\d+), White (\d+), Empty (\d+); completed depth (\d+)$/g, '黑方 $1，白方 $2，空點 $3；完成深度 $4')
    .replace(/^(.+) to play · score (.+) · win estimate (.+)% · nodes (\d+)$/g, '$1 行動 · 分數 $2 · 勝率估計 $3% · 節點 $4')
    .replace(/^(.+) to play · score (.+) · win estimate (.+)% · (.+)\/(.+) · nodes (\d+)( \(time-limited\))?$/g, (_match, player, score, win, topology, lattice, nodes, limited) => `${player} 行動 · 分數 ${score} · 勝率估計 ${win}% · ${topology}/${lattice} · 節點 ${nodes}${limited ? '（限時）' : ''}`)
    .replace(/^score (.+) · win (.+)%$/g, '分數 $1 · 勝率 $2%')
    .replace(/^(.+) has no legal moves\. Final count\.$/g, '$1 沒有合法著法。最終計數。')
    .replace(/^(Black|White) wins by (.+)$/g, (_match, color, margin) => `${color === 'Black' ? '黑方' : '白方'}勝 ${margin}`)
    .replace(/^(Black|White) wins$/g, (_match, color) => `${color === 'Black' ? '黑方' : '白方'}獲勝`)
    .replace(/^Final count: (.+)$/g, '最終計數：$1')
    .replace(/^(Black|White) passed$/g, (_match, color) => `${color === 'Black' ? '黑方' : '白方'}停手`)
    .replace(/^(Black|White) auto-passed$/g, (_match, color) => `${color === 'Black' ? '黑方' : '白方'}自動停手`)
    .replace(/^(Black|White) \(([^)]+)\) flipped (\d+)$/g, (_match, color, coord, count) => `${color === 'Black' ? '黑方' : '白方'}（${coord}）翻轉 ${count} 顆`)
    .replace(/^Empty \(([^)]+)\): legal, flips (\d+)\.$/g, '空點（$1）：合法，可翻轉 $2 顆。')
    .replace(/^Empty \(([^)]+)\): not legal for current player\.$/g, '空點（$1）：目前玩家不能下在這裡。')
    .replace(/^(Black|White) stone at \(([^)]+)\)\.$/g, (_match, color, coord) => `${color === 'Black' ? '黑方' : '白方'}棋子在（${coord}）。`)
    .replace(/^That vertex does not bracket any opponent stones\.$/g, '該頂點沒有夾住任何對手棋子。')
    .replace(/^Move unavailable\.$/g, '此著法不可用。')
    .replace(/^Pass is only available when the current player has no legal move\.$/g, '只有目前玩家沒有合法著法時才能停手。')
    .replace(/^Pass unavailable\.$/g, '目前不能停手。')
    .replace(/^Turn passed\.$/g, '本回合停手。')
    .replace(/^Current$/g, '目前')
    .replace(/^Model$/g, '模型')
    .replace(/^Central Charge$/g, '中心荷')
    .replace(/^Dominant Block$/g, '主導共形塊')
    .replace(/^Entropy$/g, '熵')
    .replace(/^Strongest Correlation$/g, '最強相關')
    .replace(/^OPE Channels$/g, 'OPE 通道')
    .replace(/^Anomaly Events$/g, '異常事件')
    .replace(/^Vacuum Block$/g, '真空共形塊')
    .replace(/^Total Charge$/g, '總荷')
    .replace(/^Logical Sector$/g, '邏輯扇區')
    .replace(/^Memory$/g, '記憶')
    .replace(/^Vacuum Recovery$/g, '真空恢復')
    .replace(/^Average Braid Length$/g, '平均編織長度')
    .replace(/^Maximum Braid Length$/g, '最大編織長度')
    .replace(/^Successful Unbraids$/g, '成功解編織')
    .replace(/^Failed Unbraids$/g, '失敗解編織')
    .replace(/^Syndrome Weight$/g, '症候權重')
    .replace(/^Check Violations$/g, '檢查違反數')
    .replace(/^Global Parity$/g, '全域奇偶')
    .replace(/^Commutation Conflicts$/g, '對易衝突')
    .replace(/^Ancillas$/g, '輔助位')
    .replace(/^Measurement Errors$/g, '測量錯誤')
    .replace(/^Vacuum$/g, '真空')
    .replace(/^Alive$/g, '存活')
    .replace(/^Not recovered$/g, '尚未恢復')
    .replace(/^Yes$/g, '是')
    .replace(/^No$/g, '否')
    .replace(/^Algebra set:$/g, '代數設定：')
    .replace(/^Lab goal:$/g, '實驗目標：')
    .replace(/^Physical meaning:$/g, '物理意義：')
    .replace(/^Physical problem \/ goal:$/g, '物理問題／目標：')
    .replace(/^Initial states:$/g, '初始狀態：')
    .replace(/^Actions:$/g, '行動：')
    .replace(/^Observables:$/g, '可觀測量：')
    .replace(/^Results:$/g, '結果：')
    .replace(/^Answer:$/g, '答案：')
    .replace(/^Move rule:$/g, '移動規則：')
    .replace(/^3D boards:$/g, '3D 棋盤：')
    .replace(/^Dynamics choices:$/g, '動力學選項：')
    .replace(/^Topology:$/g, '拓撲：')
    .replace(/^Measurements:$/g, '測量：')
    .replace(/^Default CFT:$/g, '預設 CFT：')
    .replace(/^Estimator note:$/g, '估計器說明：')
    .replace(/Clifford Reversi is one game with configurable algebra and opening rules\./g, 'Clifford 黑白棋是一個可設定代數與開局規則的遊戲。')
    .replace(/Standard Pauli keeps the ordinary four-stone Reversi opening\./g, '標準 Pauli 保留普通四子黑白棋開局。')
    .replace(/Choose Stabilizer Algebra to use qubit sites, alternate initial rules, measurements, phases, and ancillas\./g, '選擇 Stabilizer Algebra 可使用量子位點、替代初始規則、測量、相位與輔助位。')
    .replace(/compare how the same Pauli\/Clifford flipping rule changes when topology, seams, lattice, noise, and time settings alter the rays that carry local information\./g, '比較同一個 Pauli/Clifford 翻轉規則在拓撲、接縫、晶格、噪聲與時間設定改變局部資訊傳遞射線時如何變化。')
    .replace(/place a Pauli-labelled stone on an empty vertex only when it brackets at least one opponent chain along a topology-aware ray\./g, '只有當空頂點沿拓撲感知射線夾住至少一條對手鏈時，才能放置帶 Pauli 標籤的棋子。')
    .replace(/Rays use the selected topology, so 2D RBC, torus, Klein bottle, RP2, S2 latitude, and 4D grid boards use their graph normalization instead of flat boundary assumptions\./g, '射線使用所選拓撲，因此 2D RBC、環面、Klein 瓶、RP2、S2 緯線與 4D 網格棋盤都使用各自的圖正規化，而不是平面邊界假設。')
    .replace(/every bracketed opponent stone changes to the acting color\./g, '每顆被夾住的對手棋子都會變成行動方顏色。')
    .replace(/Pauli noise changes labels with seeded random rolls\./g, 'Pauli 噪聲會用帶種子的隨機擲骰改變標籤。')
    .replace(/Time evolution can age pieces on the selected clock after moves or full rounds/g, '時間演化可在移動後或完整輪次後依所選時鐘讓棋子老化')
    .replace(/the export records topology, lattice, board labels, move history, position history, probability\/noise events, time-evolution state, and final counts\./g, '匯出會記錄拓撲、晶格、棋盤標籤、移動歷史、局面歷史、機率／噪聲事件、時間演化狀態與最終計數。')
    .replace(/this is the Stabilizer Algebra configuration of the same Clifford Reversi game\./g, '這是同一個 Clifford 黑白棋遊戲的 Stabilizer Algebra 設定。')
    .replace(/empty vertices are identity I with no active excitation\./g, '空頂點是沒有活躍激發的恆等 I。')
    .replace(/Occupied vertices store owner, Pauli I\/X\/Y\/Z, sign, phase modulo four, and optional ancilla data\./g, '被佔據的頂點會儲存所有者、Pauli I/X/Y/Z、符號、模四相位與可選輔助位資料。')
    .replace(/recovery means using local Pauli-frame actions to reduce measured X\/Z syndrome defects and return the board toward the stabilizer vacuum or intended logical sector\./g, '恢復表示使用局部 Pauli-frame 行動降低測得的 X/Z 症候缺陷，並讓棋盤回到 stabilizer 真空或目標邏輯扇區。')
    .replace(/Stabilizer Pauli correction\/recovery exports the initial and final observables, full physics history, measurement log, circuit history, recovery time, logical-error flag, final sector, Pauli\/phase distributions, and a compact final answer/g, 'Stabilizer Pauli 糾錯／恢復會匯出初始與最終可觀測量、完整物理歷史、測量紀錄、電路歷史、恢復時間、邏輯錯誤旗標、最終扇區、Pauli/相位分布與精簡最終答案')
    .replace(/black is species A, phase A, or spin sector A\./g, '黑方代表物種 A、相位 A 或自旋扇區 A。')
    .replace(/White is species B, phase B, or spin sector B\./g, '白方代表物種 B、相位 B 或自旋扇區 B。')
    .replace(/test whether competing local growth rules create survival, extinction, percolation, or topology-wrapping clusters on different spaces\./g, '測試競爭式局部生長規則是否會在不同空間中產生存活、滅絕、滲流或繞拓撲的團簇。')
    .replace(/resource contacts are neighboring empty graph vertices that can feed growth\./g, '資源接觸是可供生長的相鄰空圖頂點。')
    .replace(/liberties are neighboring empty graph vertices that can feed growth\./g, '資源接觸是可供生長的相鄰空圖頂點。')
    .replace(/black is the \+ source\/domain sign and white is the - source\/domain sign\./g, '黑方是正源／正疇符號，白方是負源／負疇符號。')
    .replace(/A stone is a primary field or spin\/domain insertion\./g, '一顆棋子代表 primary field 或自旋／疇插入。')
    .replace(/use local OPE intervals to see how source signs, domain walls, and OPE channels reorganize across the selected graph\./g, '使用局部 OPE 區間觀察源符號、疇壁與 OPE 通道如何在所選圖上重組。')
    .replace(/use Reversi brackets as discrete intervals to see how source signs, domain walls, and OPE channels reorganize across the selected graph\./g, '使用局部 OPE 區間觀察源符號、疇壁與 OPE 通道如何在所選圖上重組。')
    .replace(/create mobile topological charges, braid or unbraid their worldlines, then test whether fusion and logical memory return to the intended vacuum or sector\./g, '建立可移動拓撲荷，編織或解編織其世界線，再測試融合與邏輯記憶是否回到目標真空或扇區。')
    .replace(/a token may hop to an adjacent empty vertex or exchange over one occupied neighboring token into the next empty vertex/g, '一個粒子可以躍遷到相鄰空頂點，或經由相鄰佔據粒子交換到下一個空頂點')
    .replace(/a token may hop to an adjacent empty vertex or jump over one occupied neighboring token into the next empty vertex/g, '一個粒子可以躍遷到相鄰空頂點，或經由相鄰佔據粒子交換到下一個空頂點')
    .replace(/the board is a discretized Riemann surface \/ graph manifold\./g, '棋盤是離散化的 Riemann 曲面／圖流形。')
    .replace(/insert primary fields and use local graph\/OPE contact updates, then measure which conformal block, correlation pattern, entropy growth, or anomaly response dominates\./g, '插入 primary field，並使用局部圖與 OPE 接觸更新，再測量哪個共形塊、相關模式、熵增長或異常響應占主導。')
    .replace(/local insertion, graph contacts, OPE fusion updates, measurements, and pass actions use topology adjacency\./g, '局部插入、圖接觸、OPE 融合更新、測量與停手都使用拓撲鄰接。')
    .replace(/legal placement, liberties, captures, suicide, superko, passing, and area scoring use topology adjacency\./g, '局部插入、圖接觸、OPE 融合更新、測量與停手都使用拓撲鄰接。')
    .replace(/export summarizes final dominant block, identity\/vacuum block dominance, entropy growth, strongest correlations, final OPE sector, and anomaly count\./g, '匯出會總結最終主導共形塊、恆等／真空共形塊優勢、熵增長、最強相關、最終 OPE 扇區與異常數。')
    .replace(/^Stabilizer\ Operator\ Grid$/g, 'Stabilizer 算符格')
    .replace(/^Pauli\-Frame\ Recovery\ Operators$/g, 'Pauli-frame 恢復算符')
    .replace(/^Clifford\ Insertion\ Field$/g, 'Clifford 插入場')
    .replace(/^Physical\ Clifford\ Field\ Operators$/g, '物理 Clifford 場算符')
    .replace(/^Clifford\ Worldline\ Operators$/g, 'Clifford 世界線算符')
    .replace(/^Physical\ Clifford\ Worldlines$/g, '物理 Clifford 世界線')
    .replace(/^Anyon\ Charge\ Fusion\ Grid$/g, 'Anyon 電荷融合格')
    .replace(/^Physical\ Anyon\ Charge\ Grid$/g, '物理 Anyon 電荷格')
    .replace(/^CFT\ Field\ Insertion\ Graph$/g, 'CFT 場插入圖')
    .replace(/^CFT\ Local\ OPE\ Operators$/g, 'CFT 局部 OPE 算符')
    .replace(/^Virasoro\ Worldline\ Operators$/g, 'Virasoro 世界線算符')
    .replace(/^Physical\ Virasoro\ Worldlines$/g, '物理 Virasoro 世界線')
    .replace(/^Anyon\ Fusion\ \&\ Braiding\ Worldlines$/g, 'Anyon 融合與編織世界線')
    .replace(/^Topological\ Memory\ Worldlines$/g, '拓撲記憶世界線')
    .replace(/^Physical\ Cluster\ Field$/g, '物理團簇場')
    .replace(/^Particle\ Hopping\ \/\ Reaction\ System$/g, '粒子躍遷／反應系統')
    .replace(/^CFT\ Local\ OPE\ Intro$/g, 'CFT 局部 OPE 簡介')
    .replace(/^CFT\ Field\ Graph\ Intro$/g, 'CFT 場圖簡介')
    .replace(/^Cluster\ Field\ Intro$/g, '團簇場簡介')
    .replace(/^Particle\ Hopping\ Intro$/g, '粒子躍遷簡介')
    .replace(/^Clifford\ Worldline\ Intro$/g, 'Clifford 世界線簡介')
    .replace(/^Virasoro\ Worldline\ Intro$/g, 'Virasoro 世界線簡介')
    .replace(/^Apply\ Pauli\ Recovery\ Operator$/g, '套用 Pauli 恢復算符')
    .replace(/^Line\-Interval\ Rewrite$/g, '線區間重寫')
    .replace(/^Exchange\ Across\ Particle$/g, '跨粒子交換')
    .replace(/^Multi\-step\ Scattering$/g, '多步散射')
    .replace(/\bInstant\b/g, '立即')
    .replace(/^(\d+) stones?$/, '$1 顆棋子')
    .replace(/^Robot is thinking\.\.\.$/, '機器人思考中…')
    .replace(/^Robot is searching for (.+) at (?:depth|search level) (\d+)\.\.\.$/, '機器人正在以深度 $2 為 $1 搜尋…')
    .replace(/^Robot played (.+)\.$/, '機器人下在 $1。')
    .replace(/^(.+) to play$/, '$1 行動')
    .replace(/^Slice ([zw])$/, '切片 $1');
}

function installLanguageControl() {
  const host = document.querySelector('.header, .top-bar, .jump-header, .life-topbar');
  if (!host) return;
  if (host.matches('.header') && host.querySelector(':scope > h1')) {
    const copy = document.createElement('div');
    copy.className = 'game-title-copy';
    host.querySelectorAll(':scope > h1, :scope > p').forEach((element) => copy.append(element));
    host.prepend(copy);
  }
  let actions = host.querySelector(':scope > .game-title-actions');
  if (!actions) {
    actions = document.createElement('div');
    actions.className = 'game-title-actions';
    host.append(actions);
  }

  const home = document.querySelector('.space-home-link, .jump-home-link, .home-link');
  if (home && !actions.contains(home)) actions.append(home);

  const nativeControl = document.querySelector('.language-switch, .life-language-switch');
  if (nativeControl) {
    nativeControl.dataset.gameLanguageControl = 'true';
    actions.append(nativeControl);
    document.querySelectorAll('.language-switch, .life-language-switch').forEach((control) => {
      if (control !== nativeControl) control.hidden = true;
    });
    normalizeLanguageIcons();
    return;
  }
  if (document.querySelector('[data-game-language-control]')) {
    normalizeLanguageIcons();
    return;
  }
  const control = document.createElement('div');
  control.className = 'shared-game-language';
  control.dataset.gameLanguageControl = 'true';
  control.innerHTML = `<button type="button" class="shared-game-language-icon" aria-label="Language" title="Language" aria-expanded="false">${GLOBE_ICON}</button><div class="shared-game-language-menu" hidden><button type="button" data-shared-lang="en">En</button><span>|</span><button type="button" data-shared-lang="zh">中</button></div>`;
  actions.append(control);
  const icon = control.querySelector('.shared-game-language-icon');
  const menu = control.querySelector('.shared-game-language-menu');
  icon.addEventListener('click', () => {
    menu.hidden = !menu.hidden;
    icon.setAttribute('aria-expanded', String(!menu.hidden));
  });
  control.querySelectorAll('[data-shared-lang]').forEach((button) => button.addEventListener('click', () => {
    setGameLanguage(button.dataset.sharedLang);
    menu.hidden = true;
    icon.setAttribute('aria-expanded', 'false');
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { language } }));
  }));
  syncLanguageControl();
}

function normalizeLanguageIcons() {
  document.querySelectorAll('.language-icon-button').forEach((button) => {
    if (!button.querySelector('svg')) button.innerHTML = GLOBE_ICON;
    button.setAttribute('aria-label', 'Language');
    if (!button.dataset.sharedLanguageToggleBound) {
      button.dataset.sharedLanguageToggleBound = 'true';
      button.addEventListener('click', (event) => {
        const control = button.closest('.language-switch, .life-language-switch, .shared-game-language');
        const menu = control?.querySelector('.language-popover, .shared-game-language-menu');
        if (!control || !menu) return;
        event.preventDefault();
        const open = control.dataset.languageOpen !== 'true';
        control.dataset.languageOpen = String(open);
        button.setAttribute('aria-expanded', String(open));
        if (menu.classList.contains('shared-game-language-menu')) menu.hidden = !open;
      });
    }
  });
  document.querySelectorAll('[data-lang-option="en"], [data-life-lang="en"]').forEach((button) => { button.textContent = 'En'; });
  document.querySelectorAll('[data-lang-option="zh"], [data-life-lang="zh"]').forEach((button) => { button.textContent = '中'; });
  document.querySelectorAll('.language-popover, .life-language-switch .language-popover').forEach((menu) => {
    const buttons = Array.from(menu.querySelectorAll('[data-lang-option], [data-life-lang]'));
    if (buttons.length < 2 || menu.querySelector('.shared-language-divider')) return;
    const divider = document.createElement('span');
    divider.className = 'shared-language-divider';
    divider.setAttribute('aria-hidden', 'true');
    divider.textContent = '|';
    buttons[0].after(divider);
  });
}

function syncLanguageControl() {
  document.querySelectorAll('[data-shared-lang]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.sharedLang === language)));
}

function installStyles() {
  if (document.getElementById('shared-game-language-style')) return;
  const style = document.createElement('style');
  style.id = 'shared-game-language-style';
  style.textContent = `.game-title-copy,.header>div:not(.game-title-actions),.top-bar>div:not(.game-title-actions),.jump-header>div:not(.game-title-actions){min-width:0}.game-title-copy h1,.game-title-copy p{overflow-wrap:anywhere}.game-title-actions{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:8px;flex:0 0 auto;position:relative;z-index:80}.header,.top-bar,.jump-header,.life-topbar{align-items:center}.header,.top-bar,.jump-header{display:flex;justify-content:space-between;gap:14px}.game-title-actions .language-icon-button,.shared-game-language-icon{width:30px!important;min-width:30px!important;height:30px!important;padding:0!important;border:0!important;border-radius:999px!important;background:transparent!important;box-shadow:none!important;color:inherit!important;font-size:0!important;line-height:1;letter-spacing:0}.game-title-actions .language-icon-button svg,.shared-game-language-icon svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.shared-game-language{position:relative;display:flex;align-items:center}.shared-game-language-icon{display:grid;place-items:center;cursor:pointer}.game-title-actions .language-icon-button:hover,.game-title-actions .language-icon-button:focus-visible,.shared-game-language-icon:hover,.shared-game-language-icon:focus-visible{color:#ffe7ac;outline:none}.shared-game-language-menu,.game-title-actions .language-popover{position:absolute!important;right:0!important;top:calc(100% + 5px)!important;z-index:1200!important;align-items:center!important;grid-auto-flow:column!important;grid-template-columns:none!important;flex-direction:row!important;gap:6px!important;padding:8px 10px!important;border:0!important;border-radius:8px!important;background:rgba(15,20,27,.94)!important;box-shadow:0 18px 48px rgba(0,0,0,.38)!important;white-space:nowrap}.shared-game-language-menu{display:flex}.shared-game-language-menu[hidden]{display:none!important}.game-title-actions .language-popover{display:none!important}.game-title-actions .compact-language:hover .language-popover,.game-title-actions .compact-language:focus-within .language-popover,.game-title-actions .compact-language[data-language-open=true] .language-popover{display:flex!important}.shared-game-language-menu button,.game-title-actions .language-popover button{min-width:0!important;min-height:0!important;width:auto!important;padding:2px 4px!important;border:0!important;border-radius:0!important;background:transparent!important;color:inherit!important;font-size:13px!important;font-weight:900!important;line-height:1.2!important;cursor:pointer}.game-title-actions .language-popover button + button::before{content:none!important}.shared-game-language-menu span,.game-title-actions .language-popover .shared-language-divider{font-size:13px;font-weight:900;color:inherit}.shared-game-language-menu button[aria-pressed=true],.game-title-actions .language-popover button[aria-pressed=true],.game-title-actions .language-popover button.active{color:#ffe7ac!important;text-decoration:underline;text-underline-offset:4px}@media(max-width:620px){.header,.top-bar,.jump-header{align-items:flex-start}.header{position:relative;display:block;padding-top:50px}.header>.game-title-actions{position:absolute;right:0;top:0}.game-title-actions{gap:4px}.game-title-actions .space-home-link,.game-title-actions .jump-home-link,.game-title-actions .home-link{padding:7px 9px;min-height:32px}}`;
  document.head.append(style);
}

function detectLanguage() {
  const url = new URLSearchParams(location.search).get('lang');
  const stored = localStorage.getItem('topological-boardgame:language')
    || localStorage.getItem('topoboardgame-language')
    || localStorage.getItem('topoboardgame.lang')
    || localStorage.getItem('3dgo:language');
  return normalizeLanguage(url || stored || document.documentElement.lang || navigator.language);
}

function normalizeLanguage(value) {
  return String(value || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
}
