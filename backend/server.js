const express = require('express'); //Importo express, sirve para crear el servidor
const app = express(); //Inicializo express, ahora app tiene todas las funcionalidades de express
const sql = require('mssql'); //Para conectarme a SQL Server
const bcrypt = require('bcrypt'); //Importo bcrypt, sirve para hashear contraseñas
const path = require('path'); //Para manejar rutas de archivos

app.use(express.json()); //Middleware, permite que el servidor entienda los datos JSON que le envío
app.use(express.static(path.join(__dirname, '../frontend'))); //Sirve para que el servidor pueda entregar los archivos estáticos (html, css, js) del frontend


//-------- CONFIGURACIÓN DE LA BASE DE DATOS -----------------------------

const config = {
    user: 'admin_canchita',
    password: '46652130Tomi',
    server: 'localhost',
    port: 63801,
    database: 'sistemaTurnos',
    options: {
        trustServerCertificate: true,
        encrypt: false
    }
};

// --- CONEXIÓN ---
sql.connect(config)
    .then(resultado => {
        pool = resultado
        console.log('¡Conexión a SQL Server exitosa! 🟢');

        // Encendemos el servidor web
        app.listen(3000, () => {
            console.log('Servidor escuchando en el puerto 3000');
        });
    })
    .catch(err => {
        console.error('Error al conectar a la base de datos 🔴:', err);
    });

//---------------------------------------------------------------------------------------------------------

//Variables Globales
let pool;
const reservas = []; //Base de datos provisoria
let contadorDeId = 0;


//Para ver los horarios
app.get('/horarios', async (req, res) => {

    const fechaConsultada = req.query.fecha;
    const horarioConsultado = req.query.horario;

    const request = await pool.request();

    request.input("fecha", sql.Date, fechaConsultada)
    request.input("horario", sql.VarChar, horarioConsultado)

    const validar = await request.query("SELECT * FROM dbo.reservas WHERE fechaReserva = @fecha AND horarioElegido = @horario");

    if (validar.recordset.length > 0) {
        return res.status(409).send("Turno ocupado")
    }
    else {
        res.status(200).send("Turno disponible")
    }
})


//Para reservar el turno
app.post('/reservar', async (req, res) => {

    const { nombre, fecha, horario } = req.body;

    if (!nombre || !fecha || !horario) {
        res.status(400).send('Faltan datos para procesar la reserva');
        return;
    }

    const request = new sql.Request(); //Sirve para hacer consultas a la base de datos

    request.input("fecha", sql.Date, req.body.fecha);
    request.input("horario", sql.VarChar, req.body.horario);

    const validarTurno = await request.query("SELECT * FROM dbo.reservas WHERE fechaReserva = @fecha AND horarioElegido = @horario");



    if (validarTurno.recordset.length > 0) {
        return res.status(409).send("Turno ocupado")
    }
    else {
        request.input("nombre", sql.VarChar, req.body.nombre);

        await request.query("INSERT INTO dbo.reservas (nombreCliente, fechaReserva, horarioElegido) VALUES (@nombre, @fecha, @horario)")
        res.send("El turno se guardó correctamente")
    }
})

//Para registrar usuario
app.post("/registrar", async (req, res) => {
    const { email, password, nombre } = req.body; //Obtengo los datos del cuerpo de la petición

    try {
        //Preparamos la conexión y la petición
        const request = new sql.Request();

        request.input('email', sql.VarChar, email);
        //Le pregunto a la BD si ya conoce el email
        const resultadoBusqueda = await request.query('SELECT * FROM dbo.usuarios WHERE email = @email')

        if (!nombre || !email || !password) {
            return res.status(400).send("Faltan datos para registrarse")
        }

        //Verifico si encontré a alguien
        if (resultadoBusqueda.recordset.length > 0) {
            return res.status(409).send("Usuario ya registrado")
        }
        else {
            const passwordEncriptada = await bcrypt.hash(password, 10); //Hasheo la contraseña, el 10 es la cantidad de rondas de encriptacion

            //Asignamos los parámetros (seguridad contra hackers), el de email esta arriba porque lo necesito para saber si la BD lo tiene guardado
            request.input('nombre', sql.VarChar, nombre);
            request.input('password', sql.VarChar, passwordEncriptada);
            request.input('rol', sql.VarChar, 'usuario');

            await request.query('INSERT INTO dbo.usuarios (nombre, email, password, rol) VALUES (@nombre, @email, @password, @rol)');
            res.send(`Te has registrado correctamente con el email ${email}`)
        }

    } catch (err) {
        //Si el email ya existe o hay un error, SQL me avisa
        console.error(err);
        res.status(409).send("Error al registrar usuario (probablemente el email ya existe)");
    }
});


//Para loguear usuario
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send("Faltan datos para iniciar sesión")
    }

    try {
        const request = new sql.Request();
        request.input('email', sql.VarChar, email);

        const validacion = await request.query('SELECT * FROM dbo.usuarios WHERE email = @email')

        if (validacion.recordset.length === 0) {
            return res.status(404).send("Email no encontrado")
        }
        else {
            const usuario = validacion.recordset[0] //Obtengo el primer (y único) resultado de la consulta
            const passwordEnBD = usuario.password; //Obtengo la contraseña hasheada que está en la BD

            const coincidenLasContraseñas = await bcrypt.compare(password, passwordEnBD)

            if (coincidenLasContraseñas === true) {
                res.json({
                    mensaje: "Bienvenido",
                    nombre: usuario.nombre,
                    rol: usuario.rol
                })
            }
            else {
                res.status(401).send("Usuario o contraseña incorrecta")
            }
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Error del servidor al intentar iniciar sesión");
    }
})

app.get('/ver-reservas', async (req, res) => {
    const nombre = req.query.nombre
    
    try{
    const request = new sql.Request();
    request.input('nombreCliente', sql.VarChar, nombre);

    const mostrar = await request.query("SELECT * FROM dbo.reservas WHERE nombreCliente = @nombreCliente")

    if (mostrar.recordset.length > 0) {
        return res.status(200).send(mostrar.recordset)
    }
    else {
        res.status(409).send("No hay turnos reservados")
    }
    } catch (err) {
        console.error(err);
        res.status(500).send("Error del servidor al intentar ver las reservas");
    }
})


//Para dar de baja el turno
app.delete('/cancelar/:id', (req, res) => {
    const idParaBorrar = req.params.id;
    const indice = reservas.findIndex(reserva => reserva.id == idParaBorrar); //Busco el indice del elemento a borrar

    if (indice !== -1) {
        reservas.splice(indice, 1); //Elimino el elemento del array
        res.send(`Reserva numero ${idParaBorrar} cancelada correctamente`);
    }
    else {
        res.status(404).send("No se encontró una reserva con ese ID");
    }
})

//req = request, solicitud
//res = response, respuesta

//Uso req.body para recibir datos en POST
//Uso req.query para recibir datos en GET
//Uso req.params para recibir datos en DELETE