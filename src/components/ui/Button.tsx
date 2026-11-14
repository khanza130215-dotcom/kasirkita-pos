import { cn } from '../../utils/cn';

export const Button = ({ children, className, disabled, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button 
    disabled={disabled}
    className={cn(
      "min-h-[44px] px-3.5 py-2 rounded-xl font-medium text-[12.5px] border border-transparent transition-all active:scale-[0.98] disabled:opacity-45 disabled:active:scale-100 disabled:cursor-not-allowed cursor-pointer",
      "bg-[#0866E9] hover:bg-[#0758CC] text-white shadow-2xs",
      className
    )} 
    {...props}
  >
    {children}
  </button>
);
