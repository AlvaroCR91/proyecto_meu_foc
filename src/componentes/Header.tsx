import React from 'react';
import './Header.css';
import logo from '../img/logo.png';

const Header: React.FC = () => {
  return (
    <header className="header">
      <img src={logo} alt="Logo del Restaurante" className="logo-restaurante" />
        <nav className="nav">
          <a href="#imagenes">Imágenes</a>
          <a href="#menu">Menú</a>
          <a href="#reservar">Reservar</a>
          <a href="#sobre-nosotros">Sobre Nosotros</a>
          <a href="#contacto">Contáctenos</a>
        </nav>
    </header>
  );
};

export default Header;
