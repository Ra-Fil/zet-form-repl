import React, { useState } from 'react';
import logoZetor from '../assets/images/logo-zetor.svg'; 

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isAuthenticated = sessionStorage.getItem('isAdminAuthenticated') === 'true';
  const currentPath = window.location.pathname;

  const handleNavigation = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('locationchange'));
    setIsMenuOpen(false);
  };
  
  const handleLogout = () => {
    sessionStorage.removeItem('isAdminAuthenticated');
    handleNavigation('/');
  };

  const navLinks = [
    { label: 'Formulář', path: '/' },
    { label: 'Ceník', path: '/cenik' },
    { label: isAuthenticated ? 'Administrace' : 'Admin', path: '/admin' },
  ];

  const HamburgerIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
    </svg>
  );

  const CloseIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
    </svg>
  );

  const renderNavLink = (link: { label: string; path: string; }, isMobile: boolean = false) => {
    const isActive = currentPath === link.path;
      
    return (
      <button
        key={link.label}
        onClick={() => handleNavigation(link.path)}
        className={`relative group pb-1 hover:text-white transition-colors duration-300 ${isMobile ? 'w-full text-left py-2' : ''}`}
        aria-label={`Přejít na ${link.label.toLowerCase()}`}
        aria-current={isActive ? 'page' : undefined}
      >
        {link.label}
        <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-brand-red transform transition-transform duration-300 ease-out ${isMobile ? 'hidden' : ''} ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
      </button>
    );
  };

  return (
    <header className="bg-header-black shadow-md relative">
      <div className="container mx-auto flex justify-between items-center px-4">
        <div 
          className="flex items-center cursor-pointer h-16 bg-[#f12443] px-6"
          onClick={() => handleNavigation('/')}
        >
          <img
            src={logoZetor}
            alt="Logo Zetor"
            className="h-8 w-auto"
          />
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center space-x-4 text-slate-300 font-semibold p-4">
            {navLinks.map(link => renderNavLink(link))}
            {isAuthenticated && (
              <>
                <span className="text-gray-500 select-none" aria-hidden="true">|</span>
                <button
                  onClick={handleLogout}
                  className="relative group pb-1 hover:text-white transition-colors duration-300"
                  aria-label="Odhlásit se"
                >
                  Odhlásit se
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-red transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></span>
                </button>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center p-4">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-300 hover:text-white focus:outline-none" aria-label="Otevřít menu">
              {isMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
            </button>
          </div>
        </div>
      </div>

      
      {/* Mobile Menu Panel */}
      {isMenuOpen && (
        <nav className="md:hidden bg-header-black" id="mobile-menu">
          <div className="container mx-auto px-4 pt-2 pb-4 flex flex-col items-start space-y-2 text-slate-300 font-semibold">
            {navLinks.map(link => renderNavLink(link, true))}
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="relative group pb-1 hover:text-white transition-colors duration-300 w-full text-left py-2"
                aria-label="Odhlásit se"
              >
                Odhlásit se
              </button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
