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
    .then(pool => {
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
const reservas = []; //Base de datos provisoria
let contadorDeId = 0;


//Para ver los horarios
app.get('/horarios', (req, res) => {

    const horarioConsultado = req.query.horarioElegido;
    const fechaConsultada = req.query.fechaReserva;

    for(const ElementoIndividual of reservas){
        if (horarioConsultado === ElementoIndividual.horarioElegido && fechaConsultada === ElementoIndividual.fechaReserva){
            res.status(409).send('No hay horarios disponibles para la fecha seleccionada');
            return;
        }
    }
    res.status(200).send("El turno está disponible");
})


//Para reservar el turno
app.post('/reservar', (req, res) => {
    //Recibo nombre, fecha y horario
    const nombreCliente = req.body.nombre;
    const fechaReserva = req.body.fecha;
    const horarioElegido = req.body.horario;

    if (!nombreCliente || !fechaReserva || !horarioElegido) {
        res.status(400).send('Faltan datos para procesar la reserva');
        return;
    }

    for(const ElementoIndividual of reservas){
        if (fechaReserva === ElementoIndividual.fechaReserva && horarioElegido === ElementoIndividual.horarioElegido){
            res.status(409).send('El turno no está disponible, por favor elija otro horario');
            return;
        }
    }
    //Si el turno esta disponible, le asigno un ID y lo guardo en la "base de datos"
    contadorDeId ++;
    
    reservas.push({nombreCliente, fechaReserva, horarioElegido, id: contadorDeId});
    
    res.send(`Reserva confirmada para ${nombreCliente} a las ${horarioElegido}`)
})

//Para registrar usuario
app.post("/registrar", async (req, res) => {
    const {email, password, nombre} = req.body; //Obtengo los datos del cuerpo de la petición
       
    try {
        //Preparamos la conexión y la petición
        const request = new sql.Request();
        
        request.input('email', sql.VarChar, email);
        //Le pregunto a la BD si ya conoce el email
        const resultadoBusqueda = await request.query('SELECT * FROM dbo.usuarios WHERE email = @email')

        //Verifico si encontré a alguien
        if(resultadoBusqueda.recordset.length > 0){
            return res.status(409).send("Usuario ya registrado")
        }
        else{
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
    const {email, password} = req.body;
    
    try{
        const request = new sql.Request();
        request.input('email', sql.VarChar, email);

        const validacion = await request.query('SELECT * FROM dbo.usuarios WHERE email = @email')
        
        if(validacion.recordset.length === 0){
            return res.status(404).send("Email no encontrado")
        } 
        else{
            const usuario = validacion.recordset[0] //Obtengo el primer (y único) resultado de la consulta
            const passwordEnBD = usuario.password; //Obtengo la contraseña hasheada que está en la BD

            const coincidenLasContraseñas = await bcrypt.compare(password, passwordEnBD)

            if(coincidenLasContraseñas === true){
                res.json({
                    mensaje: "Bienvenido", 
                    nombre: usuario.nombre, 
                    rol: usuario.rol})
            }
            else{
                res.status(401).send("Usuario o contraseña incorrecta")
            }
        }
    } catch(err){
        console.error(err);
        res.status(500).send("Error del servidor al intentar iniciar sesión");
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
    else{
        res.status(404).send("No se encontró una reserva con ese ID");
    }
})

//req = request, solicitud
//res = response, respuesta

//Uso req.body para recibir datos en POST
//Uso req.query para recibir datos en GET
//Uso req.params para recibir datos en DELETE