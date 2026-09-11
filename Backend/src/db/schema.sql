CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    precio NUMERIC(10, 2) NOT NULL,
    stock_total INTEGER NOT NULL DEFAULT 0,
    stock_reservado INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT stock_reservado_valido CHECK (stock_reservado <= stock_total)
);

CREATE TABLE reservas (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES productos(id),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'activa'
        CHECK (estado IN ('activa', 'confirmada', 'liberada', 'expirada')),
    creada_en TIMESTAMP NOT NULL DEFAULT NOW(),
    expirada_en TIMESTAMP NOT NULL
);

--Productos de prueba
INSERT INTO productos (nombre, precio, stock_total, stock_reservado) VALUES
    ('Arroz 1kg', 3500, 50, 0),
    ('Leche entera 1L', 4200, 30, 0),
    ('Aceite vegetal 900ml', 8900, 15, 0);