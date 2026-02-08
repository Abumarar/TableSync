import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
    const [tableId, setTableId] = useState('');
    const navigate = useNavigate();

    const handleScan = (e) => {
        e.preventDefault();
        if (tableId) {
            navigate(`/menu/${tableId}`);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">TableSync</h1>
                <p className="mb-6 text-gray-600">Simulate scanning a QR code by entering a table number.</p>

                <form onSubmit={handleScan} className="flex flex-col gap-4">
                    <input
                        type="number"
                        placeholder="Enter Table Number (e.g. 1)"
                        value={tableId}
                        onChange={(e) => setTableId(e.target.value)}
                        className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        min="1"
                    />
                    <button
                        type="submit"
                        className="bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                        Scan QR Code
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Landing;
