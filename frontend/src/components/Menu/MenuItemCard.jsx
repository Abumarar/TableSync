import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Plus, Minus, ShoppingBag } from 'lucide-react';

const MenuItemCard = ({ product, onAdd }) => {
    const [quantity, setQuantity] = useState(1);
    const [isHovered, setIsHovered] = useState(false);

    const handleIncrement = () => setQuantity(prev => prev + 1);
    const handleDecrement = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

    const handleAdd = () => {
        onAdd(product, quantity);
        setQuantity(1);
    };

    // Placeholder image logic if standard image is missing or broken (optional enhancement)
    // For now assuming product.image is a valid URL or we use a placeholder
    const imageUrl = product.image || 'https://via.placeholder.com/400x300?text=Delicious+Food';
    // In a real app, I'd suggest a better placeholder from assets

    return (
        <Card
            className="flex flex-col h-full"
            hover={true}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative h-48 overflow-hidden bg-gray-100">
                <img
                    src={imageUrl}
                    alt={product.name}
                    className={`w-full h-full object-cover transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`}
                />
                {product.is_popular && (
                    <div className="absolute top-2 left-2">
                        <Badge variant="hot">Popular</Badge>
                    </div>
                )}
                {product.is_spicy && (
                    <div className="absolute top-2 right-2">
                        <Badge variant="warning">Spicy</Badge>
                    </div>
                )}
            </div>

            <div className="p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-heading font-bold text-lg text-gray-900 leading-tight">{product.name}</h3>
                    <span className="font-bold text-primary text-lg ml-2">${product.price}</span>
                </div>

                <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-grow">{product.description}</p>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                    <div className="flex items-center bg-gray-50 rounded-lg p-1">
                        <button
                            onClick={handleDecrement}
                            className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-gray-500 transition-all disabled:opacity-50"
                            disabled={quantity <= 1}
                        >
                            <Minus size={14} />
                        </button>
                        <span className="w-8 text-center font-bold text-sm">{quantity}</span>
                        <button
                            onClick={handleIncrement}
                            className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-gray-500 transition-all"
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    <Button
                        size="sm"
                        onClick={handleAdd}
                        icon={ShoppingBag}
                    >
                        Add
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default MenuItemCard;
