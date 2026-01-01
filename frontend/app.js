
const pantallaInicio = document.getElementById("pantalla-inicio");
const seccionLogin = document.getElementById("seccion-login");
const seccionRegistro = document.getElementById("seccion-registro");

const btnMostrarLogin = document.getElementById("btn-mostrar-login");
const btnMostrarRegistro = document.getElementById("btn-mostrar-registro");
const btnVolverDeLoginAInicio = document.getElementById("btn-volver-de-login-a-inicio");
const btnVolverDeRegistroAInicio = document.getElementById("btn-volver-de-registro-a-inicio");


btnMostrarLogin.addEventListener('click', () => {
    pantallaInicio.classList.add('oculto')
    seccionRegistro.classList.add('oculto')
    seccionLogin.classList.remove('oculto')
})

btnMostrarRegistro.addEventListener('click', () => {
    pantallaInicio.classList.add('oculto')
    seccionLogin.classList.add('oculto')
    seccionRegistro.classList.remove('oculto')
})

btnVolverDeLoginAInicio.addEventListener('click', () => {
    seccionRegistro.classList.add('oculto')
    seccionLogin.classList.add('oculto')
    pantallaInicio.classList.remove('oculto')

    document.getElementById("login-email").value = "";
    document.getElementById("login-password").value = "";
})

btnVolverDeRegistroAInicio.addEventListener('click', () => {
    seccionLogin.classList.add('oculto')
    seccionRegistro.classList.add('oculto')
    pantallaInicio.classList.remove('oculto')

    document.getElementById("registro-email").value = "";
    document.getElementById("registro-password").value = "";
    document.getElementById("registro-nombre").value = "";
})


const formLogin = document.getElementById("form-login") 

//Sirve para evitar que el formulario recargue la página al enviarse
formLogin.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value //Obtengo el valor del campo email
    const password = document.getElementById("login-password").value //Obtengo el valor del campo password
    
    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => {
        // Si la respuesta es exitosa (status 200-299), la tratamos como JSON
        if (response.ok) {
            return response.json();
        } else {
            // Si hay error (401, 404, etc.), la tratamos como texto
            return response.text();
        }
    })
    .then(datos => {
        // Verificamos si es el objeto de éxito
        if (datos.mensaje === "Bienvenido") {
            alert("¡Hola " + datos.nombre + "! Has iniciado sesión.");
            
            //Ocultamos login y mostramos inicio
            seccionLogin.classList.add('oculto');
            pantallaInicio.classList.remove('oculto');
            
            //Limpiar los campos del formulario
            document.getElementById("login-email").value = "";
            document.getElementById("login-password").value = "";
        } else {
            // Si no, es un mensaje de error (ej: "Contraseña incorrecta")
            alert(datos);
        }
    })
    .catch(error => {
        console.error("Error en la petición:", error);
        alert("Hubo un problema de conexión.");
    });
});

const formRegister = document.getElementById("form-registro")

formRegister.addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = document.getElementById("registro-nombre").value
    const email = document.getElementById("registro-email").value
    const password = document.getElementById("registro-password").value

        //Envio los datos del registro al servidor
    fetch('/registrar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({nombre, email, password})
        })

        .then(response => {
            if(response.ok){
                response.text().then(mensaje => { alert(mensaje)})
                
                document.getElementById("registro-email").value = "";
                document.getElementById("registro-password").value = "";
                document.getElementById("registro-nombre").value = "";

                seccionLogin.classList.add("oculto")
                seccionRegistro.classList.add("oculto")
                pantallaInicio.classList.remove("oculto")
            }
            else{
                response.text().then(mensaje => {alert(mensaje)})
            }
    });
})