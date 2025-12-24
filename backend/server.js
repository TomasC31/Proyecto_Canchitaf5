const express = require('express'); //Importo express, sirve para crear el servidor
const app = express(); //Inicializo express, ahora app tiene todas las funcionalidades de express

app.use(express.json()); //Middleware, permite que el servidor entienda los datos JSON que le envío

const reservas = []; //Base de datos provisoria

contadorDeId = 0;

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

app.listen(3000, () => {
    console.log('Servidor escuchando en el puerto 3000');
});

//req = request, solicitud
//res = response, respuesta

//Uso req.body para recibir datos en POST
//Uso req.query para recibir datos en GET
//Uso req.params para recibir datos en DELETE