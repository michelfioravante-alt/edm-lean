import React from 'react';

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    ...props
}) {
    const baseClasses = 'inline-flex items-center justify-center font-semibold tracking-wide rounded-[7px] border transition-all active:scale-[0.98] outline-none disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer';

    const variants = {
        primary: 'bg-[#D97D3D] border-[#D97D3D] text-[#111318] hover:bg-[#c46d32] hover:border-[#c46d32]',
        secondary: 'bg-[#1F232B] border-[#333844] text-[#E7E9ED] hover:bg-[#262A33] hover:border-[#424856]',
        ghost: 'bg-transparent border-[#333844] text-[#7B808F] hover:text-[#E7E9ED] hover:bg-[#1F232B]',
        outline: 'bg-transparent border-[#333844] text-[#7B808F] hover:text-[#E7E9ED] hover:bg-[#1F232B]',
        danger: 'bg-[#C85558] border-[#C85558] text-white hover:bg-[#b04548]',
        success: 'bg-[#4A9D74] border-[#4A9D74] text-[#111318] hover:bg-[#3d8763]',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-xs sm:text-sm',
        lg: 'px-6 py-2.5 text-sm sm:text-base',
    };

    const classes = `${baseClasses} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`;

    return (
        <button className={classes} {...props}>
            {children}
        </button>
    );
}
