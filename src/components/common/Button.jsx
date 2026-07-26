import React from 'react';

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    ...props
}) {
    const baseClasses = 'inline-flex items-center justify-center font-bold tracking-wide rounded border-2 transition-all active:scale-[0.98] outline-none focus:ring-4 focus:ring-offset-2';

    const variants = {
        primary: 'bg-kanban-amber border-kanban-amber text-slate-950 hover:bg-yellow-400 hover:border-yellow-400 focus:ring-kanban-amber/40',
        secondary: 'bg-slate-200 border-slate-300 text-slate-800 hover:bg-slate-300 hover:border-slate-400',
        danger: 'bg-red-600 border-red-600 text-white hover:bg-red-700 hover:border-red-700',
        success: 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 hover:border-emerald-700',
        outline: 'border-slate-400 text-slate-700 hover:bg-slate-100 focus:ring-slate-300/40',
    };

    const sizes = {
        sm: 'px-4 py-2 text-xs',
        md: 'px-5 py-3 text-sm',
        lg: 'px-8 py-4 text-base',
    };

    const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

    return (
        <button className={classes} {...props}>
            {children}
        </button>
    );
}
