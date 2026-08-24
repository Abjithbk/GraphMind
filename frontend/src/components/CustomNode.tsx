import {Handle,Position,NodeProps} from '@xyflow/react'
import {FileText,FlaskConical,Award} from 'lucide-react'

export const CustomNode = ({data,selected}:NodeProps) => {
  // Determine styling based on node type
  let bgClass = 'bg-zinc-800 border-zinc-700 text-zinc-200';
  let icon = <FileText className="h-5 w-5 text-zinc-400" />;

  if (data.type === 'paper') {
    bgClass = 'bg-indigo-500/10 border-indigo-500/50 text-indigo-100';
    icon = <FileText className="h-5 w-5 text-indigo-400" />;
  } else if (data.type === 'method') {
    bgClass = 'bg-emerald-500/10 border-emerald-500/50 text-emerald-100';
    icon = <FlaskConical className="h-5 w-5 text-emerald-400" />;
  } else if (data.type === 'claim') {
    bgClass = 'bg-amber-500/10 border-amber-500/50 text-amber-100';
    icon = <Award className="h-5 w-5 text-amber-400" />;
  }
  return (
    <div className={`px-4 py-3 border shadow-xl backdrop-blur-md flex items-center gap-3 rounded-xl transition-all ${bgClass} ${selected ? 'ring-2 ring-primary scale-105' : ''}`}>
      {/* Top connection handle */}
      <Handle type="target" position={Position.Top} className="!bg-zinc-500 !border-0 !w-2 !h-2" />
      
      {icon}
      <span className="text-sm font-medium whitespace-nowrap">{data.label as string}</span>
      
      {/* Bottom connection handle */}
      <Handle type="source" position={Position.Bottom} className="!bg-zinc-500 !border-0 !w-2 !h-2" />
    </div>
  );
}

