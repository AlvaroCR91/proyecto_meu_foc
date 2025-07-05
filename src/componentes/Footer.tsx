import React from 'react';
import './Footer.css';
import mapa from '../img/mapa.jpg'; // Usa tu imagen de mapa aquí

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <section id="sobre-nosotros" className="sobre-nosotros">
        <h3>Sobre Nosotros</h3>
        <p>
          El Meu Foc Restaurante nació del amor por la cocina tradicional y el calor del hogar. Fundado por apasionados chefs locales,
          nuestro objetivo es brindar experiencias únicas llenas de sabor y cercanía. Somos un espacio familiar, acogedor, y
          orgullosamente pet-friendly, para que vengas con tu amigo peludo y disfrutes juntos.
        </p>
      </section>

      <section id="contacto" className="contacto">
        <h3>Contáctenos</h3>
        <div className="contacto-contenido">
          <div className="info">
            <p><strong>Teléfono:</strong> +34 123 456 789</p>
            <p><strong>Dirección:</strong> Calle del Fuego 123, Valencia</p>
            <p><strong>Email:</strong> contacto@elmeufoc.com</p>
          </div>
          <div className="mapa">
            <img src={mapa} alt="Mapa de ubicación" />
          </div>
        </div>
      </section>
    </footer>
  );
};

export default Footer;
