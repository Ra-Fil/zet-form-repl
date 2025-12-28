
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-header-black text-white">
      <div className="container mx-auto py-8 px-4">
        <div>
          <h3 className="text-lg font-bold mb-4">Něco nefunguje?</h3>
          <ul className="space-y-2 text-gray-400">
            <li><a href="mailto:pomuzu@vam.cz" className="hover:text-white transition-colors">pomuzu@vam.cz</a></li>
            <li><a href="tel:+420123456789" className="hover:text-white transition-colors">tel:+ 123 456 789</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
