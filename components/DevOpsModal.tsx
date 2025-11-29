import React from 'react';
import { X, Download, Terminal, Package } from 'lucide-react';

interface DevOpsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DevOpsModal: React.FC<DevOpsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2 text-indigo-400">
            <Package className="w-5 h-5" />
            <h3 className="font-bold">DevOps 运维工具箱</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              离线安装包 (Offline Installer)
            </h4>
            <p className="text-xs text-slate-500">
              用于在无外网环境（如机房内网）快速部署监控探针。
            </p>
            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 font-mono text-xs text-slate-400 overflow-x-auto">
              <code>
                # 下载安装包<br/>
                wget https://repo.carsi.edu.cn/monitor/deploy_package.zip<br/><br/>
                # 解压并安装<br/>
                unzip deploy_package.zip && cd carsi-monitor<br/>
                chmod +x install.sh && ./install.sh
              </code>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400" />
              配置文件还原 (Snapshot)
            </h4>
            <div className="grid gap-3">
              {[
                { name: 'shibboleth-idp-config-v4.bak', date: '2023-11-20 14:00', size: '45KB' },
                { name: 'jetty-ssl-context.xml.bak', date: '2023-11-15 09:30', size: '12KB' },
              ].map((file, i) => (
                 <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded border border-slate-700/50 hover:border-slate-600 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-indigo-900/30 flex items-center justify-center text-indigo-400 font-bold text-xs">XML</div>
                        <div>
                            <div className="text-sm text-slate-300">{file.name}</div>
                            <div className="text-[10px] text-slate-500">{file.date} • {file.size}</div>
                        </div>
                    </div>
                    <button className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors">
                        <Download className="w-4 h-4" />
                    </button>
                 </div>
              ))}
            </div>
          </div>

        </div>
        
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors">
                关闭
            </button>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded flex items-center gap-2 transition-colors">
                <Download className="w-3 h-3" />
                下载全部配置
            </button>
        </div>
      </div>
    </div>
  );
};