import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, Shield, Server, Search, Bot, Play, Pause, RefreshCw, Radio, HardDrive, Network, UserCheck, Wifi, CheckCircle2, Terminal, Wrench, Power, AlertTriangle, Link2, Bug, Clock } from 'lucide-react';
import { generateMockRequest } from './constants';
import { RequestLog, IdpHealth } from './types';
import { TraceTimeline } from './components/TraceTimeline';
import { SystemHealthCard } from './components/SystemHealthCard';
import { analyzeLogWithGemini } from './services/geminiService';
import { DevOpsModal } from './components/DevOpsModal';

const MAX_LOGS = 50;

// Visual Component for the Process Flow (Framework)
const ProcessFlowDiagram = () => (
    <div className="flex items-center justify-between px-4 py-4 bg-slate-800/50 rounded-lg mb-6 border border-slate-700/50 overflow-x-auto">
        <div className="flex flex-col items-center min-w-[80px]">
            <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center border border-blue-500/30 mb-2">
                <Network className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-[10px] text-slate-400 text-center font-bold">1. 接入</span>
        </div>
        <div className="h-0.5 w-8 bg-slate-700"></div>
        <div className="flex flex-col items-center min-w-[80px]">
             <div className="w-10 h-10 rounded-full bg-indigo-900/50 flex items-center justify-center border border-indigo-500/30 mb-2">
                <UserCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-[10px] text-slate-400 text-center font-bold">2. 保卫处(LDAP)</span>
        </div>
        <div className="h-0.5 w-8 bg-slate-700"></div>
        <div className="flex flex-col items-center min-w-[80px]">
             <div className="w-10 h-10 rounded-full bg-amber-900/50 flex items-center justify-center border border-amber-500/30 mb-2">
                <HardDrive className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-[10px] text-slate-400 text-center font-bold">3. 档案室(DB)</span>
        </div>
        <div className="h-0.5 w-8 bg-slate-700"></div>
         <div className="flex flex-col items-center min-w-[80px]">
             <div className="w-10 h-10 rounded-full bg-emerald-900/50 flex items-center justify-center border border-emerald-500/30 mb-2">
                <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-[10px] text-slate-400 text-center font-bold">4. 盖章放行</span>
        </div>
    </div>
);

