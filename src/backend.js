const baseApi = 'http://localhost:5150/historico';
const apiKeyTomorrowIo = 'cNFbHg6R2vSCjmsJuA0k3ife1Sfjki8J';

function verificarSiLaCiudadExiste(nombreCiudad) {
    return coordenadasCiudades.some(coordenada => coordenada.ciudad === nombreCiudad);
}

function obtenerPronosticoDeUnaCiudad(nombreCiudad) {
    if (nombreCiudad.length === 0) {
        alert("Introduzca una ciudad o población.");
    } else {
        const apiKey = apiKeyTomorrowIo;
        const ciudadObj = coordenadasCiudades.find(element => element.ciudad === nombreCiudad);

        if (ciudadObj !== undefined) {
            const url = `https://api.tomorrow.io/v4/weather/forecast?location=${ciudadObj.longitud},${ciudadObj.latitud}&apikey=${apiKey}`;
            console.log('url:', url)
    
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('La respuesta de la red no fue correcta');
                    }
                    return response.json(); // Convierte la respuesta a JSON
                })
                .then(data => {
                    let daily = data.timelines.daily;
                    let datosDeHoy = daily[0];
                    guardarDatosEnTablaHistorico(datosDeHoy, ciudadObj);
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert("Ocurrió un error obteniendo la información por favor intente de nuevo.")
                });
        } else {
            alert(`La ciudad/población '${nombreCiudad}' no existe o revise que la ortografía este correcta.`);
        }
        
    }
}

// Guarda los datos de la busqueda
function guardarDatosEnTablaHistorico(datosDeHoy, ciudadObj) {
    const fecha = obtenerFecha(datosDeHoy.time)
    const values = datosDeHoy.values
    const ciudad = ciudadObj.ciudad;

    buscarCiudadYFechaEnBD(ciudad, fecha)
        .then(data => {
            if (data.length > 0) {
                alert(`Los datos para la ciudad/población '${ciudad}' ya fueron actualizados previamente.`);
                return;
            }

            const url = baseApi;
            const bodyRequest = {
                gestion: fecha.anio,
                mes: fecha.mes,
                dia: fecha.dia,
                ciudad_poblacion: ciudad,
                longitud: ciudadObj.longitud,
                latitud: ciudadObj.latitud,
                temperatura_maxima: values.temperatureMax,
                humedad_relativa_maxima: values.humidityMax,
                presion_maxima: values.pressureSurfaceLevelMax,
            };

            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bodyRequest)
            })
            .then(response => {
                if (!response.ok) {
                    alert("Ocurrió un error obteniendo la información por favor intente de nuevo.")
                }
                alert(`Los datos para la ciudad/población ${ciudadObj.ciudad} fueron actualizados correctamente.`);
                return response.json();
            });

        })
        .then(response => {
            if (response && !response.ok) {
                alert("Ocurrió un error obteniendo la información por favor intente de nuevo.");
            }
            return response ? response.json() : null;
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function obtenerFecha(fechaHora) {
    const fecha = new Date(fechaHora);
    const anio = fecha.getFullYear();
    const mes = fecha.getMonth() + 1; // Los meses van de 0 a 11, así que se suma 1.
    const dia = fecha.getDate();

    return {
        anio: anio,
        mes: mes,
        dia: dia
    }
}

// Funcion que trae los 10 ultimos registros por ciudad
function obtenerDiezUltimosDatosDeCiudad(ciudad) {
    if (ciudad.length === 0) {
        alert("Introduzca una ciudad o población.");
    } else {
        if (verificarSiLaCiudadExiste(ciudad)) {
            const url = `${baseApi}?ciudad_poblacion=${ciudad}&_page=1&_limit=10&_sort=id&_order=desc`;
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        alert("Ocurrió un error obteniendo la información por favor intente de nuevo.");
                    }
                    return response.json(); // Parsea la respuesta a JSON
                })
                .then(data => {
                    if (data.length > 0) {
                        llenarValoresTabla(data); // la funcion se encarga de llenar los valores de la tabla que esta en el frontend                
                    } else {
                        alert(`No se encontraron registros en la tabla historico para la ciudad/población '${ciudad}'`);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert("Ocurrió un error obteniendo la información por favor intente de nuevo.");
                });
        } else {
            alert(`La ciudad/población '${ciudad}' no existe o revise que la ortografía este correcta.`);
        }
    }
}


