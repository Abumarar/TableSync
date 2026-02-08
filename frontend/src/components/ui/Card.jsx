import React from 'react';

const Card = ({ children, className = '', hover = false, ...props }) => {
    return (
        <div
            className={`bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden ${hover ? 'transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1' : ''} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
