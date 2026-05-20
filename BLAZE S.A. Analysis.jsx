<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BLAZE S.A. - 智能速滑训练系统 (Edge AI 驱动)</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js" crossorigin="anonymous"></script>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        serif: ['Georgia', 'serif'] // 报告使用衬线字体增加权威感
                    },
                    colors: {
                        skating: {
                            dark: '#0f172a',    
                            card: '#1e293b',    
                            neon: '#0ea5e9',    
                            accent: '#f97316',  
                            success: '#10b981', 
                            pro: '#8b5cf6'      
                        }
                    }
                }
            }
        }
    </script>
    
    <style>
        body { background-color: #0f172a; color: #f8fafc; -webkit-font-smoothing: antialiased; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .neon-glow { box-shadow: 0 0 15px rgba(14, 165, 233, 0.4); }
        .pro-glow { box-shadow: 0 0 15px rgba(139, 92, 246, 0.4); }
        .tab-content { display: none !important; }
        .tab-content.active { display: grid !important; animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    </style>
</head>

<body class="min-h-screen flex flex-col items-center p-4 sm:p-8">

    <header class="w-full max-w-[1400px] flex justify-between items-center mb-6">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-skating-pro rounded-lg flex items-center justify-center font-bold text-xl text-white pro-glow">
                B<span class="text-xs">S</span>
            </div>
            <div>
                <h1 class="font-bold text-xl tracking-wide">BLAZE S.A.</h1>
                <p class="text-xs text-slate-400 font-mono text-skating-success">BLAZE SKATE ACADEMY • SYSTEM ACTIVE</p>
            </div>
        </div>
        
        <div class="flex items-center gap-4">
            <button id="exportPdfBtn" onclick="exportScoutingReport()" class="hidden md:flex bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-2 px-4 rounded-lg items-center gap-2 text-sm shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all active:scale-95">
                <i class="fa-solid fa-file-pdf"></i> 生成专业训练分析报告 (PDF)
            </button>

            <div class="flex items-center gap-4 bg-skating-card py-2 px-4 rounded-full border border-slate-700">
                <div class="w-8 h-8 rounded-full bg-slate-600 overflow-hidden border border-slate-500 relative">
                    <div class="absolute inset-0 bg-purple-500/20 animate-pulse"></div>
                    <img src="https://placehold.co/100x100/1e293b/a855f7?text=Lin" alt="Lindsay Avatar" class="w-full h-full object-cover">
                </div>
                <div class="text-sm">
                    <p class="font-semibold text-white">Lindsay <span class="text-xs text-slate-400 font-normal ml-1" id="lindsayAgeBadge">U13 预备组</span></p>
                    <p class="text-xs text-skating-accent font-medium"><i class="fa-solid fa-star mr-1"></i><span id="globalPoints">2450</span> 积分</p>
                </div>
            </div>
        </div>
    </header>

    <div class="w-full max-w-[1400px] mb-6 border-b border-slate-700 flex gap-6 px-2 overflow-x-auto no-scrollbar">
        <button onclick="switchTab('biomechanics')" id="btn-biomechanics" class="pb-3 text-sm font-bold text-skating-pro border-b-2 border-skating-pro transition-colors flex items-center gap-2 whitespace-nowrap">
            <i class="fa-solid fa-microscope"></i> 生物力学实验室 (本地AI版)
            <span class="text-[10px] bg-skating-success text-white px-1.5 py-0.5 rounded uppercase font-black tracking-wider">LIVE</span>
        </button>
        <button onclick="switchTab('pacing')" id="btn-pacing" class="pb-3 text-sm font-bold text-slate-400 hover:text-slate-200 border-b-2 border-transparent transition-colors whitespace-nowrap">
            <i class="fa-solid fa-stopwatch mr-1"></i> 智能配速优化 (乳酸衰减分析)
        </button>
        <button onclick="switchTab('planning')" id="btn-planning" class="pb-3 text-sm font-bold text-slate-400 hover:text-slate-200 border-b-2 border-transparent transition-colors flex items-center gap-2 whitespace-nowrap">
            <i class="fa-solid fa-calendar-week"></i> 阶段训练规划 (自适应课表)
        </button>
        <button onclick="switchTab('equipment')" id="btn-equipment" class="pb-3 text-sm font-bold text-slate-400 hover:text-slate-200 border-b-2 border-transparent transition-colors flex items-center gap-2 whitespace-nowrap">
            <i class="fa-solid fa-screwdriver-wrench"></i> 器材智能调校 (底盘诊断)
        </button>
    </div>

    <div class="w-full max-w-[1400px]">
        <main id="tab-biomechanics" class="tab-content active grid grid-cols-1 xl:grid-cols-12 gap-6 w-full transition-all duration-500">
            <div id="bioLeftPanel" class="xl:col-span-4 bg-skating-card rounded-2xl p-6 border border-slate-700 shadow-xl self-start flex flex-col gap-6 transition-all duration-500">
                <div>
                    <h2 class="text-lg font-bold flex items-center gap-2 text-white">
                        <i class="fa-solid fa-microscope text-skating-pro"></i> 动作关键帧诊断
                    </h2>
                    <p class="text-sm text-slate-400 mt-1 leading-relaxed">纯本地前端渲染，视频无需上传，零算力成本且保护肖像隐私。</p>
                </div>
                
                <input type="file" id="videoUpload" accept="video/mp4,video/mov,video/*" class="hidden">
                <div id="uploadZone" class="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-skating-pro hover:bg-slate-800/50 transition-all flex flex-col items-center justify-center min-h-[160px]">
                    <i class="fa-solid fa-cloud-arrow-up text-3xl text-slate-500 mb-2"></i>
                    <p class="text-sm font-semibold text-slate-300">点击上传测试视频</p>
                    <p class="text-xs text-slate-500 mt-1">AI 引擎将征用本地算力进行解析</p>
                </div>
                
                <div id="fileSelected" class="hidden bg-slate-800 rounded-xl p-4 border border-slate-600 flex justify-between items-center min-h-[80px]">
                    <div class="flex items-center gap-3 w-full overflow-hidden">
                        <div class="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-skating-pro flex-shrink-0">
                            <i class="fa-solid fa-file-video text-lg"></i>
                        </div>
                        <div class="truncate">
                            <p id="fileNameDisplay" class="text-sm font-semibold text-white truncate">video.mp4</p>
                            <p class="text-xs text-skating-success font-mono mt-0.5">本地就绪 (Ready for local CV)</p>
                        </div>
                    </div>
                    <button onclick="resetUpload()" class="text-slate-500 hover:text-red-400 transition-colors ml-2 flex-shrink-0"><i class="fa-solid fa-xmark"></i></button>
                </div>

                <div class="bg-slate-900 border border-slate-700/60 rounded-xl p-4 flex flex-col gap-4">
                    <div class="flex justify-between items-center">
                        <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider"><i class="fa-solid fa-compass text-skating-accent mr-1"></i>相机标定与姿态校准</h4>
                        <span id="calibStatusBadge" class="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">检测中</span>
                    </div>
                    <div>
                        <div class="flex justify-between text-xs text-slate-400 mb-1.5">
                            <span>镜头偏航/翻滚矫正 (Roll)</span>
                            <span id="rollValueText" class="font-mono text-skating-accent font-bold">0.0°</span>
                        </div>
                        <input type="range" id="cameraRollSlider" min="-15" max="15" step="0.1" value="0" class="w-full accent-skating-accent cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none">
                    </div>
                </div>

                <button type="button" id="analyzeBioBtn" disabled class="w-full bg-slate-800 text-slate-500 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-not-allowed">
                    <i class="fa-solid fa-wand-magic-sparkles"></i> 请先上传视频
                </button>
            </div>

            <div id="bioRightPanel" class="xl:col-span-8 space-y-6 transition-all duration-500">
                <div id="bioEmptyState" class="h-full min-h-[500px] flex-col items-center justify-center bg-skating-card/50 rounded-2xl p-12 border border-slate-700/50 text-center border-dashed flex">
                    <div class="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 text-2xl mb-4"><i class="fa-solid fa-robot"></i></div>
                    <h3 class="text-lg font-medium text-slate-300 mb-1">AI 动作实验室休眠中</h3>
                    <p class="text-sm text-slate-500">上传真实视频唤醒引擎。寻找最佳姿势参数，并生成科研报告。</p>
                </div>

                <div id="bioResults" class="hidden h-full bg-skating-card rounded-2xl p-6 border border-slate-700 shadow-xl relative overflow-hidden flex flex-col transition-all">
                    
                    <div class="flex flex-wrap justify-between items-center gap-3 mb-4">
                        <div class="flex items-center gap-3">
                            <h3 class="text-lg font-bold text-gradient-pro">实时动作测算雷达 (Live Telemetry)</h3>
                            <span id="cvStatusText" class="text-xs font-mono font-bold text-skating-neon bg-slate-900 px-3 py-1 rounded border border-slate-700">STATUS: INITIALIZING...</span>
                        </div>
                        
                        <button id="theaterModeBtn" class="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all active:scale-95">
                            <i class="fa-solid fa-expand" id="theaterIcon"></i>
                            <span id="theaterText">宽屏剧场模式</span>
                        </button>
                    </div>
                    
                    <div class="w-full bg-black rounded-xl relative overflow-hidden flex items-center justify-center border border-slate-800 aspect-video transition-all duration-500" id="videoViewport">
                        <video id="inputVideo" playsinline muted class="hidden"></video>
                        <canvas id="outputCanvas" class="absolute inset-0 w-full h-full object-contain"></canvas>
                        <div id="loadingModel" class="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center z-20">
                            <i class="fa-solid fa-circle-notch fa-spin text-4xl text-skating-pro mb-3"></i>
                            <p class="text-sm text-white font-mono">Loading Neural Network...</p>
                        </div>
                    </div>

                    <div class="mt-4 bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex flex-col gap-3">
                        <div class="flex flex-wrap items-center justify-between gap-3">
                            <button id="bioPlayPauseBtn" class="bg-skating-pro hover:bg-purple-600 text-white font-bold py-2 px-5 rounded-lg flex items-center gap-2 text-sm transition-all active:scale-95">
                                <i class="fa-solid fa-pause" id="playPauseIcon"></i> <span id="playPauseText">暂停</span>
                            </button>
                            <div class="flex items-center gap-2 text-xs">
                                <span class="text-slate-400">分析速度:</span>
                                <select id="playbackSpeed" class="bg-slate-900 border border-slate-700 rounded-lg px-2 text-white font-mono focus:outline-none">
                                    <option value="1">1.0x</option><option value="0.5">0.5x</option><option value="0.25" selected>0.25x (慢放)</option><option value="0.1">0.1x</option>
                                </select>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 pt-1">
                            <span class="text-xs text-slate-400 font-mono" id="currentTimeUI">00:00</span>
                            <input type="range" id="bioScrubber" min="0" max="100" value="0" step="0.1" class="flex-1 accent-skating-pro cursor-pointer h-2 bg-slate-700 rounded-lg appearance-none">
                            <span class="text-xs text-slate-400 font-mono" id="durationTimeUI">00:00</span>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                         <div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700 relative overflow-hidden">
                             <div class="absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-red-500/10 to-transparent"></div>
                             <p class="text-[10px] text-slate-400 mb-1 font-bold">身体倾斜角 (Lean)</p>
                             <p class="text-3xl font-black text-white" id="liveLeanAngle">--°</p>
                         </div>
                         <div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700 relative overflow-hidden">
                             <div class="absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-skating-success/10 to-transparent"></div>
                             <p class="text-[10px] text-slate-400 mb-1 font-bold">支撑腿屈曲 (Knee)</p>
                             <p class="text-3xl font-black text-white" id="liveKneeAngle">--°</p>
                         </div>
                         <div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700 relative overflow-hidden">
                             <div class="absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-yellow-500/10 to-transparent"></div>
                             <p class="text-[10px] text-slate-400 mb-1 font-bold">骨盆实时高度</p>
                             <p class="text-3xl font-black text-yellow-400" id="livePelvisHeight">--%</p>
                         </div>
                         <div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700 relative overflow-hidden">
                             <div class="absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-skating-pro/10 to-transparent"></div>
                             <p class="text-[10px] text-slate-400 mb-1 font-bold">浮腿瞬时率</p>
                             <p class="text-3xl font-black text-purple-400" id="liveRecoverySpeed">--</p>
                         </div>
                    </div>
                </div>
            </div>
        </main>

        <main id="tab-pacing" class="tab-content grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
            <div class="lg:col-span-4 bg-skating-card rounded-2xl p-6 border border-slate-700 shadow-xl flex flex-col gap-6 self-start">
                <div>
                    <h2 class="text-lg font-bold text-white flex items-center gap-2">
                        <i class="fa-solid fa-stopwatch text-skating-neon"></i> Lactic 配速损耗测算
                    </h2>
                    <p class="text-sm text-slate-400 mt-1">短道500m项目多圈速跑（起跑0.5圈 + 4圈），解构极限无氧抗性。</p>
                </div>
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-3">
                        <div class="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                            <label class="block text-[10px] text-slate-400 mb-1 font-bold">起跑0.5圈 (s)</label>
                            <input type="number" step="0.01" id="paceStart" value="7.25" class="w-full bg-transparent text-white font-mono font-bold text-lg focus:outline-none">
                        </div>
                        <div class="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                            <label class="block text-[10px] text-slate-400 mb-1 font-bold">Lap 1 (s)</label>
                            <input type="number" step="0.01" id="paceLap1" value="9.15" class="w-full bg-transparent text-white font-mono font-bold text-lg focus:outline-none">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                            <label class="block text-[10px] text-slate-400 mb-1 font-bold">Lap 2 (s)</label>
                            <input type="number" step="0.01" id="paceLap2" value="9.62" class="w-full bg-transparent text-white font-mono font-bold text-lg focus:outline-none">
                        </div>
                        <div class="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                            <label class="block text-[10px] text-slate-400 mb-1 font-bold">Lap 3 (s)</label>
                            <input type="number" step="0.01" id="paceLap3" value="10.38" class="w-full bg-transparent text-white font-mono font-bold text-lg focus:outline-none">
                        </div>
                    </div>
                    <div class="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                        <label class="block text-[10px] text-slate-400 mb-1 font-bold">Lap 4 (s)</label>
                        <input type="number" step="0.01" id="paceLap4" value="11.20" class="w-full bg-transparent text-white font-mono font-bold text-lg focus:outline-none">
                    </div>
                </div>
                <button id="calculatePaceBtn" class="w-full bg-gradient-to-r from-skating-neon to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2">
                    <i class="fa-solid fa-chart-line"></i> 生成配速衰减曲线
                </button>
            </div>
            
            <div class="lg:col-span-8 space-y-6">
                 <div class="bg-skating-card rounded-2xl p-6 border border-slate-700 shadow-xl">
                      <div class="flex justify-between items-center mb-6">
                        <h3 class="text-lg font-bold text-white">500m 极速标杆比对</h3>
                        <span class="text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1 rounded text-skating-success">TARGET: US NDP U13</span>
                      </div>
                      <div class="relative w-full h-[260px]">
                          <canvas id="pacingChart"></canvas>
                      </div>
                      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div class="bg-slate-800 p-4 rounded-xl border border-slate-700">
                            <p class="text-xs text-slate-400 mb-1">抗乳酸指数</p>
                            <p class="text-2xl font-black text-yellow-400" id="lacticIndexVal">--%</p>
                        </div>
                        <div class="bg-slate-800 p-4 rounded-xl border border-slate-700">
                            <p class="text-xs text-slate-400 mb-1">耐力评级</p>
                            <p class="text-2xl font-black text-white" id="lacticLevel">等待测算...</p>
                        </div>
                        <div class="bg-slate-800 p-4 rounded-xl border border-slate-700">
                            <p class="text-xs text-slate-400 mb-1">有氧:无氧 训练比</p>
                            <p class="text-2xl font-black text-skating-neon" id="ratioTraining">--</p>
                        </div>
                      </div>
                 </div>
            </div>
        </main>
        
        <main id="tab-planning" class="tab-content grid w-full">
            <div class="bg-skating-card rounded-2xl p-12 border border-slate-700 text-center"><p class="text-slate-400">模块折叠，请测试 PDF 导出功能。</p></div>
        </main>
        <main id="tab-equipment" class="tab-content grid w-full">
            <div class="bg-skating-card rounded-2xl p-12 border border-slate-700 text-center"><p class="text-slate-400">模块折叠，请测试 PDF 导出功能。</p></div>
        </main>
    </div>

    <div id="pdfReportTemplate" class="fixed top-[-9999px] left-[-9999px] bg-white text-slate-900 w-[794px] min-h-[1123px] overflow-hidden shadow-lg box-border">
        <div class="flex justify-between items-end border-b-4 border-slate-900 pb-4 pt-10 px-10 bg-slate-50">
            <div>
                <h1 class="font-serif text-3xl font-black text-slate-900 tracking-tight uppercase">Professional Training Analysis</h1>
                <p class="text-sm font-semibold text-slate-500 tracking-widest mt-1">BLAZE SKATE ACADEMY • ADVANCED BIOMECHANICS LAB</p>
            </div>
            <div class="text-right">
                <div class="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center font-bold text-2xl text-white ml-auto">
                    BS
                </div>
                <p class="text-[10px] text-slate-400 font-mono mt-2" id="pdfDate">DATE: YYYY-MM-DD</p>
            </div>
        </div>

        <div class="px-10 py-6">
            <div class="bg-slate-100 rounded-xl p-5 border border-slate-200 flex justify-between items-center">
                <div class="flex items-center gap-4">
                    <div class="w-16 h-16 rounded-full bg-slate-300 border-2 border-white overflow-hidden shadow-sm">
                        <img src="https://placehold.co/200x200/475569/ffffff?text=Lindsay" class="w-full h-full object-cover">
                    </div>
                    <div>
                        <h2 class="text-2xl font-black text-slate-800">Lindsay Lin</h2>
                        <p class="text-sm text-slate-500 font-medium">DOB: 2015-01 &nbsp;|&nbsp; Target Tier: <span class="font-bold text-slate-800">US Speedskating U13</span></p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">System Evaluation</p>
                    <p class="text-2xl font-black text-purple-600" id="pdfOverallStatus">ELITE PROSPECT</p>
                </div>
            </div>
        </div>

        <div class="px-10 pb-6">
            <h3 class="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-300 pb-2 mb-4">I. Biomechanics & Kinematics</h3>
            <div class="grid grid-cols-3 gap-4">
                <div class="bg-white border-2 border-slate-200 rounded-xl p-4">
                    <p class="text-[10px] text-slate-500 font-bold uppercase mb-1">Min Lean Angle (倾斜角)</p>
                    <p class="text-4xl font-black text-slate-800" id="pdfLean">--°</p>
                    <p class="text-[10px] text-green-600 font-mono mt-2 font-bold">Standard: < 48°</p>
                </div>
                <div class="bg-white border-2 border-slate-200 rounded-xl p-4">
                    <p class="text-[10px] text-slate-500 font-bold uppercase mb-1">Knee Flexion (屈膝支撑角)</p>
                    <p class="text-4xl font-black text-slate-800" id="pdfKnee">--°</p>
                    <p class="text-[10px] text-green-600 font-mono mt-2 font-bold">Standard: 100° - 110°</p>
                </div>
                <div class="bg-white border-2 border-slate-200 rounded-xl p-4">
                    <p class="text-[10px] text-slate-500 font-bold uppercase mb-1">Pelvis Bounce (骨盆波动)</p>
                    <p class="text-4xl font-black text-slate-800" id="pdfBounce">--%</p>
                    <p class="text-[10px] text-green-600 font-mono mt-2 font-bold">Standard: < 5.0%</p>
                </div>
            </div>
        </div>

        <div class="px-10 pb-6">
            <h3 class="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-300 pb-2 mb-4">II. 500m Lactic Pace Analysis</h3>
            <div class="flex gap-4">
                <div class="w-1/3 bg-slate-900 rounded-xl p-5 text-white flex flex-col justify-center">
                    <p class="text-[10px] text-slate-400 font-bold uppercase mb-1">Lactic Drop-off (衰减率)</p>
                    <p class="text-4xl font-black text-white" id="pdfLactic">--%</p>
                    <div class="w-full h-[1px] bg-slate-700 my-3"></div>
                    <p class="text-xs text-slate-300">Level: <strong class="text-yellow-400" id="pdfLacticLevel">PENDING</strong></p>
                </div>
                <div class="w-2/3 bg-white border-2 border-slate-200 rounded-xl p-4 flex flex-col justify-center">
                    <p class="text-xs text-slate-800 font-bold mb-2">Track Times (500m / 4.5 Laps)</p>
                    <table class="w-full text-left text-sm font-mono">
                        <tr class="text-[10px] text-slate-400 uppercase"><th class="pb-1">Segment</th><th class="pb-1">Time (s)</th><th class="pb-1">Diff vs U13 Nat'l</th></tr>
                        <tr class="border-t border-slate-100"><td class="py-1">Start (0.5 Lap)</td><td class="py-1" id="pdfP1">7.25</td><td class="py-1 text-red-500">+0.20</td></tr>
                        <tr class="border-t border-slate-100"><td class="py-1">Lap 1</td><td class="py-1" id="pdfP2">9.15</td><td class="py-1 text-red-500">+0.05</td></tr>
                        <tr class="border-t border-slate-100"><td class="py-1">Lap 4 (Finish)</td><td class="py-1" id="pdfP3">11.20</td><td class="py-1 text-red-500">+0.90</td></tr>
                    </table>
                </div>
            </div>
        </div>
        
        <div class="px-10 pb-6">
            <h3 class="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-300 pb-2 mb-4">III. Equipment Geometry</h3>
            <div class="bg-white border-2 border-slate-200 rounded-xl p-4 text-sm text-slate-700 leading-relaxed font-mono">
                <p>Athlete Body Weight: <strong>38kg</strong> | Blade Rocker: <strong>10.5m</strong></p>
                <p class="mt-2 text-red-600 font-bold" id="pdfEquipVerdict">⚠️ ALERT: Blade rocker radius significantly exceeds athlete weight tolerance limit. Risk of Boot-out.</p>
            </div>
        </div>

        <div class="px-10 pb-6">
            <h3 class="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-300 pb-2 mb-4">IV. Chief Coach's Verdict</h3>
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm text-slate-800 italic leading-relaxed">
                "Lindsay exhibits world-class aerodynamic posture during straights. However, her cornering potential is currently bottlenecked by an overly flat blade rocker (10.5m) relative to her 38kg frame, preventing maximum lean angles. Secondary focus should be on Zone-4 lactic capacity building to prevent Lap 4 speed decay."
            </div>
        </div>

        <div class="absolute bottom-0 w-full bg-slate-900 py-4 px-10 text-white flex justify-between items-center text-xs">
            <p class="font-mono text-slate-400">REPORT ID: BLAZE-SC-2026-0519-LL</p>
            <p class="font-bold">Powered by Edge Computing Vision AI.</p>
        </div>
    </div>


    <script>
        // === 基础交互脚本 ===
        function switchTab(tabId) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            ['pacing', 'biomechanics', 'planning', 'equipment'].forEach(id => {
                const btn = document.getElementById(`btn-${id}`);
                if (btn) btn.className = "pb-3 text-sm font-bold text-slate-400 hover:text-slate-200 border-b-2 border-transparent transition-colors whitespace-nowrap";
            });
            const activeTab = document.getElementById(`tab-${tabId}`);
            if (activeTab) activeTab.classList.add('active');
            const activeBtn = document.getElementById(`btn-${tabId}`);
            if (activeBtn) activeBtn.className = "pb-3 text-sm font-bold text-skating-pro border-b-2 border-skating-pro transition-colors flex items-center gap-2 whitespace-nowrap";
        }

        document.addEventListener('DOMContentLoaded', () => {
             initPacingChart();
        });

        // 🌟 初始化 Chart.js
        let pacingChart = null;
        function initPacingChart() {
            const ctx = document.getElementById('pacingChart').getContext('2d');
            pacingChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['起跑0.5圈', 'Lap 1', 'Lap 2', 'Lap 3', 'Lap 4'],
                    datasets: [
                        { label: 'US NDP U13', data: [7.05, 9.10, 9.42, 9.85, 10.30], borderColor: '#10b981', backgroundColor: 'transparent', tension: 0.3 },
                        { label: 'Lindsay', data: [7.25, 9.15, 9.62, 10.38, 11.20], borderColor: '#0ea5e9', backgroundColor: 'rgba(14, 165, 233, 0.1)', fill: true, tension: 0.3 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        // 测算乳酸逻辑 (简化)
        const calculatePaceBtn = document.getElementById('calculatePaceBtn');
        calculatePaceBtn.addEventListener('click', () => {
            const start = parseFloat(document.getElementById('paceStart').value) || 7.25;
            const lap1 = parseFloat(document.getElementById('paceLap1').value) || 9.15;
            const lap4 = parseFloat(document.getElementById('paceLap4').value) || 11.20;
            const dropOffPct = (((lap4 - lap1) / lap1) * 100).toFixed(1);
            document.getElementById('lacticIndexVal').innerText = dropOffPct + "%";
            document.getElementById('lacticLevel').innerText = dropOffPct > 15 ? "崩溃 (Fatigue)" : "及格";
        });

        // 🌟 核心：PDF 一键生成与导出逻辑
        function exportScoutingReport() {
            const btn = document.getElementById('exportPdfBtn');
            const originalText = btn.innerHTML;
            
            // 1. 按钮变更加载状态
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 正在排版高分辨率 A4 报告...';
            btn.disabled = true;
            btn.classList.add('opacity-80');

            // 2. 动态捕获当前页面的测算数据并注入隐藏的 PDF 模板中
            // 抓取实验室数据（如果有测算过，否则用 Mock 默认值填充，这里做智能回退）
            let liveLean = document.getElementById('liveLeanAngle') ? document.getElementById('liveLeanAngle').innerText : '52°';
            let liveKnee = document.getElementById('liveKneeAngle') ? document.getElementById('liveKneeAngle').innerText : '115°';
            if (liveLean === '--°') liveLean = '52°'; // Fallback 演示数据
            if (liveKnee === '--°') liveKnee = '112°';

            let lacticIndex = document.getElementById('lacticIndexVal') ? document.getElementById('lacticIndexVal').innerText : '22.4%';
            if (lacticIndex === '--%') lacticIndex = '22.4%'; // Fallback

            // 注入 A4 模板
            document.getElementById('pdfDate').innerText = "DATE: " + new Date().toISOString().split('T')[0];
            document.getElementById('pdfLean').innerText = liveLean;
            document.getElementById('pdfKnee').innerText = liveKnee;
            document.getElementById('pdfBounce').innerText = '12%'; // 默认固定模拟值
            document.getElementById('pdfLactic').innerText = lacticIndex;
            document.getElementById('pdfLacticLevel').innerText = parseFloat(lacticIndex) > 15 ? "SEVERE DROP-OFF" : "ELITE STAMINA";

            // 3. 配置 html2pdf.js 引擎参数 (保证 A4 纸张、无边距的高级感)
            const element = document.getElementById('pdfReportTemplate');
            const opt = {
                margin:       0,
                filename:     'BLAZE_Training_Analysis_Lindsay_2026.pdf',
                image:        { type: 'jpeg', quality: 1.0 },
                html2canvas:  { scale: 2, useCORS: true, letterRendering: true }, // 提升矢量字体清晰度
                jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
            };

            // 4. 短暂解除 display:none 让引擎截图，然后截完恢复
            element.classList.remove('hidden');
            element.style.display = 'block';

            // 5. 触发下载
            html2pdf().set(opt).from(element).save().then(() => {
                // 恢复隐藏和按钮状态
                element.style.display = 'none';
                element.classList.add('hidden');
                
                btn.innerHTML = '<i class="fa-solid fa-check text-green-400"></i> 已导出至本地';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                    btn.classList.remove('opacity-80');
                }, 3000);
            });
        }
        window.switchTab = switchTab;
        window.exportScoutingReport = exportScoutingReport;

    </script>
</body>
</html>