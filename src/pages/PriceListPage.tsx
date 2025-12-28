
import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PriceListPage: React.FC = () => {
    const services = [
        { name: 'Pneumatiky - alternativní rozměry', price: '5 000 Kč' },
        { name: 'Výměna motoru', price: '5 000 Kč' },
        { name: 'Výměna nápravy', price: '25 000 Kč' },
        { name: 'Sedadla spolujezdce', price: '5 000 Kč' },
        { name: 'Chybné nebo chybějící údaje v TP', price: '5 000 Kč' },
        { name: 'Dovoz, ZTP', price: '10 000 Kč' },
        { name: 'Výměna kabiny - změna typu', price: '5 000 Kč' },
        { name: 'Počet míst k sezení', price: '5 000 Kč' },
        { name: 'Nový štítek vozidla', price: '2 500 Kč' },
        { name: 'Náhradní VIN', price: '2 500 Kč' },
        { name: 'Řízení', price: '15 000 Kč' },
        { name: 'Ostatní', price: 'individuální' },
    ];

    return (
        <div className="min-h-screen bg-white text-black font-sans flex flex-col">
            <Header />
            <main className="container mx-auto p-4 md:p-8 flex-grow">
                <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg border border-gray-200">
                    <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">Ceník služeb</h2>
                    <p className="text-center text-sm text-brand-gray mb-8">Uvedené ceny jsou bez DPH.</p>
                    
                    <div className="overflow-x-auto">
                        <ul className="divide-y divide-gray-200">
                            {services.map((service, index) => (
                                <li key={index} className="p-4 flex justify-between items-start hover:bg-gray-50 transition-colors duration-200">
                                    <span className="text-gray-800 mr-4">{service.name}</span>
                                    <span className="font-semibold text-brand-red whitespace-nowrap flex-shrink-0">{service.price}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default PriceListPage;
