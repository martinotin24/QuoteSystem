// 1) Importar módulos
const express = require('express');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const session = require('express-session');
const fs = require('fs');
const cors = require('cors');

// 2) Crear la app
const app = express();
app.use(express.json());

// 2.1) Habilitar CORS para permitir peticiones desde el origen de tu front-end
app.use(cors({
    origin: "http://localhost:5500",  // Cambia esto si usas otra URL (por ejemplo, "http://localhost:5500")
    credentials: true
}));

// 3) Configurar la sesión, asegurando que la cookie no requiera HTTPS en desarrollo
app.use(session({
    secret: 'tu-secreto-aqui',  // Cambia esto por una cadena secreta más segura
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }  // secure: false en desarrollo (HTTP)
}));

// 4) Configurar la conexión a MySQL con SSL
const dbConfig = {
    host: 'YOUR HOST',
    port: 25060,
    user: 'YOUR USER ',
    password: 'HERE YOUR PASSWORD',
    database: 'YOUR DATABASE',
    ssl: {
        ca: fs.readFileSync('./certs/ca-certificate.crt')
    }
};

// 5) Ruta de login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }
        const user = rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }
        req.session.userId = user.id;
        return res.json({ message: 'Autenticación exitosa' });
    } catch (error) {
        console.error("Error en /login:", error);
        return res.status(500).json({ message: 'Error del servidor' });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

// 6) Ruta de dashboard para verificar la sesión
app.get('/dashboard', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'No autorizado' });
    }
    res.json({ message: 'Bienvenido a tu dashboard' });
});

// 7) Ruta para cerrar sesión
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Error al cerrar sesión:", err);
            return res.status(500).json({ message: 'Error al cerrar sesión' });
        }
        res.json({ message: 'Sesión cerrada' });
    });
});

// 8) Iniciar el servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
});