function buscarCiudadYFechaEnBD(ciudad, fecha) {
    const urlConsulta = `${baseApi}?ciudad_poblacion=${ciudad}&gestion=${fecha.anio}&mes=${fecha.mes}&dia=${fecha.dia}`;
    console.log('buscar API: ', urlConsulta)
    return fetch(urlConsulta)
        .then(response => {
            if (!response.ok) {
                throw new Error('La respuesta de la red no fue correcta');
            }
            return response.json(); // Parsea la respuesta a JSON
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// Funcion que llena la cabecera y el cuerpo de la tabla
function llenarValoresTabla(data){
    var tablaCuerpo = document.getElementById('tablaCuerpo'); // Agarrar tabla

    // Eliminar el contenido anterior de la tabla
    while(tablaCuerpo.rows.length > 0) {
        tablaCuerpo.deleteRow(0);
    }

    /* Llena los nombres de la cabecera */
    llenarCabeceraTabla(tablaCuerpo);

    /* Llena el cuerpo de la tabla */
    llenarCuerpoTabla(tablaCuerpo, data);
}

function llenarCabeceraTabla(tablaCuerpo){
    var cabecera = document.createElement('tr');

    var celdaCabeceraGestion = document.createElement('th');
    celdaCabeceraGestion.appendChild(document.createTextNode('Gestión'));
    cabecera.appendChild(celdaCabeceraGestion);

    var celdaCabeceraMes = document.createElement('th');
    celdaCabeceraMes.appendChild(document.createTextNode('Mes'));
    cabecera.appendChild(celdaCabeceraMes);

    var celdaCabeceraDia = document.createElement('th');
    celdaCabeceraDia.appendChild(document.createTextNode('Día'));
    cabecera.appendChild(celdaCabeceraDia);

    var celdaCabeceraCiudad = document.createElement('th');
    celdaCabeceraCiudad.appendChild(document.createTextNode('Ciudad o población'));
    cabecera.appendChild(celdaCabeceraCiudad);

    var celdaCabeceraLongitud = document.createElement('th');
    celdaCabeceraLongitud.appendChild(document.createTextNode('Longitud'));
    cabecera.appendChild(celdaCabeceraLongitud);

    var celdaCabeceraLatitud = document.createElement('th');
    celdaCabeceraLatitud.appendChild(document.createTextNode('Latitud'));
    cabecera.appendChild(celdaCabeceraLatitud);

    var celdaCabeceraTemperatura = document.createElement('th');
    celdaCabeceraTemperatura.appendChild(document.createTextNode('Temperatura Máxima'));
    celdaCabeceraTemperatura.classList.add('valores-tabla');
    cabecera.appendChild(celdaCabeceraTemperatura);

    var celdaCabeceraHumedad = document.createElement('th');
    celdaCabeceraHumedad.appendChild(document.createTextNode('Humedad Relativa Máxima'));
    celdaCabeceraHumedad.classList.add('valores-tabla');
    cabecera.appendChild(celdaCabeceraHumedad);

    var celdaCabeceraPresion = document.createElement('th');
    celdaCabeceraPresion.appendChild(document.createTextNode('Presión Máxima'));
    celdaCabeceraPresion.classList.add('valores-tabla');
    cabecera.appendChild(celdaCabeceraPresion);

    tablaCuerpo.appendChild(cabecera);
}

function llenarCuerpoTabla(tablaCuerpo, data){
    /*Todo el for es para llenar los 10 registros de la tabla*/
    for(var i = 0; i < data.length; i++) {
        var fila = document.createElement('tr');
        
        var celdaGestion = document.createElement('td');
        celdaGestion.appendChild(document.createTextNode(data[i].gestion));
        fila.appendChild(celdaGestion);

        var celdaMes = document.createElement('td');
        celdaMes.appendChild(document.createTextNode(data[i].mes));
        fila.appendChild(celdaMes);

        var celdaDia = document.createElement('td');
        celdaDia.appendChild(document.createTextNode(data[i].dia));
        fila.appendChild(celdaDia);

        var celdaCiudadPoblacion = document.createElement('td');
        celdaCiudadPoblacion.appendChild(document.createTextNode(data[i].ciudad_poblacion));
        fila.appendChild(celdaCiudadPoblacion);

        var celdaLongitud = document.createElement('td');
        celdaLongitud.appendChild(document.createTextNode(data[i].longitud));
        fila.appendChild(celdaLongitud);

        var celdaLatitud = document.createElement('td');
        celdaLatitud.appendChild(document.createTextNode(data[i].latitud));
        fila.appendChild(celdaLatitud);

        var celdaTemperaturaMaxima = document.createElement('td');
        celdaTemperaturaMaxima.appendChild(document.createTextNode(data[i].temperatura_maxima));
        fila.appendChild(celdaTemperaturaMaxima);

        var celdaHumedadMaxima = document.createElement('td');
        celdaHumedadMaxima.appendChild(document.createTextNode(data[i].humedad_relativa_maxima));
        fila.appendChild(celdaHumedadMaxima);

        var celdaPresionMaxima = document.createElement('td');
        celdaPresionMaxima.appendChild(document.createTextNode(data[i].presion_maxima));
        fila.appendChild(celdaPresionMaxima);
        
        tablaCuerpo.appendChild(fila);
    }
}



const coordenadasCiudades = [
    {
        id: 1,
        ciudad: 'Pailon - Pozo del Tigre (GPRS)',
        longitud: "-61.995189",
        latitud: "-17.588916",
    },
    {
        id: 2,
        ciudad: 'La Paz',
        longitud: "-68.1500000",
        latitud: "-16.5000000",
    }
];
