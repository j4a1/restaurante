const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');  // Importar CORS

const app = express();

// Habilitar CORS para todas las solicitudes
app.use(cors());

// Habilitar el middleware para analizar JSON en el cuerpo de las solicitudes
app.use(bodyParser.json());

// Configurar el pool de conexiones con MySQL
const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'nueva'
});

// Endpoint para crear una nueva orden
app.post('/crear-orden', async (req, res) => {
    const { fecha_orden, propina_orden, hora_de_cobro_orden, atendio_orden } = req.body;

    try {
        // Inserta la nueva orden en la base de datos
        const [result] = await pool.query(
            'INSERT INTO orden (fecha_orden, propina_orden, hora_de_cobro_orden, atendio_orden) VALUES (?, ?, ?, ?)',
            [fecha_orden, propina_orden, hora_de_cobro_orden, atendio_orden]
        );

        // Recupera el número de orden generado
        const [rows] = await pool.query(
            'SELECT numero_orden FROM orden WHERE numero_orden = ?',
            [result.insertId]
        );

        // Devuelve el número de orden y un mensaje de éxito
        res.json({ numero_orden: rows[0].numero_orden, message: 'Orden creada exitosamente' });
    } catch (error) {
        console.error('Error al crear la orden:', error);
        res.status(500).json({ error: 'Error al crear la orden' });
    }
});

// Endpoint para obtener los detalles de una factura
app.get('/factura', async (req, res) => {
    const { numero_orden } = req.query;

    if (!numero_orden) {
        return res.status(400).json({ error: 'Número de orden no proporcionado' });
    }

    try {
        // Recupera los detalles de la orden
        const [rows] = await pool.query(
            'SELECT fecha_orden, propina_orden, hora_de_cobro_orden, atendio_orden FROM orden WHERE numero_orden = ?',
            [numero_orden]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Orden no encontrada' });
        }

        // Devuelve los detalles de la orden
        res.json({
            numero_orden,
            ...rows[0]
        });
    } catch (error) {
        console.error('Error al obtener la factura:', error);
        res.status(500).json({ error: 'Error al obtener la factura' });
    }
});

// Endpoint para obtener detalles de una orden con productos y otras relaciones
app.get('/detalle-orden', async (req, res) => {
    const { numero_orden } = req.query;

    if (!numero_orden) {
        return res.status(400).json({ error: 'Número de orden no proporcionado' });
    }

    try {
        // Consulta con JOINs para obtener detalles completos
        const [rows] = await pool.query(
            `SELECT 
                mesero.nombre_mesero AS 'Mesero',
                orden.numero_orden AS 'Orden',
                producto.nombre_producto AS 'Producto',
                producto.precio_producto AS 'Precio',
                categorias.categorias_categorias AS 'Categoria',
                tipo_de_producto.tipo_de_producto_tipo_de_producto AS 'Tipo'
            FROM orden
            INNER JOIN mesero ON orden.id_mesero1 = mesero.id_mesero
            INNER JOIN orden_producto ON orden.numero_orden = orden_producto.id_orden
            INNER JOIN producto ON orden_producto.id_producto2 = producto.id_producto
            INNER JOIN categorias ON producto.id_categorias1 = categorias.id_categorias
            INNER JOIN tipo_de_producto ON categorias.id_tipo_de_producto1 = tipo_de_producto.id_tipo_de_producto
            WHERE orden.numero_orden = 1`,
            [numero_orden]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Detalles de la orden no encontrados' });
        }

        // Devuelve los detalles completos de la orden
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener los detalles de la orden:', error);
        res.status(500).json({ error: 'Error al obtener los detalles de la orden' });
    }
});

// Iniciar el servidor
app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});
