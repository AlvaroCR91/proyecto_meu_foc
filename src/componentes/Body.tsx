import React, { useState, useEffect } from 'react';
import RestauranteImage from './RestauranteImage';
import img1 from '../img/restaurante1.png';
import img2 from '../img/restaurante2.png';
import img3 from '../img/restaurante3.png';
import './Body.css';

const Body: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const openImage = (src: string) => {
    setSelectedImage(src);
  };

  const closeImage = () => {
    setSelectedImage(null);
  };

  // Evitar scroll cuando lightbox abierto
  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [selectedImage]);

  return (
    <main className="body">
      <section className="descripcion">
        <h2>Bienvenidos a El Meu Foc Restaurante</h2>
        <p>
          En El Meu Foc encontrarás un ambiente cálido y acogedor donde las llamas de nuestra cocina tradicional cobran vida.
          Disfruta de nuestros platos elaborados con ingredientes locales y mucho cariño.
        </p>
      </section>

      <section className="imagenes">
        <h3 id="imagenes">Imágenes del Restaurante</h3>
        <div className="galeria">
          <RestauranteImage src={img1} alt="Interior del restaurante" onClick={() => openImage(img1)} />
          <RestauranteImage src={img2} alt="Mesa decorada" onClick={() => openImage(img2)} />
          <RestauranteImage src={img3} alt="Entrada del local" onClick={() => openImage(img3)} />
        </div>
      </section>

      {selectedImage && (
        <div className="lightbox" onClick={closeImage}>
          <img src={selectedImage} alt="Ampliada" className="lightbox-img" />
        </div>
      )}
    </main>
  );
};

export default Body;
