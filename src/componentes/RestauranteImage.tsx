import React from 'react';
import './RestauranteImage.css';

type Props = {
  src: string;
  alt: string;
  onClick: () => void;
};

const RestauranteImage: React.FC<Props> = ({ src, alt, onClick }) => {
  return (
    <img
      src={src}
      alt={alt}
      className="restaurant-image"
      onClick={onClick}
    />
  );
};

export default RestauranteImage;