const App: React.FC = () => {
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<RequestLog | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isRealData, setIsRealData] = useState(false); // Mode switch
  const [apiError, setApiError] = useState<string | null>(null);
  const [isDevOpsModalOpen, setIsDevOpsModalOpen] = useState(false);
  const [hostname, setHostname] = useState('idp.yzu.edu.cn');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [dataAge, setDataAge] = useState<string>('0s');
  
  // Restart Simulation State
  const [isRestarting, setIsRestarting] = useState(false);
  
  // State for Chinese metrics
  const [systemHealth, setSystemHealth] = useState<IdpHealth>({
    jettyThreads: { name: 'Jetty 线程数', value: 24, max: 200, unit: '个', status: 'healthy' },
    heapMemory: { name: 'JVM 堆内存', value: 512, max: 2048, unit: 'MB', status: 'healthy' },
    ldapLatency: { name: 'LDAP 延迟', value: 12, max: 100, unit: 'ms', status: 'healthy' },
    dbPool: { name: 'DB 连接池', value: 5, max: 50, unit: '个', status: 'healthy' }
  });
  
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update "Data Age" every second
  useEffect(() => {
    const timer = setInterval(() => {
        const diff = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000);
        setDataAge(`${diff}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  // Detect environment on mount
  useEffect(() => {
    const currentHost = window.location.hostname;
    if (currentHost !== 'localhost' && !currentHost.includes('webcontainer')) {
        setHostname(currentHost);
    }
    
    // Check if API is available
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
         if (data.status === 'ok') {
            setIsRealData(true);
            if (data.file_exists === false) {
                setApiError("日志文件未找到");
            }
         }
      })
      .catch(() => {
         console.log("Backend API not found, defaulting to simulation mode.");
         setIsRealData(false);
      });
  }, []);

  const fetchRealLogs = useCallback(async () => {
     try {
        const res = await fetch('/api/logs');
        if (!res.ok) throw new Error("API Error");
        const data = await res.json();
        
        // Transform incoming data if needed
        const transformedLogs = data.map((l: any) => ({
            ...l,
            timestamp: new Date(l.timestamp) 
        }));
        
        setLogs(prev => {
            // Check if we have new logs
            const prevIds = prev.map(p => p.id).join(',');
            const newIds = transformedLogs.map((l: any) => l.id).join(',');
            
            if (prevIds !== newIds) {
               return transformedLogs;
            }
            return prev;
        });
        
        setApiError(null);
        setLastUpdated(new Date());

     } catch (err) {
        setApiError("后端连接中断");
     }
  }, []);

  const addSimulatedLog = useCallback(() => {
    const newLog = generateMockRequest();
    setLogs(prev => {
      const updated = [newLog, ...prev];
      return updated.slice(0, MAX_LOGS);
    });
    setLastUpdated(new Date());
  }, []);

  const updateMetrics = useCallback(() => {
    setSystemHealth(prev => ({
      jettyThreads: { ...prev.jettyThreads, value: Math.max(10, Math.min(190, prev.jettyThreads.value + (Math.random() * 10 - 5) )) | 0 },
      heapMemory: { ...prev.heapMemory, value: Math.max(200, Math.min(1900, prev.heapMemory.value + (Math.random() * 100 - 40))) | 0 },
      ldapLatency: { ...prev.ldapLatency, value: Math.max(2, Math.min(150, prev.ldapLatency.value + (Math.random() * 20 - 10))) | 0 },
      dbPool: { ...prev.dbPool, value: Math.max(1, Math.min(45, prev.dbPool.value + (Math.random() * 4 - 2))) | 0 }
    }));
  }, []);

  const tick = useCallback(() => {
     if (isPaused || isRestarting) return;
     
     if (isRealData) {
        fetchRealLogs();
     } else {
        addSimulatedLog();
     }
     updateMetrics();
  }, [isPaused, isRestarting, isRealData, fetchRealLogs, addSimulatedLog, updateMetrics]);

  useEffect(() => {
    intervalRef.current = setInterval(tick, 2500); 
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tick]);

  const handleAnalyze = async () => {
    if (!selectedLog) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    const result = await analyzeLogWithGemini(selectedLog);
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  const handleRestartJetty = () => {
    if (!confirm("⚠️ 警告：确定要强制重启 Jetty 服务吗？\n\n这会导致正在进行的认证中断，预计耗时 5-10 秒。")) return;
    
    setIsRestarting(true);
    setIsPaused(true);
    
    setSystemHealth(prev => ({
        jettyThreads: { ...prev.jettyThreads, value: 0 },
        heapMemory: { ...prev.heapMemory, value: 0 },
        ldapLatency: { ...prev.ldapLatency, value: 0 },
        dbPool: { ...prev.dbPool, value: 0 }
    }));

    const restartLog: RequestLog = {
        id: 'SYS-RESTART',
        timestamp: new Date(),
        spEntityId: 'SYSTEM',
        userPrincipal: 'root',
        status: 'FAILURE',
        durationMs: 0,
        steps: [],
        rawLogs: ['*** SYSTEM SHUTDOWN INITIATED ***', 'Stopping Jetty Service...', 'Cleaning up threads...'],
        auditLog: 'SYSTEM_EVENT|STOP|INITIATED_BY_ADMIN'
    };
    setLogs(prev => [restartLog, ...prev]);

    setTimeout(() => {
        setIsRestarting(false);
        setIsPaused(false);
        setSystemHealth(prev => ({
            jettyThreads: { ...prev.jettyThreads, value: 24 },
            heapMemory: { ...prev.heapMemory, value: 512 },
            ldapLatency: { ...prev.ldapLatency, value: 12 },
            dbPool: { ...prev.dbPool, value: 5 }
        }));
    }, 5000);
  };

  const chartData = logs.slice(0, 20).reverse().map(l => ({
    time: l.timestamp.toLocaleTimeString().split(' ')[0],
    duration: l.durationMs,
    status: l.status === 'SUCCESS' ? 1 : 0
  }));

  return (
    <Router>
      <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl z-20">
          <div className="p-6 border-b border-slate-800 bg-slate-900">
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <Shield className="w-6 h-6" />
              <h1 className="text-lg font-bold tracking-tight text-white">CARSI 认证监控</h1>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-1 truncate" title={hostname}>{hostname}</p>
            <div className="flex items-center gap-1.5 mt-2">
                <div className={`w-2 h-2 rounded-full ${isRestarting ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`}></div>
                <span className={`text-xs font-medium ${isRestarting ? 'text-rose-400' : 'text-slate-400'}`}>
                   {isRestarting ? '正在重启...' : '运行状态: 正常'}
                </span>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-900/20 border border-indigo-500/20 rounded-lg text-indigo-300 font-medium transition-colors">
              <Activity className="w-5 h-5" />
              实时全景监控
            </button>
            <div className="px-4 py-3 text-slate-600 flex items-center gap-3 cursor-not-allowed hover:bg-slate-800/50 rounded-lg transition-colors">
              <Server className="w-5 h-5" />
              服务器拓扑图
            </div>
            
            <div className="my-4 border-t border-slate-800" />
            
            <button 
                onClick={() => setIsDevOpsModalOpen(true)}
                className="w-full px-4 py-3 text-slate-400 hover:text-white flex items-center gap-3 hover:bg-slate-800 rounded-lg transition-colors group"
            >
                <Wrench className="w-5 h-5 group-hover:text-amber-400 transition-colors" />
                <div className="text-left">
                    <div className="text-sm font-medium">运维工具箱</div>
                    <div className="text-[10px] text-slate-600 group-hover:text-slate-500">部署脚本 / 还原点</div>
                </div>
            </button>

             <div className="mt-4 pt-4 border-t border-slate-800">
                <p className="px-4 text-[10px] text-slate-600 uppercase font-bold mb-2">紧急操作</p>
                <button 
                    onClick={handleRestartJetty}
                    disabled={isRestarting}
                    className="w-full px-4 py-3 text-rose-400 hover:text-rose-100 bg-rose-950/20 hover:bg-rose-900/40 border border-rose-900/30 flex items-center gap-3 rounded-lg transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Power className={`w-5 h-5 ${isRestarting ? 'animate-spin' : ''}`} />
                    <div className="text-left">
                        <div className="text-sm font-bold">重启 Jetty 服务</div>
                        <div className="text-[10px] text-rose-500/70 group-hover:text-rose-300">SystemCTL Restart</div>
                    </div>
                </button>
            </div>
          </nav>

          <div className="p-4 border-t border-slate-800">
             <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                   <div className={`w-2 h-2 rounded-full ${isRestarting ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`}></div>
                   <span className="text-xs font-semibold text-slate-300">
                        {isRestarting ? '服务停止' : 'Shibboleth 运行中'}
                   </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono flex flex-col gap-1">
                   <span>PID: {isRestarting ? '---' : '4829'} (Jetty)</span>
                   <span>Uptime: {isRestarting ? '0m' : '45d 12h 30m'}</span>
                </div>
             </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
          
          {isRestarting && (
            <div className="absolute top-0 left-0 right-0 z-50 bg-rose-600 text-white px-4 py-2 flex items-center justify-center gap-3 shadow-xl animate-fade-in">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
                <span className="font-bold">系统正在重启中，服务暂时不可用... (预计剩余 3s)</span>
            </div>
          )}

          {/* Header */}
          <header className="h-16 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between px-6 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-4">
               <h2 className="text-lg font-medium text-slate-100">身份认证流量态势感知</h2>
               <div className="flex items-center gap-2">
                    <span 
                        onClick={() => !isRealData && setIsRealData(true)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-all ${isRealData ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}
                    >
                        {isRealData ? <Link2 className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                        {isRealData ? `LIVE DATA: ${hostname}` : `演示模式: ${hostname}`}
                    </span>
                    {isRealData && (
                        <a 
                            href="/api/debug" 
                            target="_blank" 
                            className="px-2 py-0.5 rounded text-[10px] font-bold border bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 flex items-center gap-1"
                            title="查看后端原始日志内容"
                        >
                            <Bug className="w-3 h-3" />
                            Debug
                        </a>
                    )}
               </div>
               
               {apiError && isRealData && (
                  <span className="text-xs text-rose-500 flex items-center gap-1 bg-rose-950/30 px-2 py-0.5 rounded border border-rose-900">
                    <AlertTriangle className="w-3 h-3" />
                    {apiError}
                  </span>
               )}
            </div>
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 rounded text-xs text-slate-400 border border-slate-700">
                  <Clock className="w-3 h-3" />
                  <span className="font-mono">
                    更新: {lastUpdated.toLocaleTimeString()} <span className="text-slate-600">({dataAge})</span>
                  </span>
               </div>
               <button 
                onClick={() => setIsPaused(!isPaused)}
                disabled={isRestarting}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-colors ${isPaused ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
               >
                 {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                 {isPaused ? '恢复滚动' : '暂停画面'}
               </button>
            </div>
          </header>

          <div className={`flex-1 overflow-auto p-6 space-y-6 transition-opacity duration-500 ${isRestarting ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <SystemHealthCard metric={systemHealth.jettyThreads} iconType="server" />
              <SystemHealthCard metric={systemHealth.heapMemory} iconType="activity" />
              <SystemHealthCard metric={systemHealth.ldapLatency} iconType="db" />
              <SystemHealthCard metric={systemHealth.dbPool} iconType="cpu" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-320px)]">
              
              <div className="lg:col-span-2 flex flex-col space-y-6 h-full">
                
                <div className="h-48 bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col shadow-lg">
                   <h3 className="text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2">
                       <Activity className="w-4 h-4" />
                       认证响应时间 (ms)
                   </h3>
                   <div className="flex-1">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="time" stroke="#64748b" fontSize={10} tick={{fill: '#64748b'}} />
                          <YAxis stroke="#64748b" fontSize={10} tick={{fill: '#64748b'}} unit="ms" />
                          <Tooltip 
                            contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9'}} 
                            itemStyle={{color: '#34d399'}}
                            labelStyle={{color: '#94a3b8'}}
                          />
                          <Line type="monotone" dataKey="duration" stroke="#34d399" strokeWidth={2} dot={false} activeDot={{r: 4, fill: '#fff'}} />
                        </LineChart>
                     </ResponsiveContainer>
                   </div>
                </div>

                <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg flex flex-col overflow-hidden shadow-lg">
                  <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/90 flex justify-between items-center backdrop-blur">
                    <h3 className="text-sm font-bold text-slate-300">实时请求流水 (Shibboleth Access)</h3>
                    <span className="text-xs text-slate-500 font-mono hidden md:inline-block">Port 8443 Traffic</span>
                  </div>
                  <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead className="bg-slate-950/80 text-slate-500 sticky top-0 text-xs uppercase font-semibold tracking-wider z-10 backdrop-blur-sm">
                        <tr>
                          <th className="px-4 py-3">时间</th>
                          <th className="px-4 py-3">状态</th>
                          <th className="px-4 py-3">来源服务 (SP)</th>
                          <th className="px-4 py-3">用户</th>
                          <th className="px-4 py-3 text-right">耗时</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {logs.map((log) => (
                          <tr 
                            key={log.id} 
                            onClick={() => {
                              setSelectedLog(log);
                              setAnalysisResult(null); 
                            }}
                            className={`cursor-pointer group transition-all duration-200 ${selectedLog?.id === log.id ? 'bg-blue-900/20 border-l-2 border-blue-500' : 'hover:bg-slate-800 border-l-2 border-transparent'}`}
                          >
                            <td className="px-4 py-3 font-mono text-slate-400 text-xs whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                                log.status === 'SUCCESS' ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-400' : 
                                log.status === 'FAILURE' ? 'bg-rose-950/50 border-rose-500/30 text-rose-400' : 'bg-amber-950/50 border-amber-500/30 text-amber-400'
                              }`}>
                                {log.status === 'SUCCESS' ? '成功' : '失败'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-300 max-w-[180px] truncate text-xs font-medium" title={log.spEntityId}>
                              {log.spEntityId}
                            </td>
                            <td className="px-4 py-3 text-slate-400 text-xs font-mono">
                              {log.userPrincipal || '-'}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-500 font-mono text-xs">
                              {log.durationMs}ms
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 overflow-y-auto shadow-xl flex flex-col h-full">
                {selectedLog ? (
                  <div className="animate-fade-in space-y-6">
                     
                     <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">系统流程概览</h4>
                        <ProcessFlowDiagram />
                     </div>

                     <TraceTimeline request={selectedLog} />
                     
                     <div className="pt-6 border-t border-slate-800 mt-6 pb-6">
                        <div className="flex items-center justify-between mb-3">
                           <div className="flex items-center gap-2 text-indigo-400">
                              <Bot className="w-5 h-5" />
                              <h3 className="font-bold text-sm">AI 智能诊断 (Gemini 2.5)</h3>
                           </div>
                           {!analysisResult && (
                             <button 
                               onClick={handleAnalyze}
                               disabled={isAnalyzing}
                               className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded transition-colors disabled:opacity-50 flex items-center gap-1 shadow-lg shadow-indigo-900/20"
                             >
                               {isAnalyzing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                               {isAnalyzing ? '分析中...' : '一键诊断'}
                             </button>
                           )}
                        </div>
                        
                        {analysisResult && (
                          <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/30 rounded-lg p-4 text-sm text-indigo-100 leading-relaxed animate-fade-in shadow-inner">
                            <p className="whitespace-pre-line font-light">{analysisResult}</p>
                            <button 
                              onClick={() => setAnalysisResult(null)}
                              className="text-xs text-indigo-400 hover:text-indigo-300 mt-3 underline"
                            >
                              清除分析结果
                            </button>
                          </div>
                        )}
                        {!analysisResult && !isAnalyzing && (
                          <p className="text-xs text-slate-500 italic border-l-2 border-slate-700 pl-3">
                            点击“一键诊断”，AI 将自动分析日志错误原因，并给出修复建议（例如检查 LDAP 连接池或更新元数据）。
                          </p>
                        )}
                     </div>

                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                    <div className="p-6 bg-slate-800/50 rounded-full">
                        <Search className="w-12 h-12 opacity-50 text-slate-400" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium text-slate-300">请选择左侧列表中的请求</p>
                        <p className="text-xs text-slate-500 mt-1">查看完整的“借条/保卫处”流程追踪</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
          
          <DevOpsModal 
            isOpen={isDevOpsModalOpen} 
            onClose={() => setIsDevOpsModalOpen(false)} 
          />

        </main>
      </div>
    </Router>
  );
};

export default App;