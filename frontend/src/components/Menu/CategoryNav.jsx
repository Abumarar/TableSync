import React, { useRef, useEffect } from 'react';

const CategoryNav = ({ categories, activeCategory, onSelectCategory }) => {
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current && activeCategory) {
            const activeElement = scrollRef.current.querySelector(`[data-category="${activeCategory}"]`);
            if (activeElement) {
                activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [activeCategory]);

    return (
        <div className="sticky top-0 z-20 bg-neutral-50/95 backdrop-blur-sm border-b border-gray-200 py-3 shadow-sm">
            <div
                ref={scrollRef}
                className="flex overflow-x-auto gap-3 px-4 no-scrollbar pb-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {categories.map((category) => (
                    <button
                        key={category.id}
                        data-category={category.id}
                        onClick={() => onSelectCategory(category.id)}
                        className={`
                            whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200
                            ${activeCategory === category.id
                                ? 'bg-primary text-white shadow-md transform scale-105'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                            }
                        `}
                    >
                        {category.name}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CategoryNav;
