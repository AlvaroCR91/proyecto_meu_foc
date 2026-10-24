-- Tablón de anuncios (menús, arroces, noticias). Tabla aparte de `eventos`
-- a propósito: las consultas de eventos no filtran por tipo.
--   vigencia 'permanente': sin fecha de fin (fecha_inicio y fecha_fin NULL)
--   vigencia 'temporal':   del fecha_inicio al fecha_fin
--   vigencia 'dia':        un día concreto (fecha_inicio = fecha_fin)
-- Se aplica con: sudo mysql restaurante_eventos < migrations/002_anuncios.sql
CREATE TABLE IF NOT EXISTS anuncios (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titulo             VARCHAR(200) NOT NULL,
  descripcion        TEXT NOT NULL,
  imagen_placeholder VARCHAR(500) NULL,
  vigencia           ENUM('permanente', 'temporal', 'dia') NOT NULL,
  fecha_inicio       DATE NULL,
  fecha_fin          DATE NULL,
  creado_en          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vigencia_fin (vigencia, fecha_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
