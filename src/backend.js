const baseApi = 'https://backend-sistema-actualizacion.onrender.com/historico';
/*const baseApi = 'http://localhost:5150/historico';*/
const apiKeyTomorrowIo = 'Us1m9a3bnaRY1fg6KpyK6kNEwQUiLJ36';  /*cNFbHg6R2vSCjmsJuA0k3ife1Sfjki8J*/
const loadingDiv = document.querySelector('.loading');

function verificarSiLaCiudadExiste(nombreCiudad) {
    return coordenadasCiudades.some(coordenada => coordenada.ciudad === nombreCiudad);
}

function obtenerPronosticoDeUnaCiudad(nombreCiudad) {
    if (nombreCiudad.length === 0) {
        alert("Introduzca una ciudad o población.");
    } else {
        const apiKey = apiKeyTomorrowIo;   
        const ciudadObjeto = coordenadasCiudades.find(element => element.ciudad === nombreCiudad);  /*busca el nombre de la ciudad ingresado por el usuario*/ 

        if (ciudadObjeto !== undefined) {
            loadingDiv.style.display = 'flex'; // muestra el loading
            const url = `https://api.tomorrow.io/v4/weather/forecast?location=${ciudadObjeto.latitud},${ciudadObjeto.longitud}&apikey=${apiKey}`;
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        console.error('Error');
                    }
                    return response.json(); // Convierte la respuesta a JSON
                })
                .then(data => {
                    let daily = data.timelines.daily; // camino daily
                    let datosDeHoy = daily[0];
                    guardarDatosEnTablaHistorico(datosDeHoy, ciudadObjeto);
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert("Ocurrió un error obteniendo la información por favor intente de nuevo.")
                }).finally(() => {
                    // Oculta el div de carga 
                    loadingDiv.style.display = 'none';
                });
        } else {
            alert(`La ciudad/población '${nombreCiudad}' no existe o revise que la ortografía este correcta.`);
            // Oculta el div de carga 
            loadingDiv.style.display = 'none';
        }
    }
}

// Guarda los datos de la busqueda- arma la tabla historico
function guardarDatosEnTablaHistorico(datosDeHoy, ciudadObj) {   
    const fecha = obtenerFecha(datosDeHoy.time);
    const values = datosDeHoy.values;
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

            fetch(url, {    /*fetch = POSTMAN*/ 
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
                alert(`Los datos para la ciudad/población '${ciudadObj.ciudad}' fueron actualizados correctamente.`);
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
            loadingDiv.style.display = 'flex'; // muestra el loading
            
            const url = `${baseApi}?ciudad_poblacion=${ciudad}&_page=1&_limit=10&_sort=id&_order=desc`;
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        alert("Ocurrió un error obteniendo la información por favor intente de nuevo.");
                    }
                    return response.json(); // convierte la respuesta a JSON
                })
                .then(data => {
                    if (data.length > 0) {
                        llenarValoresTabla(data); // la funcion se encarga de llenar los valores de la tabla que esta en el frontend                
                    } else {
                        alert(`No se encontraron registros en la tabla historico para la ciudad/población '${ciudad}', primero actualice los datos.`);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert("Ocurrió un error obteniendo la información por favor intente de nuevo.");
                }).finally(() => {
                    // Oculta el div de carga 
                    loadingDiv.style.display = 'none';
                });
        } else {
            alert(`La ciudad/población '${ciudad}' no existe o revise que la ortografía este correcta.`);
            loadingDiv.style.display = 'none';
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
            return response.json(); // convierte la respuesta a JSON
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

function llenarValoresSelector(){
    /* Llena los valores del primer selector */
    const datalist1 = document.getElementById('ciudades1');
    for(var i = 0; i < coordenadasCiudades.length; i++) {
        const option = document.createElement('option');
        option.value = coordenadasCiudades[i].ciudad;
        datalist1.appendChild(option);
    };

    /* Llena los valores del segundo selector */
    const datalist2 = document.getElementById('ciudades2');
    for(var i = 0; i < coordenadasCiudades.length; i++) {
        const option = document.createElement('option');
        option.value = coordenadasCiudades[i].ciudad;
        datalist2.appendChild(option);
    };
}

/* Son las latitudes y longitudes de las distintas ciudades y poblaciones  */
const coordenadasCiudades = [
    {
        "id": 1,
        "ciudad": "Abapo",
        "latitud": -18.919833,
        "longitud": -63.404279
    },
    {
        "id": 2,
        "ciudad": "Abra de Napa",
        "latitud": -20.55,
        "longitud": -68.566667
    },
    {
        "id": 3,
        "ciudad": "Acasio",
        "latitud": -18.016667,
        "longitud": -66.083333
    },
    {
        "id": 4,
        "ciudad": "Acasio (GPRS)",
        "latitud": -18.026422,
        "longitud": -66.059418
    },
    {
        "id": 5,
        "ciudad": "Achacachi",
        "latitud": -16.039167,
        "longitud": -68.680556
    },
    {
        "id": 6,
        "ciudad": "Achachicala",
        "latitud": -16.466667,
        "longitud": -68.15
    },
    {
        "id": 7,
        "ciudad": "Achiri",
        "latitud": -17.212557,
        "longitud": -69.002579
    },
    {
        "id": 8,
        "ciudad": "Achocalla",
        "latitud": -16.581111,
        "longitud": -68.160833
    },
    {
        "id": 9,
        "ciudad": "Achumani",
        "latitud": -16.530833,
        "longitud": -68.071389
    },
    {
        "id": 10,
        "ciudad": "Achumani - Franco Boliviano",
        "latitud": -16.532369,
        "longitud": -68.07774
    },
    {
        "id": 11,
        "ciudad": "Actara",
        "latitud": -19.0725,
        "longitud": -65.9617
    },
    {
        "id": 12,
        "ciudad": "Aeropueto Copacabana_M (GPRS)",
        "latitud": -16.187799,
        "longitud": -69.091698
    },
    {
        "id": 13,
        "ciudad": "Agua de Castilla",
        "latitud": -19.7725,
        "longitud": -65.986389
    },
    {
        "id": 14,
        "ciudad": "Aguadas (GPRS)",
        "latitud": -17.15035,
        "longitud": -66.282153
    },
    {
        "id": 15,
        "ciudad": "Aguadas Misicuni",
        "latitud": -17.143333,
        "longitud": -66.277778
    },
    {
        "id": 16,
        "ciudad": "Aguallamaya",
        "latitud": -16.819722,
        "longitud": -68.901111
    },
    {
        "id": 17,
        "ciudad": "Aguaraycito",
        "latitud": -21.39,
        "longitud": -63.412222
    },
    {
        "id": 18,
        "ciudad": "Aguas Calientes_ENFE",
        "latitud": -17.822222,
        "longitud": -66.6125
    },
    {
        "id": 19,
        "ciudad": "Aguayrenda",
        "latitud": -21.833333,
        "longitud": -63.65
    },
    {
        "id": 20,
        "ciudad": "Aguirre",
        "latitud": -17.416667,
        "longitud": -66.133333
    },
    {
        "id": 21,
        "ciudad": "Aimiri",
        "latitud": -19.35,
        "longitud": -63.183333
    },
    {
        "id": 22,
        "ciudad": "Aiquile",
        "latitud": -18.203333,
        "longitud": -65.178056
    },
    {
        "id": 23,
        "ciudad": "Aiquile (GPRS)",
        "latitud": -18.212269,
        "longitud": -65.189345
    },
    {
        "id": 24,
        "ciudad": "Alalay",
        "latitud": -17.75,
        "longitud": -65.683333
    },
    {
        "id": 25,
        "ciudad": "Alalay (GPRS)",
        "latitud": -17.4275,
        "longitud": -66.135803
    },
    {
        "id": 26,
        "ciudad": "Albosa",
        "latitud": -17.5,
        "longitud": -63.166667
    },
    {
        "id": 27,
        "ciudad": "Alcantari",
        "latitud": -19.183333,
        "longitud": -65.120556
    },
    {
        "id": 28,
        "ciudad": "Alcantarí_Aeropuerto",
        "latitud": -19.238333,
        "longitud": -65.149167
    },
    {
        "id": 29,
        "ciudad": "Alcoche",
        "latitud": -15.733333,
        "longitud": -67.666667
    },
    {
        "id": 30,
        "ciudad": "Algarrobillas",
        "latitud": -21.855556,
        "longitud": -63.293889
    },
    {
        "id": 31,
        "ciudad": "Alizos",
        "latitud": -21.816667,
        "longitud": -64.866667
    },
    {
        "id": 32,
        "ciudad": "Alota",
        "latitud": -21.466667,
        "longitud": -67.65
    },
    {
        "id": 33,
        "ciudad": "Alpacoma",
        "latitud": -16.516667,
        "longitud": -68.133333
    },
    {
        "id": 34,
        "ciudad": "Alto Achachicala",
        "latitud": -16.347222,
        "longitud": -68.084722
    },
    {
        "id": 35,
        "ciudad": "Alto Cajas",
        "latitud": -21.3,
        "longitud": -64.466667
    },
    {
        "id": 36,
        "ciudad": "Alto Lima",
        "latitud": -16.483333,
        "longitud": -68.166667
    },
    {
        "id": 37,
        "ciudad": "Alto Lima-D6",
        "latitud": -16.480477,
        "longitud": -68.174747
    },
    {
        "id": 38,
        "ciudad": "Alto Obrajes",
        "latitud": -16.516667,
        "longitud": -68.116667
    },
    {
        "id": 39,
        "ciudad": "Alto Obrajes_Barrio Magisterio",
        "latitud": -16.522952,
        "longitud": -68.100913
    },
    {
        "id": 40,
        "ciudad": "Alto Peñas (GPRS)",
        "latitud": -16.2022,
        "longitud": -68.450302
    },
    {
        "id": 41,
        "ciudad": "Alto Seco",
        "latitud": -18.866667,
        "longitud": -64.066667
    },
    {
        "id": 42,
        "ciudad": "Alto Seguencoma",
        "latitud": -16.533333,
        "longitud": -68.083333
    },
    {
        "id": 43,
        "ciudad": "Alto Villa Copacabana",
        "latitud": -16.316667,
        "longitud": -68.15
    },
    {
        "id": 44,
        "ciudad": "Ampa Ampa",
        "latitud": -20.316667,
        "longitud": -65.4
    },
    {
        "id": 45,
        "ciudad": "Ancoaque",
        "latitud": -15.566667,
        "longitud": -66.95
    },
    {
        "id": 46,
        "ciudad": "Ancohoma",
        "latitud": -15.733333,
        "longitud": -68.5
    },
    {
        "id": 47,
        "ciudad": "Ancoraimes",
        "latitud": -15.898333,
        "longitud": -68.904167
    },
    {
        "id": 48,
        "ciudad": "Andamarca",
        "latitud": -18.771944,
        "longitud": -67.516789
    },
    {
        "id": 49,
        "ciudad": "Angosto del Bala",
        "latitud": -14.548611,
        "longitud": -67.498056
    },
    {
        "id": 50,
        "ciudad": "Angosto Inicua",
        "latitud": -15.316667,
        "longitud": -67.566667
    },
    {
        "id": 51,
        "ciudad": "Angosto Molinero",
        "latitud": -17.983333,
        "longitud": -65.633333
    },
    {
        "id": 52,
        "ciudad": "Angosto Quercano",
        "latitud": -15.35,
        "longitud": -68.166667
    },
    {
        "id": 53,
        "ciudad": "Angostura - SAT",
        "latitud": -21.695801,
        "longitud": -64.600304
    },
    {
        "id": 54,
        "ciudad": "Angostura_sc",
        "latitud": -18.15,
        "longitud": -63.566667
    },
    {
        "id": 55,
        "ciudad": "Antaquilla",
        "latitud": -14.866667,
        "longitud": -69.3
    },
    {
        "id": 56,
        "ciudad": "Antequera (GPRS)",
        "latitud": -18.4811,
        "longitud": -66.843903
    },
    {
        "id": 57,
        "ciudad": "Antequera SAT",
        "latitud": -17.974722,
        "longitud": -67.08
    },
    {
        "id": 58,
        "ciudad": "Anzaldo",
        "latitud": -17.783611,
        "longitud": -65.932778
    },
    {
        "id": 59,
        "ciudad": "Anzaldo_M (GPRS)",
        "latitud": -17.780879,
        "longitud": -65.930702
    },
    {
        "id": 60,
        "ciudad": "Apacheta PTI",
        "latitud": -21.166667,
        "longitud": -67.833333
    },
    {
        "id": 61,
        "ciudad": "Apolo",
        "latitud": -14.7333,
        "longitud": -68.400002
    },
    {
        "id": 62,
        "ciudad": "Apolo Aeropuerto",
        "latitud": -14.732778,
        "longitud": -68.4125
    },
    {
        "id": 63,
        "ciudad": "Apolo SENAMHI",
        "latitud": -14.716667,
        "longitud": -68.516667
    },
    {
        "id": 64,
        "ciudad": "Apolo_M (GPRS)",
        "latitud": -14.679431,
        "longitud": -68.394194
    },
    {
        "id": 65,
        "ciudad": "Araca",
        "latitud": -16.8,
        "longitud": -67.583333
    },
    {
        "id": 66,
        "ciudad": "Arani",
        "latitud": -17.573611,
        "longitud": -65.754444
    },
    {
        "id": 67,
        "ciudad": "Arbieto (GPRS)",
        "latitud": -17.587799,
        "longitud": -66.004402
    },
    {
        "id": 68,
        "ciudad": "Arbieto Aut",
        "latitud": -17.587778,
        "longitud": -66.012222
    },
    {
        "id": 69,
        "ciudad": "Arenales",
        "latitud": -21.683333,
        "longitud": -65.533333
    },
    {
        "id": 70,
        "ciudad": "Aroma (GPRS)",
        "latitud": -19.3227,
        "longitud": -67.3147
    },
    {
        "id": 71,
        "ciudad": "Arpaja Alta",
        "latitud": -20.676944,
        "longitud": -64.948056
    },
    {
        "id": 72,
        "ciudad": "Arque_ENFE",
        "latitud": -17.821944,
        "longitud": -66.403333
    },
    {
        "id": 73,
        "ciudad": "Arquillos",
        "latitud": -19.246389,
        "longitud": -64.378333
    },
    {
        "id": 74,
        "ciudad": "Arrozales - Bermejo",
        "latitud": -22.7125,
        "longitud": -64.291389
    },
    {
        "id": 75,
        "ciudad": "Ascencion de Guarayos",
        "latitud": -15.9153,
        "longitud": -63.169201
    },
    {
        "id": 76,
        "ciudad": "Ascensión de Guarayos Aerop",
        "latitud": -15.915278,
        "longitud": -63.169167
    },
    {
        "id": 77,
        "ciudad": "Aten",
        "latitud": -14.916667,
        "longitud": -68.383333
    },
    {
        "id": 78,
        "ciudad": "Atispaya Maravillas",
        "latitud": -16.71,
        "longitud": -66.75
    },
    {
        "id": 79,
        "ciudad": "Atocha",
        "latitud": -20.933333,
        "longitud": -66.216667
    },
    {
        "id": 80,
        "ciudad": "Atulcha (GPRS)",
        "latitud": -20.5861,
        "longitud": -67.641403
    },
    {
        "id": 81,
        "ciudad": "Aucapata",
        "latitud": -15.316667,
        "longitud": -68.65
    },
    {
        "id": 82,
        "ciudad": "Avaroa",
        "latitud": -17.533333,
        "longitud": -69.25
    },
    {
        "id": 83,
        "ciudad": "Ayata",
        "latitud": -15.333333,
        "longitud": -68.75
    },
    {
        "id": 84,
        "ciudad": "Ayo Ayo",
        "latitud": -17.093767,
        "longitud": -68.007499
    },
    {
        "id": 85,
        "ciudad": "Ayoma",
        "latitud": -18.869722,
        "longitud": -66.149167
    },
    {
        "id": 86,
        "ciudad": "Azurduy",
        "latitud": -20.100556,
        "longitud": -64.41
    },
    {
        "id": 87,
        "ciudad": "Balapuca",
        "latitud": -22.491111,
        "longitud": -64.463889
    },
    {
        "id": 88,
        "ciudad": "Ballivian",
        "latitud": -16.083333,
        "longitud": -68.45
    },
    {
        "id": 89,
        "ciudad": "Bartolo",
        "latitud": -19.5,
        "longitud": -64.033333
    },
    {
        "id": 90,
        "ciudad": "Batallas",
        "latitud": -16.416667,
        "longitud": -68.483333
    },
    {
        "id": 91,
        "ciudad": "Batallas Aut",
        "latitud": -16.430556,
        "longitud": -68.497778
    },
    {
        "id": 92,
        "ciudad": "Batallas-Yaurichambi (GPRS)",
        "latitud": -16.430599,
        "longitud": -68.497803
    },
    {
        "id": 93,
        "ciudad": "Baures",
        "latitud": -13.583333,
        "longitud": -63.666667
    },
    {
        "id": 94,
        "ciudad": "Baures Aeropuerto",
        "latitud": -13.658056,
        "longitud": -63.701944
    },
    {
        "id": 95,
        "ciudad": "Baures S.(GPRS)",
        "latitud": -13.66348,
        "longitud": -63.702487
    },
    {
        "id": 96,
        "ciudad": "Bautista Saavedra",
        "latitud": -15.716667,
        "longitud": -67.583333
    },
    {
        "id": 97,
        "ciudad": "Bella Vista LPZ",
        "latitud": -16.516667,
        "longitud": -68.1
    },
    {
        "id": 98,
        "ciudad": "Beni",
        "latitud": -14.83333,
        "longitud": -64.9
    },
    {
        "id": 99,
        "ciudad": "Berenguela",
        "latitud": -17.288889,
        "longitud": -69.214167
    },
    {
        "id": 100,
        "ciudad": "Berety",
        "latitud": -21.445,
        "longitud": -64.038056
    },
    {
        "id": 101,
        "ciudad": "Bermejo",
        "latitud": -22.7672,
        "longitud": -64.283897
    },
    {
        "id": 102,
        "ciudad": "Bermejo Aeropuerto",
        "latitud": -22.770833,
        "longitud": -64.311667
    },
    {
        "id": 103,
        "ciudad": "Bermejo SEARPI",
        "latitud": -18.1,
        "longitud": -63.633333
    },
    {
        "id": 104,
        "ciudad": "Bermejo_Sc",
        "latitud": -18.1,
        "longitud": -63.633333
    },
    {
        "id": 105,
        "ciudad": "Betanzos",
        "latitud": -19.55,
        "longitud": -65.45
    },
    {
        "id": 106,
        "ciudad": "Betanzos_ENFE",
        "latitud": -19.5625,
        "longitud": -65.459167
    },
    {
        "id": 107,
        "ciudad": "Bocatoma Misicuni",
        "latitud": -17.126667,
        "longitud": -66.321944
    },
    {
        "id": 108,
        "ciudad": "Bolivar_CBBA",
        "latitud": -17.966667,
        "longitud": -66.533333
    },
    {
        "id": 109,
        "ciudad": "Boyuibe",
        "latitud": -20.433333,
        "longitud": -63.25
    },
    {
        "id": 110,
        "ciudad": "Brecha Casarabe",
        "latitud": -16.7,
        "longitud": -62.816667
    },
    {
        "id": 111,
        "ciudad": "Buen Retiro",
        "latitud": -17.216667,
        "longitud": -63.05
    },
    {
        "id": 112,
        "ciudad": "Buen Retiro_ENFE",
        "latitud": -17.691111,
        "longitud": -66.266111
    },
    {
        "id": 113,
        "ciudad": "Buena Vista Ch",
        "latitud": -18.690278,
        "longitud": -64.703889
    },
    {
        "id": 114,
        "ciudad": "Buena Vista S.(GPRS)",
        "latitud": -17.46230556,
        "longitud": -63.66216667
    },
    {
        "id": 115,
        "ciudad": "Buena Vista Sc",
        "latitud": -17.45,
        "longitud": -63.666667
    },
    {
        "id": 116,
        "ciudad": "Bulo Bulo_M (GPRS)",
        "latitud": -17.252487,
        "longitud": -64.356283
    },
    {
        "id": 117,
        "ciudad": "Cabaña Forestal Oruro",
        "latitud": -17.974722,
        "longitud": -67.08
    },
    {
        "id": 118,
        "ciudad": "Cabezas",
        "latitud": -16.783333,
        "longitud": -63.316667
    },
    {
        "id": 119,
        "ciudad": "Cachimayu",
        "latitud": -19.1333,
        "longitud": -65.2667
    },
    {
        "id": 120,
        "ciudad": "Cachuela Esperanza_H",
        "latitud": -10.537236,
        "longitud": -65.584629
    },
    {
        "id": 121,
        "ciudad": "Caiza D",
        "latitud": -20.0075,
        "longitud": -65.6556
    },
    {
        "id": 122,
        "ciudad": "Cajetillas",
        "latitud": -16.5,
        "longitud": -67.3
    },
    {
        "id": 123,
        "ciudad": "Cala Cala (Vilte & Flores)",
        "latitud": -16.435556,
        "longitud": -68.788056
    },
    {
        "id": 124,
        "ciudad": "Calachaca",
        "latitud": -16.783333,
        "longitud": -67.35
    },
    {
        "id": 125,
        "ciudad": "Calacoto",
        "latitud": -17.282847,
        "longitud": -68.634583
    },
    {
        "id": 126,
        "ciudad": "Calacoto C",
        "latitud": -16.566667,
        "longitud": -68.083333
    },
    {
        "id": 127,
        "ciudad": "Calamarca",
        "latitud": -16.9,
        "longitud": -68.116667
    },
    {
        "id": 128,
        "ciudad": "Calamuchita TP",
        "latitud": -21.7,
        "longitud": -64.633333
    },
    {
        "id": 129,
        "ciudad": "Calcha de Lipez",
        "latitud": -21.016667,
        "longitud": -67.566667
    },
    {
        "id": 130,
        "ciudad": "Calcha Nor Chichas",
        "latitud": -20.383333,
        "longitud": -65.466667
    },
    {
        "id": 131,
        "ciudad": "Calderillas",
        "latitud": -21.75,
        "longitud": -64.95
    },
    {
        "id": 132,
        "ciudad": "Camargo",
        "latitud": -20.633333,
        "longitud": -65.2
    },
    {
        "id": 133,
        "ciudad": "Camargo_H (GPRS)",
        "latitud": -20.641136,
        "longitud": -65.205862
    },
    {
        "id": 134,
        "ciudad": "Camata",
        "latitud": -15.2483,
        "longitud": -68.745
    },
    {
        "id": 135,
        "ciudad": "Camiri",
        "latitud": -20.006701,
        "longitud": -63.525799
    },
    {
        "id": 136,
        "ciudad": "Camiri Aeropuerto",
        "latitud": -20.006667,
        "longitud": -63.525833
    },
    {
        "id": 137,
        "ciudad": "Campamento EBC N°3",
        "latitud": -16.43,
        "longitud": -68.148333
    },
    {
        "id": 138,
        "ciudad": "Campamento Espejos",
        "latitud": -17.966667,
        "longitud": -63.4
    },
    {
        "id": 139,
        "ciudad": "Campamento Pansuri (COPESA)",
        "latitud": -17.028333,
        "longitud": -68.598333
    },
    {
        "id": 140,
        "ciudad": "Campamento Villa Tunari",
        "latitud": -16.969405,
        "longitud": -65.420833
    },
    {
        "id": 141,
        "ciudad": "Campanario",
        "latitud": -21.5125,
        "longitud": -64.975556
    },
    {
        "id": 142,
        "ciudad": "Campo Grande Bermejo",
        "latitud": -22.78611,
        "longitud": -64.31167
    },
    {
        "id": 143,
        "ciudad": "Cañas",
        "latitud": -21.9022,
        "longitud": -64.850889
    },
    {
        "id": 144,
        "ciudad": "Cañas (GPRS)",
        "latitud": -21.902146,
        "longitud": -64.850937
    },
    {
        "id": 145,
        "ciudad": "Canasmoro",
        "latitud": -21.35,
        "longitud": -64.75
    },
    {
        "id": 146,
        "ciudad": "Cañaviri",
        "latitud": -16.2,
        "longitud": -68.166667
    },
    {
        "id": 147,
        "ciudad": "Canchasmayu",
        "latitud": -21.883333,
        "longitud": -64.883333
    },
    {
        "id": 148,
        "ciudad": "Candelaria",
        "latitud": -17.266667,
        "longitud": -65.933333
    },
    {
        "id": 149,
        "ciudad": "Candelaria Sc",
        "latitud": -18.633333,
        "longitud": -58.983333
    },
    {
        "id": 150,
        "ciudad": "Cantón Mendoza",
        "latitud": -19.083333,
        "longitud": -64.383333
    },
    {
        "id": 151,
        "ciudad": "Capilla Pata",
        "latitud": -16.757778,
        "longitud": -67.381667
    },
    {
        "id": 152,
        "ciudad": "Capiñata",
        "latitud": -16.65,
        "longitud": -67.166667
    },
    {
        "id": 153,
        "ciudad": "Capinota",
        "latitud": -17.7,
        "longitud": -66.260556
    },
    {
        "id": 154,
        "ciudad": "Capirenda",
        "latitud": -21.1,
        "longitud": -63.016667
    },
    {
        "id": 155,
        "ciudad": "Caquiaviri",
        "latitud": -17.022222,
        "longitud": -68.605556
    },
    {
        "id": 156,
        "ciudad": "Carabuco",
        "latitud": -15.758448,
        "longitud": -69.06498
    },
    {
        "id": 157,
        "ciudad": "Caracato",
        "latitud": -16.983333,
        "longitud": -67.833333
    },
    {
        "id": 158,
        "ciudad": "Caracollo Cadea",
        "latitud": -17.636389,
        "longitud": -67.200278
    },
    {
        "id": 159,
        "ciudad": "Caracollo CADEA - (GPRS)",
        "latitud": -17.636441,
        "longitud": -67.200329
    },
    {
        "id": 160,
        "ciudad": "Caranavi",
        "latitud": -15.834755,
        "longitud": -67.573677
    },
    {
        "id": 161,
        "ciudad": "Caranavi_H (GPRS)",
        "latitud": -15.832736,
        "longitud": -67.572742
    },
    {
        "id": 162,
        "ciudad": "Carandayti",
        "latitud": -20.666667,
        "longitud": -63.116667
    },
    {
        "id": 163,
        "ciudad": "Carapari",
        "latitud": -21.833333,
        "longitud": -63.75
    },
    {
        "id": 164,
        "ciudad": "Carmen Pampa",
        "latitud": -16.258056,
        "longitud": -67.691111
    },
    {
        "id": 165,
        "ciudad": "Carrizal",
        "latitud": -21.438611,
        "longitud": -65.239444
    },
    {
        "id": 166,
        "ciudad": "Carura_M (GPRS)",
        "latitud": -15.432464,
        "longitud": -67.958837
    },
    {
        "id": 167,
        "ciudad": "Casas Viejas",
        "latitud": -18.083333,
        "longitud": -64.15
    },
    {
        "id": 168,
        "ciudad": "Casin",
        "latitud": -19.380556,
        "longitud": -65.212778
    },
    {
        "id": 169,
        "ciudad": "Catacora",
        "latitud": -17.1586,
        "longitud": -69.4864
    },
    {
        "id": 170,
        "ciudad": "Caxata",
        "latitud": -17.133333,
        "longitud": -67.333333
    },
    {
        "id": 171,
        "ciudad": "Cayarani",
        "latitud": -17.267778,
        "longitud": -65.879444
    },
    {
        "id": 172,
        "ciudad": "Ce.Na.Vit.",
        "latitud": -21.725278,
        "longitud": -64.658056
    },
    {
        "id": 173,
        "ciudad": "Chacaltaya",
        "latitud": -16.349444,
        "longitud": -68.1325
    },
    {
        "id": 174,
        "ciudad": "Chachacomani-Batallas (GPRS)",
        "latitud": -16.108299,
        "longitud": -68.508102
    },
    {
        "id": 175,
        "ciudad": "Chagua",
        "latitud": -21.983333,
        "longitud": -65.55
    },
    {
        "id": 176,
        "ciudad": "Chaguarani",
        "latitud": -18.056944,
        "longitud": -65.511111
    },
    {
        "id": 177,
        "ciudad": "Chaguaya",
        "latitud": -15.75,
        "longitud": -68.816667
    },
    {
        "id": 178,
        "ciudad": "Challapata (Tacagua)",
        "latitud": -18.895833,
        "longitud": -66.777778
    },
    {
        "id": 179,
        "ciudad": "Challapata Aut",
        "latitud": -18.895833,
        "longitud": -66.777778
    },
    {
        "id": 180,
        "ciudad": "Challapata_ENFE",
        "latitud": -18.899191,
        "longitud": -66.779569
    },
    {
        "id": 181,
        "ciudad": "Challviri",
        "latitud": -19.616667,
        "longitud": -65.5
    },
    {
        "id": 182,
        "ciudad": "Challviri_HM (GPRS)",
        "latitud": -19.655561,
        "longitud": -65.696024
    },
    {
        "id": 183,
        "ciudad": "Changolla_ENFE",
        "latitud": -17.817778,
        "longitud": -66.485
    },
    {
        "id": 184,
        "ciudad": "Chaqui",
        "latitud": -19.583333,
        "longitud": -65.55
    },
    {
        "id": 185,
        "ciudad": "Chaquilla",
        "latitud": -19.85,
        "longitud": -66.133333
    },
    {
        "id": 186,
        "ciudad": "Charagua",
        "latitud": -19.784444,
        "longitud": -63.197222
    },
    {
        "id": 187,
        "ciudad": "Charagua SC (GPRS)",
        "latitud": -19.784401,
        "longitud": -63.197201
    },
    {
        "id": 188,
        "ciudad": "Charahuayto",
        "latitud": -17.265278,
        "longitud": -66.797222
    },
    {
        "id": 189,
        "ciudad": "Charaja",
        "latitud": -21.583333,
        "longitud": -65.6
    },
    {
        "id": 190,
        "ciudad": "Charaña",
        "latitud": -17.583333,
        "longitud": -69.45
    },
    {
        "id": 191,
        "ciudad": "Charaña (GPRS)",
        "latitud": -17.591167,
        "longitud": -69.448398
    },
    {
        "id": 192,
        "ciudad": "Charaña Aut.",
        "latitud": -17.591111,
        "longitud": -69.448611
    },
    {
        "id": 193,
        "ciudad": "Charaña GPRS",
        "latitud": -17.583056,
        "longitud": -69.448333
    },
    {
        "id": 194,
        "ciudad": "Charaña_ENFE",
        "latitud": -17.593056,
        "longitud": -69.444722
    },
    {
        "id": 195,
        "ciudad": "Charapaxi (auto)",
        "latitud": -20.979444,
        "longitud": -65.291111
    },
    {
        "id": 196,
        "ciudad": "Charapaya",
        "latitud": -16.966667,
        "longitud": -66.966667
    },
    {
        "id": 197,
        "ciudad": "Charazani",
        "latitud": -15.176666,
        "longitud": -68.993975
    },
    {
        "id": 198,
        "ciudad": "Charazani (GPRS)",
        "latitud": -15.1787404,
        "longitud": -68.9958066
    },
    {
        "id": 199,
        "ciudad": "Charpaxi - GPRS",
        "latitud": -20.9797,
        "longitud": -65.2911
    },
    {
        "id": 200,
        "ciudad": "Chaupisuyo",
        "latitud": -17.546944,
        "longitud": -65.813611
    },
    {
        "id": 201,
        "ciudad": "Chavarria",
        "latitud": -19.368056,
        "longitud": -64.555
    },
    {
        "id": 202,
        "ciudad": "Chejecucho (EuroClima)",
        "latitud": -15.92154,
        "longitud": -68.759439
    },
    {
        "id": 203,
        "ciudad": "Chicani",
        "latitud": -16.483333,
        "longitud": -68.083333
    },
    {
        "id": 204,
        "ciudad": "Chico Chico",
        "latitud": -19.666667,
        "longitud": -65.55
    },
    {
        "id": 205,
        "ciudad": "Chiguana_ENFE",
        "latitud": -21.224167,
        "longitud": -68.019444
    },
    {
        "id": 206,
        "ciudad": "Chijipina Grande",
        "latitud": -15.916667,
        "longitud": -68.75
    },
    {
        "id": 207,
        "ciudad": "Chijipina Grande (EuroClima)",
        "latitud": -15.996944,
        "longitud": -68.693889
    },
    {
        "id": 208,
        "ciudad": "Chillca",
        "latitud": -17.837002,
        "longitud": -66.813942
    },
    {
        "id": 209,
        "ciudad": "Chimboco",
        "latitud": -16.816667,
        "longitud": -65.65
    },
    {
        "id": 210,
        "ciudad": "Chimeo (GPRS)",
        "latitud": -21.195833,
        "longitud": -63.4375
    },
    {
        "id": 211,
        "ciudad": "Chimeo-Villa Montes (GPRS)",
        "latitud": -21.1875,
        "longitud": -63.437801
    },
    {
        "id": 212,
        "ciudad": "Chimore (GPRS)",
        "latitud": -16.995001,
        "longitud": -65.171402
    },
    {
        "id": 213,
        "ciudad": "Chimore Aeropuerto",
        "latitud": -16.988056,
        "longitud": -65.144444
    },
    {
        "id": 214,
        "ciudad": "Chiñata (Aut)",
        "latitud": -17.404722,
        "longitud": -65.979444
    },
    {
        "id": 215,
        "ciudad": "Chinchiri",
        "latitud": -17.716667,
        "longitud": -66.283333
    },
    {
        "id": 216,
        "ciudad": "Chinimayu (GPRS)",
        "latitud": -20.35,
        "longitud": -65.133102
    },
    {
        "id": 217,
        "ciudad": "Chinoli",
        "latitud": -19.648056,
        "longitud": -65.361111
    },
    {
        "id": 218,
        "ciudad": "Chipayas - GPRS",
        "latitud": -19.043677,
        "longitud": -68.086128
    },
    {
        "id": 219,
        "ciudad": "Chipiriri",
        "latitud": -16.873333,
        "longitud": -65.482778
    },
    {
        "id": 220,
        "ciudad": "Chirapaca",
        "latitud": -16.299733,
        "longitud": -68.497874
    },
    {
        "id": 221,
        "ciudad": "Chirokasa",
        "latitud": -18.2,
        "longitud": -66.2
    },
    {
        "id": 222,
        "ciudad": "Chocaya_ENFE",
        "latitud": -20.883333,
        "longitud": -66.266667
    },
    {
        "id": 223,
        "ciudad": "Chocloca",
        "latitud": -21.748056,
        "longitud": -64.729444
    },
    {
        "id": 224,
        "ciudad": "Chocolatal",
        "latitud": -17.064444,
        "longitud": -65.655556
    },
    {
        "id": 225,
        "ciudad": "Choquecota",
        "latitud": -18.096944,
        "longitud": -67.898889
    },
    {
        "id": 226,
        "ciudad": "Choquetanga Chico",
        "latitud": -16.778889,
        "longitud": -67.381111
    },
    {
        "id": 227,
        "ciudad": "Choquetanga Grande",
        "latitud": -16.879838,
        "longitud": -67.306471
    },
    {
        "id": 228,
        "ciudad": "Chorety",
        "latitud": -20.033333,
        "longitud": -63.55
    },
    {
        "id": 229,
        "ciudad": "Chorito",
        "latitud": -17.033333,
        "longitud": -66.666667
    },
    {
        "id": 230,
        "ciudad": "Chorocona",
        "latitud": -16.882778,
        "longitud": -67.149722
    },
    {
        "id": 231,
        "ciudad": "Chua Cocani_M (GPRS)",
        "latitud": -16.184673,
        "longitud": -68.748765
    },
    {
        "id": 232,
        "ciudad": "Chujllas",
        "latitud": -17.308333,
        "longitud": -65.032778
    },
    {
        "id": 233,
        "ciudad": "Chulcumayu",
        "latitud": -17.75,
        "longitud": -64.816667
    },
    {
        "id": 234,
        "ciudad": "Chulumani",
        "latitud": -16.411111,
        "longitud": -67.525
    },
    {
        "id": 235,
        "ciudad": "Chuma",
        "latitud": -15.4,
        "longitud": -68.933333
    },
    {
        "id": 236,
        "ciudad": "Chuñavi Alto",
        "latitud": -16.316667,
        "longitud": -68.333333
    },
    {
        "id": 237,
        "ciudad": "Chuqui Chuqui",
        "latitud": -18.8311,
        "longitud": -65.1225
    },
    {
        "id": 238,
        "ciudad": "Chuquiago",
        "latitud": -21.561389,
        "longitud": -65.641111
    },
    {
        "id": 239,
        "ciudad": "Chuquiaguillo_LP",
        "latitud": -16.449722,
        "longitud": -68.0925
    },
    {
        "id": 240,
        "ciudad": "Chuquiña",
        "latitud": -17.786944,
        "longitud": -67.463889
    },
    {
        "id": 241,
        "ciudad": "Chuquiña AT",
        "latitud": -17.776944,
        "longitud": -67.464722
    },
    {
        "id": 242,
        "ciudad": "Chuquisaca",
        "latitud": -19.0333,
        "longitud": -65.2627
    },
    {
        "id": 243,
        "ciudad": "Chuquiuta",
        "latitud": -18.583333,
        "longitud": -66.35
    },
    {
        "id": 244,
        "ciudad": "Chuspipata",
        "latitud": -16.303889,
        "longitud": -67.815278
    },
    {
        "id": 245,
        "ciudad": "Circuata",
        "latitud": -16.637222,
        "longitud": -67.252222
    },
    {
        "id": 246,
        "ciudad": "Ciudad Satélite",
        "latitud": -16.516667,
        "longitud": -68.15
    },
    {
        "id": 247,
        "ciudad": "Ciudad Satelite-D1",
        "latitud": -16.525434,
        "longitud": -68.151032
    },
    {
        "id": 248,
        "ciudad": "Ciudad-Tja",
        "latitud": -21.538333,
        "longitud": -64.726944
    },
    {
        "id": 249,
        "ciudad": "Ckochas",
        "latitud": -19.633333,
        "longitud": -65.266667
    },
    {
        "id": 250,
        "ciudad": "Cliza",
        "latitud": -17.586111,
        "longitud": -65.931944
    },
    {
        "id": 251,
        "ciudad": "Cliza_ENFE",
        "latitud": -17.591667,
        "longitud": -65.936389
    },
    {
        "id": 252,
        "ciudad": "Cobija",
        "latitud": -11.0333,
        "longitud": -68.783302
    },
    {
        "id": 253,
        "ciudad": "Cobija Aeropuerto",
        "latitud": -11.039722,
        "longitud": -68.78027
    },
    {
        "id": 254,
        "ciudad": "Cocapata",
        "latitud": -17.966667,
        "longitud": -65.85
    },
    {
        "id": 256,
        "ciudad": "Cochabamba", 
        "latitud": -17.3895,
        "longitud": -66.1568
    },
    {
        "id": 257,
        "ciudad": "Cochabamba Aeropuerto",
        "latitud": -17.416111,
        "longitud": -66.174444
    },
    {
        "id": 258,
        "ciudad": "Cocotani",
        "latitud": -16.15,
        "longitud": -68.85
    },
    {
        "id": 259,
        "ciudad": "Coimata",
        "latitud": -21.499053,
        "longitud": -64.788945
    },
    {
        "id": 260,
        "ciudad": "Coipasa",
        "latitud": -19.283333,
        "longitud": -68.266667
    },
    {
        "id": 261,
        "ciudad": "Colavi",
        "latitud": -19.316667,
        "longitud": -65.533333
    },
    {
        "id": 262,
        "ciudad": "Colcha K",
        "latitud": -20.736667,
        "longitud": -67.658333
    },
    {
        "id": 263,
        "ciudad": "Colcha-K (GPRS)",
        "latitud": -20.7425,
        "longitud": -67.660301
    },
    {
        "id": 264,
        "ciudad": "Collana",
        "latitud": -16.903945,
        "longitud": -68.28355
    },
    {
        "id": 265,
        "ciudad": "Colomi",
        "latitud": -17.336111,
        "longitud": -65.870833
    },
    {
        "id": 266,
        "ciudad": "Colon Norte",
        "latitud": -21.716667,
        "longitud": -64.633333
    },
    {
        "id": 267,
        "ciudad": "Colon Sud",
        "latitud": -21.75,
        "longitud": -64.65
    },
    {
        "id": 268,
        "ciudad": "Colonia Pirai",
        "latitud": -17.766667,
        "longitud": -63.15
    },
    {
        "id": 269,
        "ciudad": "Colonia San Carlos",
        "latitud": -17.966667,
        "longitud": -63.283333
    },
    {
        "id": 270,
        "ciudad": "Colonia San Juan",
        "latitud": -17.833333,
        "longitud": -63.166667
    },
    {
        "id": 271,
        "ciudad": "Colquechaca",
        "latitud": -17.35,
        "longitud": -66.233333
    },
    {
        "id": 272,
        "ciudad": "Colquechaca_PTI",
        "latitud": -18.7,
        "longitud": -66.033333
    },
    {
        "id": 273,
        "ciudad": "Colquencha (Emp. Moscoso)",
        "latitud": -16.925083,
        "longitud": -68.244576
    },
    {
        "id": 274,
        "ciudad": "Colquiri",
        "latitud": -17.4,
        "longitud": -67.133333
    },
    {
        "id": 275,
        "ciudad": "Comanche",
        "latitud": -17.95,
        "longitud": -68.416667
    },
    {
        "id": 276,
        "ciudad": "Comarapa",
        "latitud": -17.913611,
        "longitud": -64.529722
    },
    {
        "id": 277,
        "ciudad": "Coña Coña_ENFE",
        "latitud": -17.826944,
        "longitud": -66.709167
    },
    {
        "id": 278,
        "ciudad": "Concepcion",
        "latitud": -16.133301,
        "longitud": -62.016701
    },
    {
        "id": 279,
        "ciudad": "Concepcion Aeropuerto SCZ",
        "latitud": -16.138319,
        "longitud": -62.027516
    },
    {
        "id": 280,
        "ciudad": "Concepcion TJA",
        "latitud": -21.7,
        "longitud": -64.616667
    },
    {
        "id": 281,
        "ciudad": "Conchamarca",
        "latitud": -17.376944,
        "longitud": -67.455278
    },
    {
        "id": 282,
        "ciudad": "Conchamarca (EuroClima)",
        "latitud": -17.383134,
        "longitud": -67.462682
    },
    {
        "id": 283,
        "ciudad": "Condor Iquiña (EuroClima)",
        "latitud": -17.420339,
        "longitud": -69.044189
    },
    {
        "id": 284,
        "ciudad": "Condor Kala",
        "latitud": -16.805,
        "longitud": -67.393611
    },
    {
        "id": 285,
        "ciudad": "Condor_ENFE",
        "latitud": -18.470278,
        "longitud": -66.796944
    },
    {
        "id": 286,
        "ciudad": "Condoriri - UTO",
        "latitud": -17.543761,
        "longitud": -67.238355
    },
    {
        "id": 287,
        "ciudad": "Condoriri (GPRS)",
        "latitud": -17.543756,
        "longitud": -67.238367
    },
    {
        "id": 288,
        "ciudad": "Coniri",
        "latitud": -16.65,
        "longitud": -68.3
    },
    {
        "id": 289,
        "ciudad": "Contorno Arriba (ICA)",
        "latitud": -16.714444,
        "longitud": -68.319167
    },
    {
        "id": 290,
        "ciudad": "Conzata",
        "latitud": -15.333333,
        "longitud": -68.533333
    },
    {
        "id": 291,
        "ciudad": "Copacabana",
        "latitud": -16.169486,
        "longitud": -69.088513
    },
    {
        "id": 292,
        "ciudad": "Copacabana LP",
        "latitud": -16.1833,
        "longitud": -69.083298
    },
    {
        "id": 293,
        "ciudad": "Copacabana LP (Satelital)",
        "latitud": -16.174999,
        "longitud": -69.088898
    },
    {
        "id": 294,
        "ciudad": "Copacabana Taxara",
        "latitud": -21.8,
        "longitud": -65.1
    },
    {
        "id": 295,
        "ciudad": "Copacati",
        "latitud": -16.2,
        "longitud": -69.083333
    },
    {
        "id": 296,
        "ciudad": "Copachuncho",
        "latitud": -17.116667,
        "longitud": -65.133333
    },
    {
        "id": 297,
        "ciudad": "Copancara",
        "latitud": -16.239167,
        "longitud": -68.566667
    },
    {
        "id": 298,
        "ciudad": "Copere",
        "latitud": -19.7,
        "longitud": -62.583333
    },
    {
        "id": 299,
        "ciudad": "Corana",
        "latitud": -21.3,
        "longitud": -64.766667
    },
    {
        "id": 300,
        "ciudad": "Corani Represa",
        "latitud": -17.225,
        "longitud": -65.883056
    },
    {
        "id": 301,
        "ciudad": "Coripata",
        "latitud": -16.324167,
        "longitud": -67.604444
    },
    {
        "id": 302,
        "ciudad": "Corma_M (GPRS)",
        "latitud": -20.237499,
        "longitud": -65.043602
    },
    {
        "id": 303,
        "ciudad": "Coro Coro",
        "latitud": -17.183333,
        "longitud": -68.45
    },
    {
        "id": 304,
        "ciudad": "Coroico",
        "latitud": -16.233333,
        "longitud": -67.7
    },
    {
        "id": 305,
        "ciudad": "Coroico_H (GPRS)",
        "latitud": -16.167927,
        "longitud": -67.729205
    },
    {
        "id": 306,
        "ciudad": "Coronel Armando Gomez",
        "latitud": -18.65,
        "longitud": -63.016667
    },
    {
        "id": 307,
        "ciudad": "Cororo",
        "latitud": -19.066667,
        "longitud": -64.9
    },
    {
        "id": 308,
        "ciudad": "Corpaputo",
        "latitud": -16.066667,
        "longitud": -68.533333
    },
    {
        "id": 309,
        "ciudad": "Corpaputo (As.Ac.Peñas)",
        "latitud": -16.068611,
        "longitud": -68.554444
    },
    {
        "id": 310,
        "ciudad": "Corque",
        "latitud": -18.343889,
        "longitud": -67.678333
    },
    {
        "id": 311,
        "ciudad": "Corque (GPRS)",
        "latitud": -18.345784,
        "longitud": -67.680622
    },
    {
        "id": 312,
        "ciudad": "Corque SAT",
        "latitud": -18.343889,
        "longitud": -67.678611
    },
    {
        "id": 313,
        "ciudad": "Cosapa",
        "latitud": -18.177866,
        "longitud": -68.706353
    },
    {
        "id": 314,
        "ciudad": "Cota Cota Baja_M (GPRS)",
        "latitud": -16.179701,
        "longitud": -68.632202
    },
    {
        "id": 315,
        "ciudad": "Cota Cota UMSA",
        "latitud": -16.537778,
        "longitud": -68.063889
    },
    {
        "id": 316,
        "ciudad": "Cotacajes",
        "latitud": -16.7,
        "longitud": -66.716667
    },
    {
        "id": 317,
        "ciudad": "Cotagaita",
        "latitud": -20.820833,
        "longitud": -65.666667
    },
    {
        "id": 318,
        "ciudad": "Cotagaita (GPRS)",
        "latitud": -20.820648,
        "longitud": -65.65891
    },
    {
        "id": 319,
        "ciudad": "Cotagaita (Satelital)",
        "latitud": -20.910601,
        "longitud": -65.860298
    },
    {
        "id": 320,
        "ciudad": "Cotagaita Mosoj Llajta",
        "latitud": -20.822222,
        "longitud": -65.646944
    },
    {
        "id": 321,
        "ciudad": "Cotagaita_H (GPRS)",
        "latitud": -20.821129,
        "longitud": -65.66605
    },
    {
        "id": 322,
        "ciudad": "Cotani Alto",
        "latitud": -17.366667,
        "longitud": -64.75
    },
    {
        "id": 323,
        "ciudad": "Cotoca",
        "latitud": -17.75,
        "longitud": -62.983333
    },
    {
        "id": 324,
        "ciudad": "Covendo",
        "latitud": -15.83,
        "longitud": -66.949722
    },
    {
        "id": 325,
        "ciudad": "Covendo_M (GPRS)",
        "latitud": -15.792097,
        "longitud": -66.976001
    },
    {
        "id": 326,
        "ciudad": "Crevaux",
        "latitud": -21.824722,
        "longitud": -62.9175
    },
    {
        "id": 327,
        "ciudad": "Cri_Yapacani",
        "latitud": -17.4,
        "longitud": -63.833333
    },
    {
        "id": 328,
        "ciudad": "Cristal Mayu",
        "latitud": -17.007778,
        "longitud": -65.643333
    },
    {
        "id": 329,
        "ciudad": "Cruce Culta (GPRS)",
        "latitud": -19.076099,
        "longitud": -66.2108
    },
    {
        "id": 330,
        "ciudad": "Cruce Ventilla",
        "latitud": -19.0761,
        "longitud": -66.2108
    },
    {
        "id": 331,
        "ciudad": "Cruz Khaza",
        "latitud": -19.833333,
        "longitud": -64.566667
    },
    {
        "id": 332,
        "ciudad": "Cuarto Centenario",
        "latitud": -16.533333,
        "longitud": -68.133333
    },
    {
        "id": 333,
        "ciudad": "Cuatro Cañadas",
        "latitud": -17.226944,
        "longitud": -62.150556
    },
    {
        "id": 334,
        "ciudad": "Cuatro Cañadas - CEA-2 (GPRS)",
        "latitud": -17.442057,
        "longitud": -62.612461
    },
    {
        "id": 335,
        "ciudad": "Cuatro Cañadas - Colonia Chihuahua (GPRS)",
        "latitud": -17.220043,
        "longitud": -62.15531
    },
    {
        "id": 336,
        "ciudad": "Cuatro Esquinas",
        "latitud": -17.383333,
        "longitud": -65.866667
    },
    {
        "id": 337,
        "ciudad": "Cuatro Esquinas Misicuni",
        "latitud": -17.190556,
        "longitud": -66.237778
    },
    {
        "id": 338,
        "ciudad": "Cuchu Ingenio",
        "latitud": -19.883333,
        "longitud": -65.7
    },
    {
        "id": 339,
        "ciudad": "Cuevas",
        "latitud": -18.183333,
        "longitud": -63.733333
    },
    {
        "id": 340,
        "ciudad": "Cuevo (GPRS)",
        "latitud": -20.4547,
        "longitud": -63.514999
    },
    {
        "id": 341,
        "ciudad": "Culpina",
        "latitud": -20.8183,
        "longitud": -64.9478
    },
    {
        "id": 342,
        "ciudad": "Culpina (GPRS)",
        "latitud": -20.8297,
        "longitud": -64.944397
    },
    {
        "id": 343,
        "ciudad": "Culta",
        "latitud": -19.079661,
        "longitud": -66.206953
    },
    {
        "id": 344,
        "ciudad": "Cumandayti",
        "latitud": -20.566667,
        "longitud": -63.883333
    },
    {
        "id": 345,
        "ciudad": "Cumbre Sama",
        "latitud": -21.491667,
        "longitud": -64.981944
    },
    {
        "id": 346,
        "ciudad": "Curabamba",
        "latitud": -17.5,
        "longitud": -65.666667
    },
    {
        "id": 347,
        "ciudad": "Curahuara de Carangas",
        "latitud": -17.8425,
        "longitud": -68.416389
    },
    {
        "id": 348,
        "ciudad": "Curahuara de Carangas (GPRS)",
        "latitud": -17.841101,
        "longitud": -68.412201
    },
    {
        "id": 349,
        "ciudad": "Curahuara de Carangas SAT",
        "latitud": -17.838889,
        "longitud": -68.414444
    },
    {
        "id": 350,
        "ciudad": "Curupampa",
        "latitud": -15.866667,
        "longitud": -68.65
    },
    {
        "id": 351,
        "ciudad": "Cutusuma (Vilte & Flores)",
        "latitud": -16.335278,
        "longitud": -68.579167
    },
    {
        "id": 352,
        "ciudad": "Desaguadero",
        "latitud": -16.55,
        "longitud": -69.033333
    },
    {
        "id": 353,
        "ciudad": "Desaguadero_M",
        "latitud": -16.56617,
        "longitud": -69.037128
    },
    {
        "id": 354,
        "ciudad": "Despenzas",
        "latitud": -20.183333,
        "longitud": -64.216667
    },
    {
        "id": 355,
        "ciudad": "Dorado Chico",
        "latitud": -16.274444,
        "longitud": -67.626111
    },
    {
        "id": 356,
        "ciudad": "El Alto",
        "latitud": -16.5,
        "longitud": -68.166702
    },
    {
        "id": 357,
        "ciudad": "El Alto Aeropuerto",
        "latitud": -16.510278,
        "longitud": -68.198611
    },
    {
        "id": 358,
        "ciudad": "El Alto Senamhi",
        "latitud": -16.516667,
        "longitud": -68.216667
    },
    {
        "id": 359,
        "ciudad": "El Belen",
        "latitud": -16.019295,
        "longitud": -68.712072
    },
    {
        "id": 360,
        "ciudad": "El Belen (EuroClima)",
        "latitud": -16.019295,
        "longitud": -68.712072
    },
    {
        "id": 361,
        "ciudad": "El Cairo",
        "latitud": -17.466667,
        "longitud": -63.683333
    },
    {
        "id": 362,
        "ciudad": "El Carmen",
        "latitud": -17.9,
        "longitud": -64.05
    },
    {
        "id": 363,
        "ciudad": "El Chilcar",
        "latitud": -21.016667,
        "longitud": -64.933333
    },
    {
        "id": 364,
        "ciudad": "El Común Caraparí",
        "latitud": -21.829278,
        "longitud": -63.729965
    },
    {
        "id": 365,
        "ciudad": "El Cortijo",
        "latitud": -19.133333,
        "longitud": -65.233333
    },
    {
        "id": 366,
        "ciudad": "El Huayco",
        "latitud": -21.3175,
        "longitud": -64.253333
    },
    {
        "id": 367,
        "ciudad": "El Huayco (c)",
        "latitud": -21.316667,
        "longitud": -64.25
    },
    {
        "id": 368,
        "ciudad": "El Mezquinado",
        "latitud": -21.345833,
        "longitud": -63.028333
    },
    {
        "id": 369,
        "ciudad": "El Molino Tomayapo",
        "latitud": -21.366667,
        "longitud": -64.95
    },
    {
        "id": 370,
        "ciudad": "El Palmar",
        "latitud": -20.833333,
        "longitud": -64.316667
    },
    {
        "id": 371,
        "ciudad": "El Paraiso",
        "latitud": -16.133333,
        "longitud": -61.916667
    },
    {
        "id": 372,
        "ciudad": "El Patuju",
        "latitud": -17.333333,
        "longitud": -63.316667
    },
    {
        "id": 373,
        "ciudad": "El Pibe Km9",
        "latitud": -21.25,
        "longitud": -63.466667
    },
    {
        "id": 374,
        "ciudad": "El Puente",
        "latitud": -21.25,
        "longitud": -65.2
    },
    {
        "id": 375,
        "ciudad": "El Puente (c)",
        "latitud": -21.25,
        "longitud": -65.2
    },
    {
        "id": 376,
        "ciudad": "El Puente (GPRS)",
        "latitud": -16.3239,
        "longitud": -62.9175
    },
    {
        "id": 377,
        "ciudad": "El Puente_H (GPRS)",
        "latitud": -21.239521,
        "longitud": -65.20917
    },
    {
        "id": 378,
        "ciudad": "El Quiñe",
        "latitud": -18.083333,
        "longitud": -64.35
    },
    {
        "id": 379,
        "ciudad": "El Reloj",
        "latitud": -19.038056,
        "longitud": -65.243056
    },
    {
        "id": 380,
        "ciudad": "El Rodeo",
        "latitud": -19.05,
        "longitud": -64.583333
    },
    {
        "id": 381,
        "ciudad": "El Rosal",
        "latitud": -19.983056,
        "longitud": -64.216667
    },
    {
        "id": 382,
        "ciudad": "El Salado",
        "latitud": -22.433333,
        "longitud": -64.5
    },
    {
        "id": 383,
        "ciudad": "El Salvador",
        "latitud": -20.566667,
        "longitud": -63.733333
    },
    {
        "id": 384,
        "ciudad": "El Sillar",
        "latitud": -18.133333,
        "longitud": -63.566667
    },
    {
        "id": 385,
        "ciudad": "El Tejar (La Paz)",
        "latitud": -16.496389,
        "longitud": -68.158056
    },
    {
        "id": 386,
        "ciudad": "El Tejar (Tarija)",
        "latitud": -21.545599,
        "longitud": -64.721868
    },
    {
        "id": 387,
        "ciudad": "El Tranque (GPRS)",
        "latitud": -20.810801,
        "longitud": -64.9478
    },
    {
        "id": 388,
        "ciudad": "El Trigal",
        "latitud": -17.883333,
        "longitud": -64.3
    },
    {
        "id": 389,
        "ciudad": "El Villar",
        "latitud": -19.6311,
        "longitud": -64.3069
    },
    {
        "id": 390,
        "ciudad": "El Villar (auto)",
        "latitud": -19.646944,
        "longitud": -64.306667
    },
    {
        "id": 391,
        "ciudad": "Elvira",
        "latitud": -18.066667,
        "longitud": -63.5
    },
    {
        "id": 392,
        "ciudad": "Embalse San Jacinto",
        "latitud": -21.6,
        "longitud": -64.7
    },
    {
        "id": 393,
        "ciudad": "Emborozu",
        "latitud": -22.266944,
        "longitud": -64.554444
    },
    {
        "id": 394,
        "ciudad": "Empinado SEARPI",
        "latitud": -18.55,
        "longitud": -63.8
    },
    {
        "id": 395,
        "ciudad": "Entalleria",
        "latitud": -16.4,
        "longitud": -67.666667
    },
    {
        "id": 396,
        "ciudad": "Entre Rios (TJA)",
        "latitud": -21.503056,
        "longitud": -64.170556
    },
    {
        "id": 397,
        "ciudad": "Entre Rios Km52 (LPZ)",
        "latitud": -15.633333,
        "longitud": -67.416667
    },
    {
        "id": 398,
        "ciudad": "Escalerani",
        "latitud": -17.116667,
        "longitud": -66.416667
    },
    {
        "id": 399,
        "ciudad": "Escana",
        "latitud": -19.25,
        "longitud": -65.066667
    },
    {
        "id": 400,
        "ciudad": "Escara",
        "latitud": -20.65,
        "longitud": -65.666667
    },
    {
        "id": 401,
        "ciudad": "Escoma ",
        "latitud": -15.659167,
        "longitud": -69.132778
    },
    {
        "id": 402,
        "ciudad": "Esfor - Parque Tunari (Aut.)",
        "latitud": -17.35,
        "longitud": -66.153889
    },
    {
        "id": 403,
        "ciudad": "Esmeralda",
        "latitud": -22.233333,
        "longitud": -62.633333
    },
    {
        "id": 404,
        "ciudad": "Est. Exp. Vallecito",
        "latitud": -17.766667,
        "longitud": -63.15
    },
    {
        "id": 405,
        "ciudad": "Estación Central_LP_ENFE",
        "latitud": -16.491111,
        "longitud": -68.144444
    },
    {
        "id": 406,
        "ciudad": "Eucaliptus",
        "latitud": -17.596389,
        "longitud": -67.506111
    },
    {
        "id": 407,
        "ciudad": "Eucaliptus_ENFE",
        "latitud": -17.595556,
        "longitud": -67.508056
    },
    {
        "id": 408,
        "ciudad": "Facultad de Agronomia UTO",
        "latitud": -17.996111,
        "longitud": -67.138933
    },
    {
        "id": 409,
        "ciudad": "Floresta",
        "latitud": -19.983333,
        "longitud": -63.033333
    },
    {
        "id": 410,
        "ciudad": "Florida",
        "latitud": -18.565556,
        "longitud": -63.379167
    },
    {
        "id": 411,
        "ciudad": "Fortin Campero",
        "latitud": -22.833333,
        "longitud": -64.3
    },
    {
        "id": 412,
        "ciudad": "Gamoneda",
        "latitud": -21.483333,
        "longitud": -64.633333
    },
    {
        "id": 413,
        "ciudad": "General Saavedra",
        "latitud": -17.233333,
        "longitud": -63.2
    },
    {
        "id": 414,
        "ciudad": "Gobernacion Yacuiba",
        "latitud": -22.002778,
        "longitud": -63.669167
    },
    {
        "id": 415,
        "ciudad": "Gral Gruguez Paraguay",
        "latitud": -24.741667,
        "longitud": -58.836111
    },
    {
        "id": 416,
        "ciudad": "Granja Espejos",
        "latitud": -17.966667,
        "longitud": -63.466667
    },
    {
        "id": 417,
        "ciudad": "Guajara-Mirim - Guayaramerín",
        "latitud": -10.813773,
        "longitud": -65.347792
    },
    {
        "id": 418,
        "ciudad": "Guanay",
        "latitud": -15.503056,
        "longitud": -67.885833
    },
    {
        "id": 419,
        "ciudad": "Guanay_H (GPRS)",
        "latitud": -15.493409,
        "longitud": -67.884038
    },
    {
        "id": 420,
        "ciudad": "Guandacay",
        "latitud": -22.4,
        "longitud": -64.5
    },
    {
        "id": 421,
        "ciudad": "Guapilo",
        "latitud": -17.766667,
        "longitud": -63.066667
    },
    {
        "id": 422,
        "ciudad": "Guaqui",
        "latitud": -16.583333,
        "longitud": -68.966667
    },
    {
        "id": 423,
        "ciudad": "Guaqui - Khasa (ICA)",
        "latitud": -16.611389,
        "longitud": -68.91
    },
    {
        "id": 424,
        "ciudad": "Guayaramerin Aeropuerto",
        "latitud": -10.819401,
        "longitud": -65.347004
    },
    {
        "id": 425,
        "ciudad": "Guayaramerin_M (GPRS)",
        "latitud": -10.833914,
        "longitud": -65.340038
    },
    {
        "id": 426,
        "ciudad": "Gutierrez",
        "latitud": -19.420833,
        "longitud": -63.5275
    },
    {
        "id": 427,
        "ciudad": "Gutierrez (GPRS)",
        "latitud": -19.420799,
        "longitud": -63.5275
    },
    {
        "id": 428,
        "ciudad": "Hampaturi - GPRS",
        "latitud": -16.4158,
        "longitud": -68.022202
    },
    {
        "id": 429,
        "ciudad": "Hampaturi EPSAS",
        "latitud": -16.415278,
        "longitud": -68.022778
    },
    {
        "id": 430,
        "ciudad": "Hichucollo",
        "latitud": -17.2,
        "longitud": -65.966667
    },
    {
        "id": 431,
        "ciudad": "Hichucota",
        "latitud": -16.176667,
        "longitud": -68.381111
    },
    {
        "id": 432,
        "ciudad": "Hilo Hilo",
        "latitud": -14.883333,
        "longitud": -68.933333
    },
    {
        "id": 433,
        "ciudad": "Hito BR",
        "latitud": -21.67,
        "longitud": -62.46
    },
    {
        "id": 434,
        "ciudad": "Huacareta - La Galería",
        "latitud": -20.3636,
        "longitud": -64.002222
    },
    {
        "id": 435,
        "ciudad": "Huacata",
        "latitud": -21.238611,
        "longitud": -64.845278
    },
    {
        "id": 436,
        "ciudad": "Huacaya (GPRS)",
        "latitud": -20.7439,
        "longitud": -63.6642
    },
    {
        "id": 437,
        "ciudad": "Huachacalla",
        "latitud": -18.787222,
        "longitud": -68.257222
    },
    {
        "id": 438,
        "ciudad": "Huacullani",
        "latitud": -16.466667,
        "longitud": -68.733333
    },
    {
        "id": 439,
        "ciudad": "Huajchamayu",
        "latitud": -16.916667,
        "longitud": -66.616667
    },
    {
        "id": 440,
        "ciudad": "Huaji (Zongo)",
        "latitud": -16.383333,
        "longitud": -67.8
    },
    {
        "id": 441,
        "ciudad": "Huancane Corapata_M (GPRS)",
        "latitud": -16.435467,
        "longitud": -68.35648129
    },
    {
        "id": 442,
        "ciudad": "Huaraco",
        "latitud": -17.35,
        "longitud": -67.65
    },
    {
        "id": 443,
        "ciudad": "Huarina",
        "latitud": -16.2,
        "longitud": -68.633333
    },
    {
        "id": 444,
        "ciudad": "Huarina (Asociación HUARINA)",
        "latitud": -16.165833,
        "longitud": -68.667222
    },
    {
        "id": 445,
        "ciudad": "Huarina Cota Cota",
        "latitud": -16.176111,
        "longitud": -68.630556
    },
    {
        "id": 446,
        "ciudad": "Huarirenda",
        "latitud": -19.233333,
        "longitud": -63.333333
    },
    {
        "id": 447,
        "ciudad": "Huarisuyo (GPRS)",
        "latitud": -16.3569,
        "longitud": -68.5044
    },
    {
        "id": 448,
        "ciudad": "Huatajata",
        "latitud": -16.211667,
        "longitud": -68.6975
    },
    {
        "id": 449,
        "ciudad": "Huayapacha",
        "latitud": -17.55,
        "longitud": -65.416667
    },
    {
        "id": 450,
        "ciudad": "Huaylipaya",
        "latitud": -16.0425,
        "longitud": -68.000833
    },
    {
        "id": 451,
        "ciudad": "Huayllamarca",
        "latitud": -17.835763,
        "longitud": -67.93966
    },
    {
        "id": 452,
        "ciudad": "Huayna Potosí",
        "latitud": -16.866667,
        "longitud": -68.15
    },
    {
        "id": 453,
        "ciudad": "Huayñacota",
        "latitud": -17.05,
        "longitud": -67.3
    },
    {
        "id": 454,
        "ciudad": "Huayrocondo",
        "latitud": -16.343056,
        "longitud": -68.496944
    },
    {
        "id": 455,
        "ciudad": "Huaytu",
        "latitud": -17.583333,
        "longitud": -63.616667
    },
    {
        "id": 456,
        "ciudad": "Humapalca",
        "latitud": -16.7,
        "longitud": -67.583333
    },
    {
        "id": 457,
        "ciudad": "Ibibobo",
        "latitud": -21.541667,
        "longitud": -62.997222
    },
    {
        "id": 458,
        "ciudad": "Ibibobo (Satelital)",
        "latitud": -21.6733,
        "longitud": -63.213299
    },
    {
        "id": 459,
        "ciudad": "Icla",
        "latitud": -19.360833,
        "longitud": -64.790833
    },
    {
        "id": 460,
        "ciudad": "Igachi (GPRS)",
        "latitud": -16.25,
        "longitud": -68.516701
    },
    {
        "id": 461,
        "ciudad": "INAC CBBA Aeropuerto (Autom)",
        "latitud": -17.413333,
        "longitud": -66.169444
    },
    {
        "id": 462,
        "ciudad": "INAC Cochabamba - (GPRS)",
        "latitud": -17.425301,
        "longitud": -68.167503
    },
    {
        "id": 463,
        "ciudad": "Inca",
        "latitud": -14.766667,
        "longitud": -68.4
    },
    {
        "id": 464,
        "ciudad": "Incachaca - Quillacollo",
        "latitud": -17.133333,
        "longitud": -66.366667
    },
    {
        "id": 465,
        "ciudad": "Incachaca Chapare",
        "latitud": -17.388889,
        "longitud": -66.361111
    },
    {
        "id": 466,
        "ciudad": "Incachaca EPSAS",
        "latitud": -16.406944,
        "longitud": -68.047778
    },
    {
        "id": 467,
        "ciudad": "Incachaca_Ayopaya",
        "latitud": -17.033333,
        "longitud": -66.366667
    },
    {
        "id": 468,
        "ciudad": "Incahuasi (GPRS)",
        "latitud": -20.799999,
        "longitud": -64.900002
    },
    {
        "id": 469,
        "ciudad": "Incahuasi_CHUQ",
        "latitud": -20.766667,
        "longitud": -64.866667
    },
    {
        "id": 470,
        "ciudad": "Incapampa",
        "latitud": -16.225556,
        "longitud": -67.728056
    },
    {
        "id": 471,
        "ciudad": "Incapampa - Coroico_M (GPRS)",
        "latitud": -16.193451,
        "longitud": -67.72282
    },
    {
        "id": 472,
        "ciudad": "Independencia",
        "latitud": -17.081389,
        "longitud": -66.818611
    },
    {
        "id": 473,
        "ciudad": "Independencia (Satelital)",
        "latitud": -17.311701,
        "longitud": -66.848099
    },
    {
        "id": 474,
        "ciudad": "Ingenio Mora",
        "latitud": -16.45,
        "longitud": -63.216667
    },
    {
        "id": 475,
        "ciudad": "Ingenio Santa Cecilia",
        "latitud": -17.216667,
        "longitud": -63.05
    },
    {
        "id": 476,
        "ciudad": "Inquisivi",
        "latitud": -16.983333,
        "longitud": -67.166667
    },
    {
        "id": 477,
        "ciudad": "Ins. Nal. Sal. Ocupación",
        "latitud": -16.566667,
        "longitud": -68.083333
    },
    {
        "id": 478,
        "ciudad": "Iquiaca",
        "latitud": -16.4,
        "longitud": -68.55
    },
    {
        "id": 479,
        "ciudad": "Irpa Chico",
        "latitud": -16.733333,
        "longitud": -68.366667
    },
    {
        "id": 480,
        "ciudad": "Irpa Grande",
        "latitud": -16.75,
        "longitud": -68.3
    },
    {
        "id": 481,
        "ciudad": "Irpa Irpa",
        "latitud": -17.716667,
        "longitud": -66.283056
    },
    {
        "id": 482,
        "ciudad": "Irupana",
        "latitud": -16.473056,
        "longitud": -67.452778
    },
    {
        "id": 483,
        "ciudad": "Irupana (Satelital)",
        "latitud": -16.506399,
        "longitud": -67.6194
    },
    {
        "id": 484,
        "ciudad": "Irupata (GPRS)",
        "latitud": -18.4072,
        "longitud": -66.3983
    },
    {
        "id": 485,
        "ciudad": "Iscayachi - San Antonio ",
        "latitud": -21.388611,
        "longitud": -64.946944
    },
    {
        "id": 486,
        "ciudad": "Isicani",
        "latitud": -16.083333,
        "longitud": -68.033333
    },
    {
        "id": 487,
        "ciudad": "Isla Del Sol",
        "latitud": -16.036667,
        "longitud": -69.148333
    },
    {
        "id": 488,
        "ciudad": "Isla Suriqui_M (GPRS)",
        "latitud": -16.304701,
        "longitud": -68.770599
    },
    {
        "id": 489,
        "ciudad": "Isquillani Batallas (GPRS)",
        "latitud": -16.2311,
        "longitud": -68.464401
    },
    {
        "id": 490,
        "ciudad": "Itaguazurenda",
        "latitud": -19.783333,
        "longitud": -63.083333
    },
    {
        "id": 491,
        "ciudad": "Italaque",
        "latitud": -15.483333,
        "longitud": -69.033333
    },
    {
        "id": 492,
        "ciudad": "Itau",
        "latitud": -21.704167,
        "longitud": -63.868611
    },
    {
        "id": 493,
        "ciudad": "Iturata",
        "latitud": -16.716667,
        "longitud": -66.816667
    },
    {
        "id": 494,
        "ciudad": "Ivirgarzama",
        "latitud": -17.033333,
        "longitud": -64.85
    },
    {
        "id": 495,
        "ciudad": "Ivirgarzama-Senda VI (GPRS)",
        "latitud": -17.0194,
        "longitud": -64.932198
    },
    {
        "id": 496,
        "ciudad": "Ixiamas",
        "latitud": -13.766667,
        "longitud": -68.133333
    },
    {
        "id": 497,
        "ciudad": "Ixiamas (El Ceibo)",
        "latitud": -13.8991,
        "longitud": -68.062217
    },
    {
        "id": 498,
        "ciudad": "Ixiamas S.(GPRS)",
        "latitud": -13.952276,
        "longitud": -68.004668
    },
    {
        "id": 499,
        "ciudad": "Ixiamas_M (GPRS)",
        "latitud": -13.771167,
        "longitud": -68.135286
    },
    {
        "id": 500,
        "ciudad": "Jalancha",
        "latitud": -16.783333,
        "longitud": -67.483333
    },
    {
        "id": 501,
        "ciudad": "Jardin Botanico (CBBA)",
        "latitud": -17.416667,
        "longitud": -66.166667
    },
    {
        "id": 502,
        "ciudad": "Jardin Botanico (LPZ)",
        "latitud": -16.533333,
        "longitud": -68.383333
    },
    {
        "id": 503,
        "ciudad": "Jatun Mayo (Lacayas)",
        "latitud": -17.25,
        "longitud": -65.966667
    },
    {
        "id": 504,
        "ciudad": "Jesús de Machaca",
        "latitud": -16.733333,
        "longitud": -68.75
    },
    {
        "id": 505,
        "ciudad": "Jesús de Machaca_M (GPRS)",
        "latitud": -16.7742,
        "longitud": -68.826897
    },
    {
        "id": 506,
        "ciudad": "Jihuacuta",
        "latitud": -16.858056,
        "longitud": -68.662222
    },
    {
        "id": 507,
        "ciudad": "Jinchaca",
        "latitud": -16.933333,
        "longitud": -69.1
    },
    {
        "id": 508,
        "ciudad": "Juan Pablo de Laja (Chijini Chico)-D12",
        "latitud": -16.55686,
        "longitud": -68.234982
    },
    {
        "id": 509,
        "ciudad": "Juan Vena",
        "latitud": -17.7,
        "longitud": -66.05
    },
    {
        "id": 510,
        "ciudad": "Julaca",
        "latitud": -20.95,
        "longitud": -67.95
    },
    {
        "id": 511,
        "ciudad": "Julaca_ENFE",
        "latitud": -20.913056,
        "longitud": -67.5575
    },
    {
        "id": 512,
        "ciudad": "Junacas",
        "latitud": -21.433333,
        "longitud": -64.466667
    },
    {
        "id": 513,
        "ciudad": "Juntas",
        "latitud": -21.810167,
        "longitud": -64.797876
    },
    {
        "id": 514,
        "ciudad": "Kallutaca",
        "latitud": -16.516667,
        "longitud": -68.3
    },
    {
        "id": 515,
        "ciudad": "Kaspi Kancha",
        "latitud": -17.3775,
        "longitud": -65.703333
    },
    {
        "id": 516,
        "ciudad": "Kataricawa AT",
        "latitud": -18.268333,
        "longitud": -66.810833
    },
    {
        "id": 517,
        "ciudad": "Keluyo (esqueri)",
        "latitud": -19.833333,
        "longitud": -65.183333
    },
    {
        "id": 518,
        "ciudad": "Kespillajta",
        "latitud": -19.5,
        "longitud": -65.416667
    },
    {
        "id": 519,
        "ciudad": "Kewiña k'asa",
        "latitud": -17.765556,
        "longitud": -65.388611
    },
    {
        "id": 520,
        "ciudad": "Khora",
        "latitud": -16.533333,
        "longitud": -67.2
    },
    {
        "id": 521,
        "ciudad": "Kilpani",
        "latitud": -20.033333,
        "longitud": -66.116667
    },
    {
        "id": 522,
        "ciudad": "Koa Koa",
        "latitud": -19.5,
        "longitud": -65.416667
    },
    {
        "id": 523,
        "ciudad": "Koari",
        "latitud": -17.476111,
        "longitud": -65.580556
    },
    {
        "id": 524,
        "ciudad": "Kocani",
        "latitud": -21.182778,
        "longitud": -66.565833
    },
    {
        "id": 525,
        "ciudad": "Kocani (GPRS)",
        "latitud": -21.1828,
        "longitud": -66.565804
    },
    {
        "id": 526,
        "ciudad": "Kumi Montón",
        "latitud": -20.816667,
        "longitud": -64.933333
    },
    {
        "id": 527,
        "ciudad": "La Angostura",
        "latitud": -17.5275,
        "longitud": -66.085556
    },
    {
        "id": 528,
        "ciudad": "La Angostura_C_TJA",
        "latitud": -21.7,
        "longitud": -64.6
    },
    {
        "id": 529,
        "ciudad": "La Asunta",
        "latitud": -16.126667,
        "longitud": -67.196667
    },
    {
        "id": 530,
        "ciudad": "La Asunta_H (GPRS)",
        "latitud": -16.150988,
        "longitud": -67.177703
    },
    {
        "id": 531,
        "ciudad": "La Barranca  (Chuquisaca)",
        "latitud": -18.9839,
        "longitud": -65.3028
    },
    {
        "id": 532,
        "ciudad": "La Belgica",
        "latitud": -17.55,
        "longitud": -63.216667
    },
    {
        "id": 533,
        "ciudad": "La Brecha",
        "latitud": -19.466667,
        "longitud": -62.55
    },
    {
        "id": 534,
        "ciudad": "La Cabaña",
        "latitud": -21.583333,
        "longitud": -64.616667
    },
    {
        "id": 535,
        "ciudad": "La Colmena",
        "latitud": -21.6675,
        "longitud": -64.179167
    },
    {
        "id": 536,
        "ciudad": "La Cumbre",
        "latitud": -17.35,
        "longitud": -66.233333
    },
    {
        "id": 537,
        "ciudad": "La Guardia",
        "latitud": -17.866667,
        "longitud": -63.316667
    },
    {
        "id": 538,
        "ciudad": "La Jota (Chimore)",
        "latitud": -16.995,
        "longitud": -65.171389
    },
    {
        "id": 539,
        "ciudad": "La Joya AT",
        "latitud": -17.775,
        "longitud": -67.497222
    },
    {
        "id": 540,
        "ciudad": "La Junta SEARPI",
        "latitud": -18.3,
        "longitud": -63.6
    },
    {
        "id": 541,
        "ciudad": "La Madona",
        "latitud": -19.033333,
        "longitud": -65.233333
    },
    {
        "id": 542,
        "ciudad": "La Mamora",
        "latitud": -22.178056,
        "longitud": -64.664444
    },
    {
        "id": 543,
        "ciudad": "La Mendoza",
        "latitud": -19.347778,
        "longitud": -65.9575
    },
    {
        "id": 544,
        "ciudad": "La Merced",
        "latitud": -22.024657,
        "longitud": -64.676742
    },
    {
        "id": 545,
        "ciudad": "La Palca Pti",
        "latitud": -18.75,
        "longitud": -66.016667
    },
    {
        "id": 546,
        "ciudad": "La Palma",
        "latitud": -18.933333,
        "longitud": -65.116667
    },
    {
        "id": 547,
        "ciudad": "La Paz",
        "latitud": -16.5,
        "longitud": -68.15
    },
    {
        "id": 548,
        "ciudad": "La Ramada",
        "latitud": -17.55,
        "longitud": -66.466667
    },
    {
        "id": 549,
        "ciudad": "La Tamborada",
        "latitud": -17.448611,
        "longitud": -66.135556
    },
    {
        "id": 550,
        "ciudad": "La Torre",
        "latitud": -20.615833,
        "longitud": -65.140833
    },
    {
        "id": 551,
        "ciudad": "La Ventolera",
        "latitud": -21.683333,
        "longitud": -64.616667
    },
    {
        "id": 552,
        "ciudad": "La Vertiente",
        "latitud": -21.347222,
        "longitud": -63.287222
    },
    {
        "id": 553,
        "ciudad": "La Viña",
        "latitud": -17.966667,
        "longitud": -65.85
    },
    {
        "id": 554,
        "ciudad": "La Violeta",
        "latitud": -17.347222,
        "longitud": -66.231667
    },
    {
        "id": 555,
        "ciudad": "La Violeta (Satelital)",
        "latitud": -17.5639,
        "longitud": -66.465599
    },
    {
        "id": 556,
        "ciudad": "Laboratorio Hidraulica UMSS",
        "latitud": -17.443611,
        "longitud": -65.171389
    },
    {
        "id": 557,
        "ciudad": "Ladera Centro",
        "latitud": -21.65,
        "longitud": -64.533333
    },
    {
        "id": 558,
        "ciudad": "Lago Toro",
        "latitud": -20.066667,
        "longitud": -66.15
    },
    {
        "id": 559,
        "ciudad": "Lago Uru Uru (GPRS)",
        "latitud": -18.1619,
        "longitud": -67.1508
    },
    {
        "id": 560,
        "ciudad": "Laguna Colorada",
        "latitud": -22.172222,
        "longitud": -67.8175
    },
    {
        "id": 561,
        "ciudad": "Laguna Colorada (Satelital)",
        "latitud": -22.301399,
        "longitud": -67.876404
    },
    {
        "id": 562,
        "ciudad": "Laguna Tuni - GPRS",
        "latitud": -16.2425,
        "longitud": -68.228897
    },
    {
        "id": 563,
        "ciudad": "Lagunillas",
        "latitud": -20.433333,
        "longitud": -63.25
    },
    {
        "id": 564,
        "ciudad": "Lahuachaca Maestranza (COPESA)",
        "latitud": -17.3925,
        "longitud": -67.681944
    },
    {
        "id": 565,
        "ciudad": "Lahuachama (GPRS)",
        "latitud": -17.56724,
        "longitud": -65.207085
    },
    {
        "id": 566,
        "ciudad": "Laja",
        "latitud": -16.533333,
        "longitud": -68.383333
    },
    {
        "id": 567,
        "ciudad": "Lajas HCA (GPRS)",
        "latitud": -21.3822,
        "longitud": -64.746399
    },
    {
        "id": 568,
        "ciudad": "Lambate",
        "latitud": -16.6,
        "longitud": -67.7
    },
    {
        "id": 569,
        "ciudad": "Lamboyo",
        "latitud": -19.071667,
        "longitud": -64.810556
    },
    {
        "id": 570,
        "ciudad": "Las Carreras",
        "latitud": -21.183333,
        "longitud": -65.2
    },
    {
        "id": 571,
        "ciudad": "Las Panosas",
        "latitud": -21.538333,
        "longitud": -64.726944
    },
    {
        "id": 572,
        "ciudad": "Laykacota",
        "latitud": -16.504741,
        "longitud": -68.123566
    },
    {
        "id": 573,
        "ciudad": "Laykacota LP (Satelital)",
        "latitud": -16.504762,
        "longitud": -68.123559
    },
    {
        "id": 574,
        "ciudad": "Laykacota-GPRS",
        "latitud": -16.504761,
        "longitud": -68.123542
    },
    {
        "id": 575,
        "ciudad": "Leon Cancha",
        "latitud": -21.178333,
        "longitud": -64.715278
    },
    {
        "id": 576,
        "ciudad": "Licoma",
        "latitud": -16.55,
        "longitud": -67.233333
    },
    {
        "id": 577,
        "ciudad": "Llallagua",
        "latitud": -18.425,
        "longitud": -66.560278
    },
    {
        "id": 578,
        "ciudad": "Llica",
        "latitud": -19.85,
        "longitud": -68.25
    },
    {
        "id": 579,
        "ciudad": "Locotal",
        "latitud": -16.983333,
        "longitud": -66.683333
    },
    {
        "id": 580,
        "ciudad": "Los Fierros",
        "latitud": -16.5,
        "longitud": -64.666667
    },
    {
        "id": 581,
        "ciudad": "Los Negros",
        "latitud": -18.047778,
        "longitud": -64.1175
    },
    {
        "id": 582,
        "ciudad": "Los Negros (GPRS)",
        "latitud": -18.0478,
        "longitud": -64.1175
    },
    {
        "id": 583,
        "ciudad": "Los Tojos SEARPI",
        "latitud": -18.516667,
        "longitud": -63.616667
    },
    {
        "id": 584,
        "ciudad": "Luribay",
        "latitud": -17.04589,
        "longitud": -67.6686
    },
    {
        "id": 585,
        "ciudad": "Luribay (Satelital)",
        "latitud": -17.061399,
        "longitud": -67.661903
    },
    {
        "id": 586,
        "ciudad": "Macha",
        "latitud": -18.816667,
        "longitud": -66.033333
    },
    {
        "id": 587,
        "ciudad": "Machacamarca (EuroClima)",
        "latitud": -17.528938,
        "longitud": -68.533523
    },
    {
        "id": 588,
        "ciudad": "Machacamarca_ENFE",
        "latitud": -18.176111,
        "longitud": -67.02
    },
    {
        "id": 589,
        "ciudad": "Macharety",
        "latitud": -20.813611,
        "longitud": -63.36
    },
    {
        "id": 590,
        "ciudad": "Machigua",
        "latitud": -20.958333,
        "longitud": -64.141944
    },
    {
        "id": 591,
        "ciudad": "Macuñucu_H",
        "latitud": -17.983333,
        "longitud": -63.6
    },
    {
        "id": 592,
        "ciudad": "Magdalena",
        "latitud": -13.261675,
        "longitud": -64.059345
    },
    {
        "id": 593,
        "ciudad": "Magdalena Aeropuerto",
        "latitud": -13.261111,
        "longitud": -64.059722
    },
    {
        "id": 594,
        "ciudad": "Mairana",
        "latitud": -18.1,
        "longitud": -63.95
    },
    {
        "id": 595,
        "ciudad": "Malaga",
        "latitud": -17.235278,
        "longitud": -65.816667
    },
    {
        "id": 596,
        "ciudad": "Mallachuma_H",
        "latitud": -16.85,
        "longitud": -67.666667
    },
    {
        "id": 597,
        "ciudad": "Mallasa",
        "latitud": -16.55,
        "longitud": -68.083333
    },
    {
        "id": 598,
        "ciudad": "Mapiri",
        "latitud": -15.312222,
        "longitud": -68.221944
    },
    {
        "id": 599,
        "ciudad": "Maragua H",
        "latitud": -19.033333,
        "longitud": -65.416667
    },
    {
        "id": 600,
        "ciudad": "Masicuri",
        "latitud": -18.983333,
        "longitud": -63.7
    },
    {
        "id": 601,
        "ciudad": "Mataral",
        "latitud": -18.116667,
        "longitud": -64.216667
    },
    {
        "id": 602,
        "ciudad": "Mataral (GPRS)",
        "latitud": -18.130301,
        "longitud": -64.216103
    },
    {
        "id": 603,
        "ciudad": "Mayca Mayu",
        "latitud": -17.233333,
        "longitud": -66.35
    },
    {
        "id": 604,
        "ciudad": "Mcal Estigarribia Paraguay",
        "latitud": -22.030556,
        "longitud": -60.618889
    },
    {
        "id": 605,
        "ciudad": "Mecapaca",
        "latitud": -16.6676855,
        "longitud": -68.0170478
    },
    {
        "id": 606,
        "ciudad": "Mecapaca_M (GPRS)",
        "latitud": -16.67064,
        "longitud": -68.019973
    },
    {
        "id": 607,
        "ciudad": "Mejillones",
        "latitud": -21.7,
        "longitud": -67.366667
    },
    {
        "id": 608,
        "ciudad": "Miguillas",
        "latitud": -16.45,
        "longitud": -67.216667
    },
    {
        "id": 609,
        "ciudad": "Milla Milla (euroclima)",
        "latitud": -17.456211,
        "longitud": -67.557379
    },
    {
        "id": 610,
        "ciudad": "Millares_H",
        "latitud": -19.416667,
        "longitud": -65.183333
    },
    {
        "id": 611,
        "ciudad": "Millipunku",
        "latitud": -16.5,
        "longitud": -68.033333
    },
    {
        "id": 612,
        "ciudad": "Milluni",
        "latitud": -16.333333,
        "longitud": -68.166667
    },
    {
        "id": 613,
        "ciudad": "Milluni EPSAS",
        "latitud": -16.317778,
        "longitud": -68.144167
    },
    {
        "id": 614,
        "ciudad": "Mina Bolsa Negra",
        "latitud": -16.55,
        "longitud": -67.8
    },
    {
        "id": 615,
        "ciudad": "Minachi_H",
        "latitud": -16.666667,
        "longitud": -67.666667
    },
    {
        "id": 616,
        "ciudad": "Minero (Unagro)",
        "latitud": -17.11,
        "longitud": -63.241667
    },
    {
        "id": 617,
        "ciudad": "Misicuni",
        "latitud": -17.09,
        "longitud": -66.327222
    },
    {
        "id": 618,
        "ciudad": "Misicuni (Autom)",
        "latitud": -17.090278,
        "longitud": -66.327222
    },
    {
        "id": 619,
        "ciudad": "Mision La Paz Argentina",
        "latitud": -22.377222,
        "longitud": -62.523056
    },
    {
        "id": 620,
        "ciudad": "Mizque",
        "latitud": -17.942778,
        "longitud": -65.337778
    },
    {
        "id": 621,
        "ciudad": "Mizque - SDC (GPRS)",
        "latitud": -17.957199,
        "longitud": -65.355598
    },
    {
        "id": 622,
        "ciudad": "Mizque H - SDC (GPRS)",
        "latitud": -17.921678,
        "longitud": -65.294197
    },
    {
        "id": 623,
        "ciudad": "Mochara",
        "latitud": -21.3,
        "longitud": -66.566667
    },
    {
        "id": 624,
        "ciudad": "Mocomoco",
        "latitud": -15.416667,
        "longitud": -69.133333
    },
    {
        "id": 625,
        "ciudad": "Mojo",
        "latitud": -21.829167,
        "longitud": -65.550556
    },
    {
        "id": 626,
        "ciudad": "Molinos Pampa",
        "latitud": -20.069722,
        "longitud": -65.337778
    },
    {
        "id": 627,
        "ciudad": "Molle Molle",
        "latitud": -17.692778,
        "longitud": -65.282222
    },
    {
        "id": 628,
        "ciudad": "Monte Puncu",
        "latitud": -17.583333,
        "longitud": -65.3
    },
    {
        "id": 629,
        "ciudad": "Monte Sud",
        "latitud": -21.416667,
        "longitud": -64.7
    },
    {
        "id": 630,
        "ciudad": "Monteagudo",
        "latitud": -19.8167,
        "longitud": -63.966702
    },
    {
        "id": 631,
        "ciudad": "Monteagudo_El Bañado",
        "latitud": -19.821111,
        "longitud": -63.963056
    },
    {
        "id": 632,
        "ciudad": "Montero SEARPI",
        "latitud": -17.333333,
        "longitud": -63.383333
    },
    {
        "id": 633,
        "ciudad": "Montero_Muyurina",
        "latitud": -17.360278,
        "longitud": -63.248056
    },
    {
        "id": 634,
        "ciudad": "Mora",
        "latitud": -18.45,
        "longitud": -63.216667
    },
    {
        "id": 635,
        "ciudad": "Moro Moro",
        "latitud": -18.35,
        "longitud": -64.316667
    },
    {
        "id": 636,
        "ciudad": "Morochata",
        "latitud": -17.216667,
        "longitud": -66.966667
    },
    {
        "id": 637,
        "ciudad": "Muyupampa",
        "latitud": -19.866667,
        "longitud": -63.766667
    },
    {
        "id": 638,
        "ciudad": "Muyuquiri",
        "latitud": -20.491389,
        "longitud": -65.146667
    },
    {
        "id": 639,
        "ciudad": "Ñacamiri Iguembecito",
        "latitud": -20.728333,
        "longitud": -64.0275
    },
    {
        "id": 640,
        "ciudad": "Ñancorainza",
        "latitud": -20.65,
        "longitud": -63.35
    },
    {
        "id": 641,
        "ciudad": "Naranjani",
        "latitud": -15.45,
        "longitud": -67.383333
    },
    {
        "id": 642,
        "ciudad": "Narvaez",
        "latitud": -21.408056,
        "longitud": -64.279444
    },
    {
        "id": 643,
        "ciudad": "Narvaez (GPRS)",
        "latitud": -21.4093246,
        "longitud": -64.2789741
    },
    {
        "id": 644,
        "ciudad": "Nazacara",
        "latitud": -16.916667,
        "longitud": -68.75
    },
    {
        "id": 645,
        "ciudad": "Ñoquejza",
        "latitud": -20.666667,
        "longitud": -65.833333
    },
    {
        "id": 646,
        "ciudad": "Nube",
        "latitud": -15.383333,
        "longitud": -67.683333
    },
    {
        "id": 647,
        "ciudad": "Ñucchu",
        "latitud": -19.204722,
        "longitud": -65.275556
    },
    {
        "id": 648,
        "ciudad": "Nuevo Mundo",
        "latitud": -18.996111,
        "longitud": -64.292778
    },
    {
        "id": 649,
        "ciudad": "Ñuqui",
        "latitud": -19.968611,
        "longitud": -65.303889
    },
    {
        "id": 650,
        "ciudad": "Obrajes Tja",
        "latitud": -21.501944,
        "longitud": -64.756389
    },
    {
        "id": 651,
        "ciudad": "Ocuri",
        "latitud": -18.833333,
        "longitud": -65.783333
    },
    {
        "id": 652,
        "ciudad": "Okinawa I",
        "latitud": -17.216667,
        "longitud": -62.883333
    },
    {
        "id": 653,
        "ciudad": "Okinawa II",
        "latitud": -17.416667,
        "longitud": -62.9
    },
    {
        "id": 654,
        "ciudad": "Omereque - SDC (GPRS)",
        "latitud": -18.108101,
        "longitud": -64.905602
    },
    {
        "id": 655,
        "ciudad": "Opoqueri",
        "latitud": -18.536776,
        "longitud": -67.899884
    },
    {
        "id": 656,
        "ciudad": "Orinoca - UTO (GPRS)",
        "latitud": -18.971914,
        "longitud": -67.264548
    },
    {
        "id": 657,
        "ciudad": "Orinoca AT",
        "latitud": -18.968333,
        "longitud": -67.263056
    },
    {
        "id": 658,
        "ciudad": "Orinoca_H",
        "latitud": -18.968333,
        "longitud": -67.263056
    },
    {
        "id": 659,
        "ciudad": "Oronkota PTI",
        "latitud": -19.583333,
        "longitud": -64.833333
    },
    {
        "id": 661,
        "ciudad": "Oruro",
        "latitud": -17.9636,
        "longitud": -67.1516
    },
    {
        "id": 662,
        "ciudad": "Oruro Aeropuerto",
        "latitud": -17.952778,
        "longitud": -67.079722
    },
    {
        "id": 663,
        "ciudad": "Oruro_ENFE",
        "latitud": -17.974167,
        "longitud": -67.109444
    },
    {
        "id": 664,
        "ciudad": "Otavi",
        "latitud": -20.15,
        "longitud": -65.35
    },
    {
        "id": 665,
        "ciudad": "Ovejuyo",
        "latitud": -16.533333,
        "longitud": -68.05
    },
    {
        "id": 666,
        "ciudad": "Paccha_H",
        "latitud": -18.966667,
        "longitud": -65.016667
    },
    {
        "id": 667,
        "ciudad": "Padcaya",
        "latitud": -21.883333,
        "longitud": -64.716667
    },
    {
        "id": 668,
        "ciudad": "Padcoyo_H",
        "latitud": -20.236111,
        "longitud": -65.1575
    },
    {
        "id": 669,
        "ciudad": "Padilla",
        "latitud": -19.302222,
        "longitud": -64.302222
    },
    {
        "id": 670,
        "ciudad": "Padilla (Satelital)",
        "latitud": -19.3906,
        "longitud": -64.555603
    },
    {
        "id": 671,
        "ciudad": "Paicho Centro",
        "latitud": -21.145278,
        "longitud": -64.954444
    },
    {
        "id": 673,
        "ciudad": "Pailon - Pozo del Tigre (GPRS)",
        "latitud": -17.588916,
        "longitud": -61.995189
    },
    {
        "id": 674,
        "ciudad": "Pairumani",
        "latitud": -17.366111,
        "longitud": -66.318611
    },
    {
        "id": 675,
        "ciudad": "Pajonal",
        "latitud": -21.503056,
        "longitud": -64.170556
    },
    {
        "id": 676,
        "ciudad": "Palca CBBA",
        "latitud": -17.183333,
        "longitud": -66.083333
    },
    {
        "id": 677,
        "ciudad": "Palca Grande",
        "latitud": -20.740556,
        "longitud": -65.235556
    },
    {
        "id": 678,
        "ciudad": "Palca Grande (GPRS)",
        "latitud": -20.742201,
        "longitud": -65.240303
    },
    {
        "id": 679,
        "ciudad": "Palca Higueras",
        "latitud": -20.683333,
        "longitud": -65.433333
    },
    {
        "id": 680,
        "ciudad": "Palca_LP",
        "latitud": -16.560556,
        "longitud": -67.951389
    },
    {
        "id": 681,
        "ciudad": "Palcoma",
        "latitud": -16.516667,
        "longitud": -68.133333
    },
    {
        "id": 682,
        "ciudad": "Palmar Chico",
        "latitud": -21.866667,
        "longitud": -63.6
    },
    {
        "id": 683,
        "ciudad": "Palmar Grande",
        "latitud": -21.531389,
        "longitud": -63.441944
    },
    {
        "id": 684,
        "ciudad": "Palmar Pampa",
        "latitud": -17.083333,
        "longitud": -65.483333
    },
    {
        "id": 685,
        "ciudad": "Palo Marcado (H)",
        "latitud": -21.454722,
        "longitud": -63.108056
    },
    {
        "id": 686,
        "ciudad": "Palos Blancos",
        "latitud": -21.415,
        "longitud": -63.781389
    },
    {
        "id": 687,
        "ciudad": "Palos Blancos S.(GPRS)",
        "latitud": -15.66805556,
        "longitud": -67.12444444
    },
    {
        "id": 688,
        "ciudad": "Palos Blancos_H (GPRS)",
        "latitud": -15.557601,
        "longitud": -67.374183
    },
    {
        "id": 689,
        "ciudad": "Palos Blancos_M (GPRS)",
        "latitud": -15.56095,
        "longitud": -67.299618
    },
    {
        "id": 690,
        "ciudad": "Pampa Grande LP",
        "latitud": -17.5,
        "longitud": -68.166667
    },
    {
        "id": 691,
        "ciudad": "Pampa Soico",
        "latitud": -19.433333,
        "longitud": -65.783333
    },
    {
        "id": 692,
        "ciudad": "Pampahasi",
        "latitud": -16.5,
        "longitud": -68.116667
    },
    {
        "id": 693,
        "ciudad": "Pampas de Lequezana",
        "latitud": -19.597778,
        "longitud": -65.321111
    },
    {
        "id": 694,
        "ciudad": "Pampas de Padilla (SAT)",
        "latitud": -19.28025065,
        "longitud": -64.32992833
    },
    {
        "id": 695,
        "ciudad": "PampasAzurduy_EM (SAT)",
        "latitud": -20.101896,
        "longitud": -64.404191
    },
    {
        "id": 696,
        "ciudad": "Pando",
        "latitud": -11.0209,
        "longitud": -68.7734
    },
    {
        "id": 697,
        "ciudad": "Paniagua_M (GPRS)",
        "latitud": -15.594322,
        "longitud": -68.082733
    },
    {
        "id": 698,
        "ciudad": "Parabano SEARPI",
        "latitud": -18.083333,
        "longitud": -63.433333
    },
    {
        "id": 699,
        "ciudad": "Paracti",
        "latitud": -17.209967,
        "longitud": -65.822096
    },
    {
        "id": 700,
        "ciudad": "Paraiso",
        "latitud": -16.25,
        "longitud": -62.166667
    },
    {
        "id": 701,
        "ciudad": "Parotani",
        "latitud": -17.566111,
        "longitud": -66.343611
    },
    {
        "id": 702,
        "ciudad": "Parotani_ENFE",
        "latitud": -17.563056,
        "longitud": -66.340833
    },
    {
        "id": 703,
        "ciudad": "Parque Lomas de Arena",
        "latitud": -17.9,
        "longitud": -63.15
    },
    {
        "id": 704,
        "ciudad": "Parque Tunari SDC (Autom)",
        "latitud": -17.349167,
        "longitud": -66.156389
    },
    {
        "id": 705,
        "ciudad": "Pasajes (GPRS)",
        "latitud": -21.746112,
        "longitud": -65.088272
    },
    {
        "id": 706,
        "ciudad": "Pasankeri ",
        "latitud": -16.5235516,
        "longitud": -68.1426677
    },
    {
        "id": 707,
        "ciudad": "Pasorapa (GPRS)",
        "latitud": -18.323099,
        "longitud": -64.678902
    },
    {
        "id": 708,
        "ciudad": "Pasto Pata",
        "latitud": -16.633333,
        "longitud": -67.433333
    },
    {
        "id": 709,
        "ciudad": "Pata H",
        "latitud": -14.55,
        "longitud": -68.716667
    },
    {
        "id": 710,
        "ciudad": "Patacamaya ",
        "latitud": -17.238611,
        "longitud": -67.923056
    },
    {
        "id": 711,
        "ciudad": "Patacamaya (GPRS)",
        "latitud": -17.260837,
        "longitud": -67.942756
    },
    {
        "id": 712,
        "ciudad": "Patacamaya_ENFE",
        "latitud": -17.2375,
        "longitud": -67.9075
    },
    {
        "id": 713,
        "ciudad": "Pazña",
        "latitud": -18.599167,
        "longitud": -66.93
    },
    {
        "id": 714,
        "ciudad": "Pazña_ENFE",
        "latitud": -18.598056,
        "longitud": -66.920833
    },
    {
        "id": 715,
        "ciudad": "Pelechuco",
        "latitud": -14.816667,
        "longitud": -69.083333
    },
    {
        "id": 716,
        "ciudad": "Peña Colorada SEARPI",
        "latitud": -18.183333,
        "longitud": -63.8
    },
    {
        "id": 717,
        "ciudad": "Peñas",
        "latitud": -16.283333,
        "longitud": -68.633333
    },
    {
        "id": 718,
        "ciudad": "Peroto",
        "latitud": -17.933333,
        "longitud": -63.783333
    },
    {
        "id": 719,
        "ciudad": "Pillapi",
        "latitud": -15.483333,
        "longitud": -68.766667
    },
    {
        "id": 720,
        "ciudad": "Pinaya",
        "latitud": -16.638333,
        "longitud": -67.858333
    },
    {
        "id": 721,
        "ciudad": "Pinos Sud",
        "latitud": -21.734722,
        "longitud": -64.878333
    },
    {
        "id": 722,
        "ciudad": "Pirhuani",
        "latitud": -20.15,
        "longitud": -64.633333
    },
    {
        "id": 723,
        "ciudad": "Pisly",
        "latitud": -17.25,
        "longitud": -66.016667
    },
    {
        "id": 724,
        "ciudad": "Piso Firme",
        "latitud": -13.650556,
        "longitud": -61.807778
    },
    {
        "id": 725,
        "ciudad": "Planta Cahua H",
        "latitud": -16.333333,
        "longitud": -68
    },
    {
        "id": 726,
        "ciudad": "Planta Corani",
        "latitud": -17.208333,
        "longitud": -65.873611
    },
    {
        "id": 727,
        "ciudad": "Planta Miguillas",
        "latitud": -16.883333,
        "longitud": -67.35
    },
    {
        "id": 728,
        "ciudad": "Plaza Villarroel",
        "latitud": -16.48413,
        "longitud": -68.121272
    },
    {
        "id": 729,
        "ciudad": "Poco Poco",
        "latitud": -19.333333,
        "longitud": -65.033333
    },
    {
        "id": 730,
        "ciudad": "Pocoata",
        "latitud": -18.7,
        "longitud": -66.166667
    },
    {
        "id": 731,
        "ciudad": "Pocona",
        "latitud": -17.65,
        "longitud": -65.366667
    },
    {
        "id": 732,
        "ciudad": "Pocona - SDC (GPRS)",
        "latitud": -17.666102,
        "longitud": -65.312558
    },
    {
        "id": 733,
        "ciudad": "Pojo",
        "latitud": -17.7575,
        "longitud": -64.863611
    },
    {
        "id": 734,
        "ciudad": "Pojo - SDC (GPRS)",
        "latitud": -17.752199,
        "longitud": -64.866402
    },
    {
        "id": 735,
        "ciudad": "Pojpo_H",
        "latitud": -18.783333,
        "longitud": -65.316667
    },
    {
        "id": 736,
        "ciudad": "Pongo_H",
        "latitud": -16.333333,
        "longitud": -68
    },
    {
        "id": 737,
        "ciudad": "Poopó (GPRS)",
        "latitud": -18.3828,
        "longitud": -66.9783
    },
    {
        "id": 738,
        "ciudad": "Porco",
        "latitud": -19.798618,
        "longitud": -65.983547
    },
    {
        "id": 739,
        "ciudad": "Poroma (CHQ)",
        "latitud": -18.534167,
        "longitud": -65.425833
    },
    {
        "id": 740,
        "ciudad": "Poroma (LP)",
        "latitud": -17.166667,
        "longitud": -67.533333
    },
    {
        "id": 741,
        "ciudad": "Portachuelo",
        "latitud": -17.35,
        "longitud": -63.4
    },
    {
        "id": 742,
        "ciudad": "Postrervalle",
        "latitud": -18.483333,
        "longitud": -63.833333
    },
    {
        "id": 743,
        "ciudad": "Potolo",
        "latitud": -19.019722,
        "longitud": -65.516667
    },
    {
        "id": 744,
        "ciudad": "Potolo_M (GPRS)",
        "latitud": -19.023899,
        "longitud": -65.5411
    },
    {
        "id": 745,
        "ciudad": "Potosí",
        "latitud": -19.5436,
        "longitud": -65.719398
    },
    {
        "id": 747,
        "ciudad": "Potosi Aeropuerto",
        "latitud": -19.536667,
        "longitud": -65.720833
    },
    {
        "id": 748,
        "ciudad": "Potosi Los Pinos",
        "latitud": -19.562353,
        "longitud": -65.76233
    },
    {
        "id": 749,
        "ciudad": "Potosí SENAMHI",
        "latitud": -19.562778,
        "longitud": -65.761944
    },
    {
        "id": 750,
        "ciudad": "Potosi_ENFE",
        "latitud": -19.58,
        "longitud": -65.759444
    },
    {
        "id": 751,
        "ciudad": "Pozo Colorado Paraguay",
        "latitud": -23.497778,
        "longitud": -58.790278
    },
    {
        "id": 752,
        "ciudad": "Pratts Gill Paraguay",
        "latitud": -22.558333,
        "longitud": -61.56
    },
    {
        "id": 753,
        "ciudad": "Presa aItavicua_EM (SAT)",
        "latitud": -21.808959,
        "longitud": -63.649193
    },
    {
        "id": 754,
        "ciudad": "Presa Calderas CA (SAT)",
        "latitud": -21.449699,
        "longitud": -64.5783
    },
    {
        "id": 755,
        "ciudad": "Presa Chalviri_HM (GPRS)",
        "latitud": -19.6572,
        "longitud": -65.696098
    },
    {
        "id": 756,
        "ciudad": "Presa Escalerani_EHM (SAT)",
        "latitud": -17.187984,
        "longitud": -66.211107
    },
    {
        "id": 757,
        "ciudad": "Presa Escalerani_HM (SAT)",
        "latitud": -17.188101,
        "longitud": -66.211098
    },
    {
        "id": 758,
        "ciudad": "Presa Itavicua_EN (SAT)",
        "latitud": -21.809141,
        "longitud": -63.64957
    },
    {
        "id": 759,
        "ciudad": "Presa Misicuni (GPRS)",
        "latitud": -17.097867,
        "longitud": -66.332361
    },
    {
        "id": 760,
        "ciudad": "Presa San Jacinto CA (SAT)",
        "latitud": -21.6,
        "longitud": -64.7258
    },
    {
        "id": 761,
        "ciudad": "PresaWaraWara_EHM (SAT)",
        "latitud": -17.29758,
        "longitud": -66.125327
    },
    {
        "id": 762,
        "ciudad": "Presto",
        "latitud": -19.916667,
        "longitud": -64.933333
    },
    {
        "id": 763,
        "ciudad": "Puca Pila",
        "latitud": -18.083333,
        "longitud": -65.266667
    },
    {
        "id": 764,
        "ciudad": "Pucara",
        "latitud": -18.716667,
        "longitud": -64.183333
    },
    {
        "id": 765,
        "ciudad": "Pucarani",
        "latitud": -16.396111,
        "longitud": -68.474722
    },
    {
        "id": 766,
        "ciudad": "Puchuni",
        "latitud": -17.3,
        "longitud": -67.433333
    },
    {
        "id": 767,
        "ciudad": "Puente Arce",
        "latitud": -18.611389,
        "longitud": -65.155833
    },
    {
        "id": 768,
        "ciudad": "Puente Aruma",
        "latitud": -20.915556,
        "longitud": -64.111389
    },
    {
        "id": 769,
        "ciudad": "Puente Chiñata_H- SDC (GPRS)",
        "latitud": -17.404737,
        "longitud": -65.979491
    },
    {
        "id": 770,
        "ciudad": "Puente Décima_H (Autom)",
        "latitud": -17.394722,
        "longitud": -66.081944
    },
    {
        "id": 771,
        "ciudad": "Puente Gumucio_H (GPRS)",
        "latitud": -16.9739,
        "longitud": -65.388901
    },
    {
        "id": 772,
        "ciudad": "Puente Negro",
        "latitud": -16.5,
        "longitud": -68.15
    },
    {
        "id": 773,
        "ciudad": "Puente Omereque - SDC (GPRS)",
        "latitud": -18.129681,
        "longitud": -64.892362
    },
    {
        "id": 774,
        "ciudad": "Puente Pojo - SDC (GPRS)",
        "latitud": -17.753346,
        "longitud": -64.869611
    },
    {
        "id": 775,
        "ciudad": "Puente Sucre",
        "latitud": -19.353333,
        "longitud": -65.177222
    },
    {
        "id": 776,
        "ciudad": "Puente Taperas",
        "latitud": -18.15,
        "longitud": -64.683333
    },
    {
        "id": 777,
        "ciudad": "Puente Villa - Taquesi_H",
        "latitud": -16.4033,
        "longitud": -67.6422
    },
    {
        "id": 778,
        "ciudad": "Puente Villa (Chacala) H",
        "latitud": -16.383333,
        "longitud": -67.633333
    },
    {
        "id": 779,
        "ciudad": "Puerto Acosta",
        "latitud": -15.526667,
        "longitud": -69.253056
    },
    {
        "id": 780,
        "ciudad": "Puerto Almacen_H",
        "latitud": -14.8686,
        "longitud": -64.9708
    },
    {
        "id": 781,
        "ciudad": "Puerto Camacho_SC",
        "latitud": -18.866667,
        "longitud": -63.466667
    },
    {
        "id": 782,
        "ciudad": "Puerto Grether",
        "latitud": -17.183333,
        "longitud": -64.35
    },
    {
        "id": 783,
        "ciudad": "Puerto León",
        "latitud": -16.003889,
        "longitud": -67.586944
    },
    {
        "id": 784,
        "ciudad": "Puerto Linares",
        "latitud": -15.466667,
        "longitud": -67.550833
    },
    {
        "id": 785,
        "ciudad": "Puerto Margarita",
        "latitud": -21.190556,
        "longitud": -63.761389
    },
    {
        "id": 786,
        "ciudad": "Puerto Pailas",
        "latitud": -17.65,
        "longitud": -62.783333
    },
    {
        "id": 787,
        "ciudad": "Puerto Rico S.(GPRS)",
        "latitud": -11.239654,
        "longitud": -67.43762
    },
    {
        "id": 788,
        "ciudad": "Puerto Suarez",
        "latitud": -18.978901,
        "longitud": -57.819199
    },
    {
        "id": 789,
        "ciudad": "Puerto Suarez Aeropuerto",
        "latitud": -18.978889,
        "longitud": -57.819167
    },
    {
        "id": 790,
        "ciudad": "Puerto Suarez Aeropuerto (F)",
        "latitud": -18.978889,
        "longitud": -57.819167
    },
    {
        "id": 791,
        "ciudad": "Puerto Villarroel",
        "latitud": -16.837778,
        "longitud": -64.7925
    },
    {
        "id": 792,
        "ciudad": "Puerto Villarroel (Autom)",
        "latitud": -16.837778,
        "longitud": -64.7925
    },
    {
        "id": 793,
        "ciudad": "Puerto Villarroel (GPRS)",
        "latitud": -16.837797,
        "longitud": -64.792547
    },
    {
        "id": 794,
        "ciudad": "Puerto Villarroel_H (GPRS)",
        "latitud": -16.8379362,
        "longitud": -64.79219402
    },
    {
        "id": 795,
        "ciudad": "Puesto Fernández",
        "latitud": -17,
        "longitud": -63.233333
    },
    {
        "id": 796,
        "ciudad": "Puina",
        "latitud": -14.6,
        "longitud": -68.133333
    },
    {
        "id": 797,
        "ciudad": "Pulquina",
        "latitud": -18.083333,
        "longitud": -64.416667
    },
    {
        "id": 798,
        "ciudad": "Puna",
        "latitud": -19.797222,
        "longitud": -65.503333
    },
    {
        "id": 799,
        "ciudad": "Punata (GPRS)",
        "latitud": -17.5336,
        "longitud": -65.826103
    },
    {
        "id": 800,
        "ciudad": "Punilla",
        "latitud": -18.983333,
        "longitud": -65.308333
    },
    {
        "id": 801,
        "ciudad": "Putucuni B",
        "latitud": -17.566667,
        "longitud": -66.2
    },
    {
        "id": 802,
        "ciudad": "Putucuni Calientes (GPRS)",
        "latitud": -17.011589,
        "longitud": -66.552734
    },
    {
        "id": 803,
        "ciudad": "Queara",
        "latitud": -14.7,
        "longitud": -69.1
    },
    {
        "id": 804,
        "ciudad": "Quebrada de Cajas",
        "latitud": -21.160556,
        "longitud": -64.403333
    },
    {
        "id": 805,
        "ciudad": "Quetena Chico",
        "latitud": -22.19409,
        "longitud": -67.341578
    },
    {
        "id": 806,
        "ciudad": "Quiabaya",
        "latitud": -15.583333,
        "longitud": -68.766667
    },
    {
        "id": 807,
        "ciudad": "Quila Quila H",
        "latitud": -19.133333,
        "longitud": -65.366667
    },
    {
        "id": 808,
        "ciudad": "Quila Quila_M (GPRS)",
        "latitud": -19.118597,
        "longitud": -65.37752
    },
    {
        "id": 809,
        "ciudad": "Quillacas (GPRS)",
        "latitud": -19.2274,
        "longitud": -66.9602
    },
    {
        "id": 810,
        "ciudad": "Quilviri H",
        "latitud": -16.833333,
        "longitud": -68.116667
    },
    {
        "id": 811,
        "ciudad": "Quime",
        "latitud": -16.983333,
        "longitud": -67.266667
    },
    {
        "id": 812,
        "ciudad": "Quimome",
        "latitud": -16.683333,
        "longitud": -61.166667
    },
    {
        "id": 813,
        "ciudad": "Quiriria",
        "latitud": -17.9,
        "longitud": -65.916667
    },
    {
        "id": 814,
        "ciudad": "Quiroga",
        "latitud": -18.425,
        "longitud": -65.217778
    },
    {
        "id": 815,
        "ciudad": "Quirusillas",
        "latitud": -18.333333,
        "longitud": -63.95
    },
    {
        "id": 816,
        "ciudad": "Radiosondeo - El Alto",
        "latitud": -16.505422,
        "longitud": -68.171876
    },
    {
        "id": 817,
        "ciudad": "Ramadas Cbba",
        "latitud": -17.216667,
        "longitud": -66.25
    },
    {
        "id": 818,
        "ciudad": "Ramadas PTI",
        "latitud": -21.083333,
        "longitud": -65.633333
    },
    {
        "id": 819,
        "ciudad": "Rancho Chávez (GPRS)",
        "latitud": -18.230801,
        "longitud": -64.058098
    },
    {
        "id": 820,
        "ciudad": "Ravelo",
        "latitud": -18.804722,
        "longitud": -65.511944
    },
    {
        "id": 821,
        "ciudad": "Ravelo_M (GPRS)",
        "latitud": -18.801111,
        "longitud": -65.523889
    },
    {
        "id": 822,
        "ciudad": "Redencion Pampa",
        "latitud": -18.8278,
        "longitud": -64.6261
    },
    {
        "id": 823,
        "ciudad": "Refinería_Cbba",
        "latitud": -17.451667,
        "longitud": -66.124444
    },
    {
        "id": 824,
        "ciudad": "Rejara",
        "latitud": -22.016667,
        "longitud": -64.983333
    },
    {
        "id": 825,
        "ciudad": "Reyes",
        "latitud": -14.3042,
        "longitud": -67.353302
    },
    {
        "id": 826,
        "ciudad": "Reyes Aeropuerto",
        "latitud": -14.302778,
        "longitud": -67.352778
    },
    {
        "id": 827,
        "ciudad": "Riberalta",
        "latitud": -11.0067,
        "longitud": -66.076103
    },
    {
        "id": 828,
        "ciudad": "Riberalta Aeropuerto",
        "latitud": -11.006667,
        "longitud": -66.076111
    },
    {
        "id": 829,
        "ciudad": "Riberalta SENAMHI",
        "latitud": -11,
        "longitud": -66
    },
    {
        "id": 830,
        "ciudad": "Riberalta_H (GPRS)",
        "latitud": -10.981896,
        "longitud": -66.053588
    },
    {
        "id": 831,
        "ciudad": "Rincon Cañas H",
        "latitud": -21.966667,
        "longitud": -64.9
    },
    {
        "id": 832,
        "ciudad": "Rio Azero",
        "latitud": -19.6,
        "longitud": -64.083333
    },
    {
        "id": 833,
        "ciudad": "Rio Chapare (GPRS)",
        "latitud": -16.9667,
        "longitud": -65.383301
    },
    {
        "id": 834,
        "ciudad": "Rio Conchas",
        "latitud": -22.3,
        "longitud": -64.383333
    },
    {
        "id": 835,
        "ciudad": "Rio Grande_ENFE",
        "latitud": -20.821111,
        "longitud": -67.299167
    },
    {
        "id": 836,
        "ciudad": "Rio Mulato",
        "latitud": -19.683333,
        "longitud": -66.766667
    },
    {
        "id": 837,
        "ciudad": "Rio Mulatos_ENFE",
        "latitud": -19.701667,
        "longitud": -66.779167
    },
    {
        "id": 838,
        "ciudad": "Rio Rancho",
        "latitud": -17.9,
        "longitud": -66.916667
    },
    {
        "id": 839,
        "ciudad": "Rio Seco",
        "latitud": -16.483333,
        "longitud": -68.2
    },
    {
        "id": 840,
        "ciudad": "Río Seco Julian Apaza-D5",
        "latitud": -16.488017998975,
        "longitud": -68.2020770885918
    },
    {
        "id": 841,
        "ciudad": "Rio Seco_Sc",
        "latitud": -18.65,
        "longitud": -63.233333
    },
    {
        "id": 842,
        "ciudad": "Rio Tahuamanu (GPRS)",
        "latitud": -11.2711,
        "longitud": -68.7369
    },
    {
        "id": 843,
        "ciudad": "Robore",
        "latitud": -18.3297,
        "longitud": -59.763302
    },
    {
        "id": 844,
        "ciudad": "Roboré Aeropuerto",
        "latitud": -18.329722,
        "longitud": -59.763333
    },
    {
        "id": 845,
        "ciudad": "Rodeo",
        "latitud": -17.616667,
        "longitud": -65.633333
    },
    {
        "id": 846,
        "ciudad": "Rosario del Ingre",
        "latitud": -20.580833,
        "longitud": -63.894722
    },
    {
        "id": 847,
        "ciudad": "Rosillas_h",
        "latitud": -21.916667,
        "longitud": -64.766667
    },
    {
        "id": 848,
        "ciudad": "Rumi Corral",
        "latitud": -17.716667,
        "longitud": -65.783333
    },
    {
        "id": 849,
        "ciudad": "Rurrenabaque",
        "latitud": -14.4294,
        "longitud": -67.5028
    },
    {
        "id": 850,
        "ciudad": "Rurrenabaque Aeropuerto",
        "latitud": -14.429444,
        "longitud": -67.502778
    },
    {
        "id": 851,
        "ciudad": "Rurrenabaque_H (GPRS)",
        "latitud": -14.443184,
        "longitud": -67.534104
    },
    {
        "id": 852,
        "ciudad": "Sacaba",
        "latitud": -17.033333,
        "longitud": -66.033333
    },
    {
        "id": 853,
        "ciudad": "Sacabamba",
        "latitud": -17.803889,
        "longitud": -65.800833
    },
    {
        "id": 854,
        "ciudad": "Sacabamba (GPRS)",
        "latitud": -17.8039,
        "longitud": -65.800797
    },
    {
        "id": 855,
        "ciudad": "Sacabamba_ENFE",
        "latitud": -17.818056,
        "longitud": -65.776111
    },
    {
        "id": 856,
        "ciudad": "Sacabambilla Baja",
        "latitud": -17.466667,
        "longitud": -65.766667
    },
    {
        "id": 857,
        "ciudad": "Sacabaya",
        "latitud": -18.572199,
        "longitud": -68.789219
    },
    {
        "id": 858,
        "ciudad": "Sacaca",
        "latitud": -18.073096,
        "longitud": -66.380663
    },
    {
        "id": 859,
        "ciudad": "Sacacani_M (GPRS)",
        "latitud": -16.67086354,
        "longitud": -68.50011171
    },
    {
        "id": 860,
        "ciudad": "Sachapera",
        "latitud": -21.660556,
        "longitud": -63.550556
    },
    {
        "id": 861,
        "ciudad": "Saipina",
        "latitud": -18.083333,
        "longitud": -64.583333
    },
    {
        "id": 862,
        "ciudad": "Sajama",
        "latitud": -18.137222,
        "longitud": -68.974167
    },
    {
        "id": 863,
        "ciudad": "Saladito Centro",
        "latitud": -21.318889,
        "longitud": -64.122778
    },
    {
        "id": 864,
        "ciudad": "Salinas",
        "latitud": -21.771667,
        "longitud": -64.23
    },
    {
        "id": 865,
        "ciudad": "Salinas (GPRS)",
        "latitud": -21.793088,
        "longitud": -64.23549
    },
    {
        "id": 866,
        "ciudad": "Salinas de Garci M.(Satelital)",
        "latitud": -19.6508,
        "longitud": -67.669258
    },
    {
        "id": 867,
        "ciudad": "Salinas G. De Mendoza",
        "latitud": -19.633333,
        "longitud": -67.683333
    },
    {
        "id": 868,
        "ciudad": "Salla",
        "latitud": -17.169875,
        "longitud": -67.606446
    },
    {
        "id": 869,
        "ciudad": "Salla (EuroClima)",
        "latitud": -17.169563,
        "longitud": -67.606577
    },
    {
        "id": 870,
        "ciudad": "Salo_M (GPRS)",
        "latitud": -21.242628,
        "longitud": -65.774782
    },
    {
        "id": 871,
        "ciudad": "Salto Leon_h",
        "latitud": -20.1,
        "longitud": -66.683333
    },
    {
        "id": 872,
        "ciudad": "Sama Cumbre",
        "latitud": -21.491667,
        "longitud": -64.981944
    },
    {
        "id": 873,
        "ciudad": "Sama Iscayachi",
        "latitud": -21.473611,
        "longitud": -64.951389
    },
    {
        "id": 874,
        "ciudad": "Samaipata",
        "latitud": -18.166667,
        "longitud": -63.95
    },
    {
        "id": 875,
        "ciudad": "Samaipata SEARPI",
        "latitud": -18.166667,
        "longitud": -63.866667
    },
    {
        "id": 876,
        "ciudad": "Samasa",
        "latitud": -19.483333,
        "longitud": -65.683333
    },
    {
        "id": 877,
        "ciudad": "San Agustin",
        "latitud": -21.147778,
        "longitud": -67.675556
    },
    {
        "id": 878,
        "ciudad": "San Agustin_tja",
        "latitud": -21.533333,
        "longitud": -64.516667
    },
    {
        "id": 879,
        "ciudad": "San Andres",
        "latitud": -21.623333,
        "longitud": -64.815
    },
    {
        "id": 880,
        "ciudad": "San Andres De Machaca",
        "latitud": -16.966667,
        "longitud": -68.966667
    },
    {
        "id": 881,
        "ciudad": "San Andres de Machaca_M (GPRS)",
        "latitud": -16.955299,
        "longitud": -68.969398
    },
    {
        "id": 882,
        "ciudad": "San Antonio de Esmoruco",
        "latitud": -21.951667,
        "longitud": -66.519444
    },
    {
        "id": 883,
        "ciudad": "San Antonio_Sc",
        "latitud": -20,
        "longitud": -63.183333
    },
    {
        "id": 884,
        "ciudad": "San Benito",
        "latitud": -17.526389,
        "longitud": -65.903889
    },
    {
        "id": 885,
        "ciudad": "San Benito Aut",
        "latitud": -17.528611,
        "longitud": -65.904722
    },
    {
        "id": 886,
        "ciudad": "San Benito SENAMHI (GPRS)",
        "latitud": -17.526335,
        "longitud": -65.904106
    },
    {
        "id": 887,
        "ciudad": "San Bernardo",
        "latitud": -21.441389,
        "longitud": -63.2125
    },
    {
        "id": 888,
        "ciudad": "San Blas",
        "latitud": -21.533333,
        "longitud": -64.716667
    },
    {
        "id": 889,
        "ciudad": "San Borja",
        "latitud": -14.8583,
        "longitud": -66.738602
    },
    {
        "id": 890,
        "ciudad": "San Borja Aeropuerto",
        "latitud": -14.858333,
        "longitud": -66.738611
    },
    {
        "id": 891,
        "ciudad": "San Buenaventura Camp.",
        "latitud": -14.4225,
        "longitud": -67.547778
    },
    {
        "id": 892,
        "ciudad": "San Buenaventura_M (GPRS)",
        "latitud": -14.434509,
        "longitud": -67.54277
    },
    {
        "id": 893,
        "ciudad": "San Calixto",
        "latitud": -16.495278,
        "longitud": -68.1325
    },
    {
        "id": 894,
        "ciudad": "San Cristobal_CBBA",
        "latitud": -16.833333,
        "longitud": -66.766667
    },
    {
        "id": 895,
        "ciudad": "San Francisco (SCZ)",
        "latitud": -15.333333,
        "longitud": -61.416667
    },
    {
        "id": 896,
        "ciudad": "San Francisco de Caramarca",
        "latitud": -17.45,
        "longitud": -66.316667
    },
    {
        "id": 897,
        "ciudad": "San Idelfonso",
        "latitud": -19.583333,
        "longitud": -65.75
    },
    {
        "id": 898,
        "ciudad": "San Ignacio de Moxos (GPRS)",
        "latitud": -14.96728,
        "longitud": -65.633019
    },
    {
        "id": 899,
        "ciudad": "San Ignacio de Moxos Aerop",
        "latitud": -14.966667,
        "longitud": -65.633333
    },
    {
        "id": 900,
        "ciudad": "San Ignacio de Velasco (GPRS)",
        "latitud": -16.381701,
        "longitud": -60.961899
    },
    {
        "id": 901,
        "ciudad": "San Ignacio de Velasco Aerop",
        "latitud": -16.381667,
        "longitud": -60.961944
    },
    {
        "id": 902,
        "ciudad": "San Ignacio S.(GPRS)",
        "latitud": -14.89416667,
        "longitud": -65.37777778
    },
    {
        "id": 903,
        "ciudad": "San Ignacio-PitágorasSRL",
        "latitud": -16.3998861,
        "longitud": -60.9907083333333
    },
    {
        "id": 904,
        "ciudad": "San Isidro",
        "latitud": -17.666667,
        "longitud": -63.633333
    },
    {
        "id": 905,
        "ciudad": "San Jacinto Barro negro",
        "latitud": -17.141944,
        "longitud": -65.708611
    },
    {
        "id": 906,
        "ciudad": "San Jacinto Sud",
        "latitud": -21.610278,
        "longitud": -64.72
    },
    {
        "id": 907,
        "ciudad": "San Jacinto_H (GPRS)",
        "latitud": -21.600599,
        "longitud": -64.7258
    },
    {
        "id": 908,
        "ciudad": "San Jacinto_M (GPRS)",
        "latitud": -21.600496,
        "longitud": -64.72574
    },
    {
        "id": 909,
        "ciudad": "San Javier",
        "latitud": -16.2714,
        "longitud": -62.470798
    },
    {
        "id": 910,
        "ciudad": "San Javier Aeropuerto",
        "latitud": -16.271389,
        "longitud": -62.470833
    },
    {
        "id": 911,
        "ciudad": "San Javier Aeropuerto (F)",
        "latitud": -16.271389,
        "longitud": -62.470833
    },
    {
        "id": 912,
        "ciudad": "San Joaquin",
        "latitud": -13.066117,
        "longitud": -64.674228
    },
    {
        "id": 913,
        "ciudad": "San Joaquin Aeropuerto",
        "latitud": -13.066086,
        "longitud": -64.674177
    },
    {
        "id": 914,
        "ciudad": "San Jose Alto",
        "latitud": -17.704444,
        "longitud": -67.778611
    },
    {
        "id": 915,
        "ciudad": "San Jose de Chiquitos",
        "latitud": -17.832199,
        "longitud": -60.744202
    },
    {
        "id": 916,
        "ciudad": "San Jose de Chiquitos Aerop",
        "latitud": -17.832222,
        "longitud": -60.744167
    },
    {
        "id": 917,
        "ciudad": "San Jose de Pampa Grande",
        "latitud": -21.683333,
        "longitud": -65.816667
    },
    {
        "id": 918,
        "ciudad": "San José de Uchupiamonas",
        "latitud": -14.15,
        "longitud": -68.116667
    },
    {
        "id": 919,
        "ciudad": "San Jose del Barrial",
        "latitud": -18.3,
        "longitud": -64.266667
    },
    {
        "id": 920,
        "ciudad": "San Josecito",
        "latitud": -21.1475,
        "longitud": -64.234722
    },
    {
        "id": 921,
        "ciudad": "San Juan de Yapacaní",
        "latitud": -17.25,
        "longitud": -63.833333
    },
    {
        "id": 922,
        "ciudad": "San Juan Del Potrero",
        "latitud": -17.963056,
        "longitud": -64.289167
    },
    {
        "id": 923,
        "ciudad": "San Juan del Rosario SEARPI",
        "latitud": -18.3,
        "longitud": -63.8
    },
    {
        "id": 924,
        "ciudad": "San Juan Huancollo",
        "latitud": -16.585556,
        "longitud": -68.966667
    },
    {
        "id": 925,
        "ciudad": "San Julian",
        "latitud": -16.881901,
        "longitud": -62.615402
    },
    {
        "id": 926,
        "ciudad": "San Julian - Comunidad Los Angeles (GPRS)",
        "latitud": -16.881901,
        "longitud": -62.615402
    },
    {
        "id": 927,
        "ciudad": "San Julian - Nucleo 32 (GPRS)",
        "latitud": -16.606559,
        "longitud": -62.945738
    },
    {
        "id": 928,
        "ciudad": "San Julian (GPRS)",
        "latitud": -16.915833,
        "longitud": -62.625833
    },
    {
        "id": 929,
        "ciudad": "San Lorenzo",
        "latitud": -21.416667,
        "longitud": -64.75
    },
    {
        "id": 930,
        "ciudad": "San Lucas",
        "latitud": -20.1025,
        "longitud": -65.133333
    },
    {
        "id": 931,
        "ciudad": "San Luis de Palqui",
        "latitud": -21.557778,
        "longitud": -65.135
    },
    {
        "id": 932,
        "ciudad": "San Martin",
        "latitud": -19.2761,
        "longitud": -67.6011
    },
    {
        "id": 933,
        "ciudad": "San Martin - EBC",
        "latitud": -16.566111,
        "longitud": -68.219444
    },
    {
        "id": 934,
        "ciudad": "San Mateo (CBBA)",
        "latitud": -17.033333,
        "longitud": -65.4
    },
    {
        "id": 935,
        "ciudad": "San Mateo_TJA",
        "latitud": -21.466667,
        "longitud": -64.75
    },
    {
        "id": 936,
        "ciudad": "San Matias",
        "latitud": -16.331699,
        "longitud": -58.3992
    },
    {
        "id": 937,
        "ciudad": "San Matias Aeropuerto",
        "latitud": -16.331667,
        "longitud": -58.399167
    },
    {
        "id": 938,
        "ciudad": "San Miguel",
        "latitud": -15.983333,
        "longitud": -60.95
    },
    {
        "id": 939,
        "ciudad": "San Miguel de Lipez",
        "latitud": -21.316667,
        "longitud": -66.066667
    },
    {
        "id": 940,
        "ciudad": "San Miguel_Jankocala CBBA",
        "latitud": -17.366667,
        "longitud": -66.333333
    },
    {
        "id": 941,
        "ciudad": "San Nicolas",
        "latitud": -21.716667,
        "longitud": -64.683333
    },
    {
        "id": 942,
        "ciudad": "San Onofre",
        "latitud": -17.066667,
        "longitud": -65.65
    },
    {
        "id": 943,
        "ciudad": "San Pablo de Lipez",
        "latitud": -21.683333,
        "longitud": -66.616667
    },
    {
        "id": 944,
        "ciudad": "San Pablo de Lipez (Satelital)",
        "latitud": -21.7456,
        "longitud": -66.646698
    },
    {
        "id": 945,
        "ciudad": "San Pedro - Río Victoria (GPRS)",
        "latitud": -16.30089,
        "longitud": -63.864958
    },
    {
        "id": 946,
        "ciudad": "San Pedro - San Antonio (GPRS)",
        "latitud": -16.699552,
        "longitud": -63.468038
    },
    {
        "id": 947,
        "ciudad": "San Pedro (SCZ)",
        "latitud": -16.816667,
        "longitud": -63.483333
    },
    {
        "id": 948,
        "ciudad": "San Pedro Buena Vista (TJA)",
        "latitud": -21.433333,
        "longitud": -64.666667
    },
    {
        "id": 949,
        "ciudad": "San Pedro de Buena Vista",
        "latitud": -18.26012,
        "longitud": -65.991793
    },
    {
        "id": 950,
        "ciudad": "San Pedro de Buena Vista (GPRS)",
        "latitud": -18.260055,
        "longitud": -65.992218
    },
    {
        "id": 951,
        "ciudad": "San Pedro de Curahuara_h",
        "latitud": -17.65,
        "longitud": -68.05
    },
    {
        "id": 952,
        "ciudad": "San Pedro de Tiquina_M (GPRS)",
        "latitud": -16.219893,
        "longitud": -68.854382
    },
    {
        "id": 953,
        "ciudad": "San Pedro SEARPI",
        "latitud": -17.1,
        "longitud": -63.783333
    },
    {
        "id": 954,
        "ciudad": "San Pedro_CBBA",
        "latitud": -17.383333,
        "longitud": -65.166667
    },
    {
        "id": 955,
        "ciudad": "San Pedro_CHUQ_h",
        "latitud": -21.216667,
        "longitud": -65.233333
    },
    {
        "id": 956,
        "ciudad": "San Rafael",
        "latitud": -16.783333,
        "longitud": -64.666667
    },
    {
        "id": 957,
        "ciudad": "San Ramon",
        "latitud": -13.25,
        "longitud": -64.599998
    },
    {
        "id": 958,
        "ciudad": "San Ramón Aeropuerto",
        "latitud": -13.264444,
        "longitud": -64.605556
    },
    {
        "id": 959,
        "ciudad": "San Roque - El Alto (GPRS)",
        "latitud": -16.475599,
        "longitud": -68.270798
    },
    {
        "id": 960,
        "ciudad": "San Roque (Satelital)",
        "latitud": -20.865601,
        "longitud": -65.4058
    },
    {
        "id": 961,
        "ciudad": "San Roque CHQ",
        "latitud": -20.7725,
        "longitud": -65.228056
    },
    {
        "id": 962,
        "ciudad": "San Telmo",
        "latitud": -22.572778,
        "longitud": -64.244722
    },
    {
        "id": 963,
        "ciudad": "Sanandita-PitagorasSRL ",
        "latitud": -21.653976,
        "longitud": -63.638749
    },
    {
        "id": 964,
        "ciudad": "Sankayani",
        "latitud": -17.4,
        "longitud": -65.616667
    },
    {
        "id": 965,
        "ciudad": "Santa Ana - Yacuma",
        "latitud": -13.761781,
        "longitud": -65.434592
    },
    {
        "id": 966,
        "ciudad": "Santa Ana (SCZ)",
        "latitud": -18.083333,
        "longitud": -64.15
    },
    {
        "id": 967,
        "ciudad": "Santa Ana de Caranavi",
        "latitud": -15.733333,
        "longitud": -67.583333
    },
    {
        "id": 968,
        "ciudad": "Santa Ana del Yacuma Aerop",
        "latitud": -13.761667,
        "longitud": -65.434444
    },
    {
        "id": 969,
        "ciudad": "Santa Ana Kolhberg",
        "latitud": -21.566667,
        "longitud": -64.6
    },
    {
        "id": 970,
        "ciudad": "Santa Ana la Nueva-Aranjuez",
        "latitud": -21.578333,
        "longitud": -64.632778
    },
    {
        "id": 971,
        "ciudad": "Santa Ana Puente",
        "latitud": -21.516667,
        "longitud": -64.566667
    },
    {
        "id": 973,
        "ciudad": "Santa Cruz de la Sierra",
        "latitud": -17.783333,
        "longitud": -63.166667
    },
    {
        "id": 974,
        "ciudad": "Santa Elena",
        "latitud": -20.582778,
        "longitud": -64.775278
    },
    {
        "id": 975,
        "ciudad": "Santa Lucia_Pti",
        "latitud": -19.55,
        "longitud": -65.85
    },
    {
        "id": 976,
        "ciudad": "Santa Rita de Bs. As - Coroico_H",
        "latitud": -15.6922,
        "longitud": -67.6908
    },
    {
        "id": 977,
        "ciudad": "Santa Rita de Bs. As.",
        "latitud": -15.692222,
        "longitud": -67.690833
    },
    {
        "id": 978,
        "ciudad": "Santa Rosa",
        "latitud": -14.075038,
        "longitud": -66.788723
    },
    {
        "id": 979,
        "ciudad": "Santa Rosa (CBBA)",
        "latitud": -17.116667,
        "longitud": -66.7
    },
    {
        "id": 980,
        "ciudad": "Santa Rosa Aeropuerto (BENI)",
        "latitud": -14.075008,
        "longitud": -66.788712
    },
    {
        "id": 981,
        "ciudad": "Santa Rosa de Lima_Sc",
        "latitud": -17.883333,
        "longitud": -64.216667
    },
    {
        "id": 982,
        "ciudad": "Santa Rosa de Roca",
        "latitud": -15.9,
        "longitud": -61.433333
    },
    {
        "id": 983,
        "ciudad": "Santa Rosa del Sara",
        "latitud": -17.116667,
        "longitud": -63.6
    },
    {
        "id": 984,
        "ciudad": "Santiago de Callapa (GPRS)",
        "latitud": -17.476389,
        "longitud": -68.356111
    },
    {
        "id": 985,
        "ciudad": "Santiago de Chiquitos",
        "latitud": -18.5,
        "longitud": -60.333333
    },
    {
        "id": 986,
        "ciudad": "Santiago de Huata",
        "latitud": -16.051111,
        "longitud": -68.810278
    },
    {
        "id": 987,
        "ciudad": "Santiago de Machaca",
        "latitud": -17.066667,
        "longitud": -69.199444
    },
    {
        "id": 988,
        "ciudad": "Santivañez",
        "latitud": -17.565,
        "longitud": -66.249167
    },
    {
        "id": 989,
        "ciudad": "Sapahaqui",
        "latitud": -16.866667,
        "longitud": -67.933333
    },
    {
        "id": 990,
        "ciudad": "Sapecho",
        "latitud": -15.565556,
        "longitud": -67.325
    },
    {
        "id": 991,
        "ciudad": "Sara Ana",
        "latitud": -15.458056,
        "longitud": -67.466667
    },
    {
        "id": 992,
        "ciudad": "Sararia_h",
        "latitud": -15.416667,
        "longitud": -67.6
    },
    {
        "id": 993,
        "ciudad": "Sarco",
        "latitud": -17.384167,
        "longitud": -66.175556
    },
    {
        "id": 994,
        "ciudad": "Sauce Pilata - SDC (GPRS)",
        "latitud": -17.8414,
        "longitud": -65.071701
    },
    {
        "id": 995,
        "ciudad": "Saykan Perulas",
        "latitud": -21.715833,
        "longitud": -64.095556
    },
    {
        "id": 996,
        "ciudad": "Saytu Cocha",
        "latitud": -17.416111,
        "longitud": -66.174444
    },
    {
        "id": 997,
        "ciudad": "Sehuencas",
        "latitud": -17.583333,
        "longitud": -65.3
    },
    {
        "id": 998,
        "ciudad": "Sella Mendez",
        "latitud": -21.366667,
        "longitud": -64.65
    },
    {
        "id": 999,
        "ciudad": "Sella Quebrada",
        "latitud": -21.386278,
        "longitud": -64.681038
    },
    {
        "id": 1000,
        "ciudad": "Sena_H (GPRS)",
        "latitud": -11.470251,
        "longitud": -67.238813
    },
    {
        "id": 1001,
        "ciudad": "Senda VI",
        "latitud": -16.916667,
        "longitud": -65.083333
    },
    {
        "id": 1002,
        "ciudad": "Senkata-D8",
        "latitud": -16.585871,
        "longitud": -68.18613
    },
    {
        "id": 1003,
        "ciudad": "Sepulturas",
        "latitud": -17.8,
        "longitud": -69.166667
    },
    {
        "id": 1004,
        "ciudad": "Sevaruyo_ENFE",
        "latitud": -19.364444,
        "longitud": -66.861389
    },
    {
        "id": 1005,
        "ciudad": "Siberia",
        "latitud": -17.8,
        "longitud": -64.6
    },
    {
        "id": 1006,
        "ciudad": "Sica Sica",
        "latitud": -17.383333,
        "longitud": -67.75
    },
    {
        "id": 1007,
        "ciudad": "Sichez_H (GPRS)",
        "latitud": -17.677354,
        "longitud": -65.944892
    },
    {
        "id": 1008,
        "ciudad": "Sipe Sipe (Automática)",
        "latitud": -17.433333,
        "longitud": -66.333333
    },
    {
        "id": 1009,
        "ciudad": "Sirupaya",
        "latitud": -16.033333,
        "longitud": -67.95
    },
    {
        "id": 1010,
        "ciudad": "Sivingani - Misicuni ",
        "latitud": -17.098611,
        "longitud": -66.300278
    },
    {
        "id": 1011,
        "ciudad": "Sivingani Ayopaya",
        "latitud": -16.966667,
        "longitud": -66.833333
    },
    {
        "id": 1012,
        "ciudad": "Sivingani_ENFE",
        "latitud": -17.816667,
        "longitud": -65.533333
    },
    {
        "id": 1013,
        "ciudad": "Sivingani_Mizque",
        "latitud": -17.916667,
        "longitud": -65.666667
    },
    {
        "id": 1014,
        "ciudad": "Sivingani-Misicuni (GPRS)",
        "latitud": -17.1,
        "longitud": -66.315598
    },
    {
        "id": 1015,
        "ciudad": "Soledad_ENFE",
        "latitud": -17.767778,
        "longitud": -67.290556
    },
    {
        "id": 1016,
        "ciudad": "Sopachuy",
        "latitud": -19.486111,
        "longitud": -64.474444
    },
    {
        "id": 1017,
        "ciudad": "Soracachi (GPRS)",
        "latitud": -17.768101,
        "longitud": -67.024696
    },
    {
        "id": 1018,
        "ciudad": "Sorata",
        "latitud": -15.766667,
        "longitud": -68.651667
    },
    {
        "id": 1019,
        "ciudad": "Sorata VIP SRL",
        "latitud": -15.767038,
        "longitud": -68.648354
    },
    {
        "id": 1020,
        "ciudad": "Suches",
        "latitud": -14.7915044971832,
        "longitud": -69.3178026749926
    },
    {
        "id": 1021,
        "ciudad": "Sucre",
        "latitud": -19.016399,
        "longitud": -65.2939
    },
    {
        "id": 1022,
        "ciudad": "Sucre (Satelital)",
        "latitud": -19.0436,
        "longitud": -65.246696
    },
    {
        "id": 1023,
        "ciudad": "Sucre Aeropuerto",
        "latitud": -19.009722,
        "longitud": -65.293889
    },
    {
        "id": 1024,
        "ciudad": "Sucre Ciudad Fac. Agro - GPRS",
        "latitud": -19.04831,
        "longitud": -65.25692
    },
    {
        "id": 1025,
        "ciudad": "Sucre SENAMHI",
        "latitud": -19.039881,
        "longitud": -65.263824
    },
    {
        "id": 1026,
        "ciudad": "Sucre_ENFE",
        "latitud": -19.04,
        "longitud": -65.265833
    },
    {
        "id": 1027,
        "ciudad": "Sultaca_M (GPRS)",
        "latitud": -20.443101,
        "longitud": -65.092717
    },
    {
        "id": 1028,
        "ciudad": "Sunjani (GPRS)",
        "latitud": -17.165083,
        "longitud": -66.352097
    },
    {
        "id": 1029,
        "ciudad": "Sunjani Misicuni",
        "latitud": -17.161667,
        "longitud": -66.349722
    },
    {
        "id": 1030,
        "ciudad": "Suri_h",
        "latitud": -16.516667,
        "longitud": -67.233333
    },
    {
        "id": 1031,
        "ciudad": "Suriquiña Jichurasi CARE",
        "latitud": -16.258333,
        "longitud": -68.455833
    },
    {
        "id": 1032,
        "ciudad": "Surutú_h",
        "latitud": -17.416667,
        "longitud": -63.833333
    },
    {
        "id": 1033,
        "ciudad": "Tacacoma_h",
        "latitud": -15.583333,
        "longitud": -68.716667
    },
    {
        "id": 1034,
        "ciudad": "Tacagua_M (GPRS)",
        "latitud": -18.82596,
        "longitud": -66.735879
    },
    {
        "id": 1035,
        "ciudad": "Tacobamba",
        "latitud": -19.2,
        "longitud": -65.55
    },
    {
        "id": 1036,
        "ciudad": "Tahiguati_h",
        "latitud": -21.016667,
        "longitud": -63.383333
    },
    {
        "id": 1037,
        "ciudad": "Tahua Pti_h",
        "latitud": -19.883333,
        "longitud": -67.683333
    },
    {
        "id": 1038,
        "ciudad": "Talina",
        "latitud": -21.746389,
        "longitud": -65.821667
    },
    {
        "id": 1039,
        "ciudad": "Talula_Tako Tako",
        "latitud": -19.11,
        "longitud": -65.405278
    },
    {
        "id": 1040,
        "ciudad": "Tambillo (LPZ)",
        "latitud": -16.566667,
        "longitud": -68.5
    },
    {
        "id": 1041,
        "ciudad": "Tambillo_M",
        "latitud": -16.525295,
        "longitud": -68.497432
    },
    {
        "id": 1042,
        "ciudad": "Tambo (EuroClima)",
        "latitud": -17.196997,
        "longitud": -67.571667
    },
    {
        "id": 1043,
        "ciudad": "Tapacarí",
        "latitud": -17.516667,
        "longitud": -66.616667
    },
    {
        "id": 1044,
        "ciudad": "Tapacari (Automática)",
        "latitud": -17.5,
        "longitud": -65.616667
    },
    {
        "id": 1045,
        "ciudad": "Tapacari (GPRS)",
        "latitud": -17.515438,
        "longitud": -66.62196
    },
    {
        "id": 1046,
        "ciudad": "Taperillas",
        "latitud": -19.733333,
        "longitud": -63.85
    },
    {
        "id": 1047,
        "ciudad": "Tarabuco",
        "latitud": -19.180556,
        "longitud": -64.913333
    },
    {
        "id": 1048,
        "ciudad": "Tarabuco_ENFE",
        "latitud": -19.1825,
        "longitud": -64.915
    },
    {
        "id": 1049,
        "ciudad": "Taraco",
        "latitud": -16.466667,
        "longitud": -68.866667
    },
    {
        "id": 1050,
        "ciudad": "Tarapaya",
        "latitud": -19.471667,
        "longitud": -65.794722
    },
    {
        "id": 1051,
        "ciudad": "Tarata",
        "latitud": -17.608611,
        "longitud": -66.022778
    },
    {
        "id": 1052,
        "ciudad": "Tarata (GPRS)",
        "latitud": -17.608601,
        "longitud": -66.022797
    },
    {
        "id": 1053,
        "ciudad": "Tarata_ENFE",
        "latitud": -17.616667,
        "longitud": -66.017778
    },
    {
        "id": 1054,
        "ciudad": "Tarenda",
        "latitud": -19.983333,
        "longitud": -63.1
    },
    {
        "id": 1056,
        "ciudad": "Tarija",
        "latitud": -21.5364,
        "longitud": -64.7296
    },
    {
        "id": 1057,
        "ciudad": "Tarija Aeropuerto",
        "latitud": -21.549238,
        "longitud": -64.707591
    },
    {
        "id": 1058,
        "ciudad": "Tarija Cancha",
        "latitud": -21.4,
        "longitud": -64.766667
    },
    {
        "id": 1059,
        "ciudad": "Tarija_SENAMHI_h",
        "latitud": -21.55,
        "longitud": -64.733333
    },
    {
        "id": 1060,
        "ciudad": "Tariquia",
        "latitud": -22.046111,
        "longitud": -64.374444
    },
    {
        "id": 1061,
        "ciudad": "Taro",
        "latitud": -19.833333,
        "longitud": -66.166667
    },
    {
        "id": 1062,
        "ciudad": "Taruma",
        "latitud": -18.083333,
        "longitud": -63.433333
    },
    {
        "id": 1063,
        "ciudad": "Tarupayo",
        "latitud": -21.328056,
        "longitud": -63.955
    },
    {
        "id": 1064,
        "ciudad": "Tarvita",
        "latitud": -19.989444,
        "longitud": -64.486111
    },
    {
        "id": 1065,
        "ciudad": "Tarvita (GPRS)",
        "latitud": -19.9894,
        "longitud": -64.4844
    },
    {
        "id": 1066,
        "ciudad": "Taypichaca_h",
        "latitud": -16.2,
        "longitud": -68.366667
    },
    {
        "id": 1067,
        "ciudad": "Templo (GPRS)",
        "latitud": -17.180185,
        "longitud": -66.365607
    },
    {
        "id": 1068,
        "ciudad": "Templo Misicuni",
        "latitud": -17.176667,
        "longitud": -66.363889
    },
    {
        "id": 1069,
        "ciudad": "Temporal - SDC (GPRS)",
        "latitud": -17.349305,
        "longitud": -66.156411
    },
    {
        "id": 1070,
        "ciudad": "Teoponte",
        "latitud": -15.483333,
        "longitud": -67.816667
    },
    {
        "id": 1071,
        "ciudad": "Terevinto",
        "latitud": -17.716667,
        "longitud": -63.383333
    },
    {
        "id": 1072,
        "ciudad": "Thapaña",
        "latitud": -19.266667,
        "longitud": -65.933333
    },
    {
        "id": 1073,
        "ciudad": "Tiahuanaco_M (GPRS)",
        "latitud": -16.547187,
        "longitud": -68.68359
    },
    {
        "id": 1074,
        "ciudad": "Tiawanacu",
        "latitud": -16.568611,
        "longitud": -68.678333
    },
    {
        "id": 1075,
        "ciudad": "Tica Tica",
        "latitud": -20.183333,
        "longitud": -66.016667
    },
    {
        "id": 1076,
        "ciudad": "Tigüipa",
        "latitud": -21.000556,
        "longitud": -63.327222
    },
    {
        "id": 1077,
        "ciudad": "Timboy",
        "latitud": -21.174167,
        "longitud": -64.066389
    },
    {
        "id": 1078,
        "ciudad": "Tinguipaya",
        "latitud": -19.216667,
        "longitud": -65.816667
    },
    {
        "id": 1079,
        "ciudad": "Tipuani",
        "latitud": -15.5,
        "longitud": -68
    },
    {
        "id": 1080,
        "ciudad": "Tiquina",
        "latitud": -16.216667,
        "longitud": -68.833333
    },
    {
        "id": 1081,
        "ciudad": "Tiraque",
        "latitud": -17.425278,
        "longitud": -65.724444
    },
    {
        "id": 1082,
        "ciudad": "Titiri",
        "latitud": -17.316667,
        "longitud": -66.25
    },
    {
        "id": 1083,
        "ciudad": "Todo Santos_cocha",
        "latitud": -16.8,
        "longitud": -65.166667
    },
    {
        "id": 1084,
        "ciudad": "Todos Santos_Or",
        "latitud": -19.008243,
        "longitud": -68.715684
    },
    {
        "id": 1085,
        "ciudad": "Tojo",
        "latitud": -21.818889,
        "longitud": -65.326389
    },
    {
        "id": 1086,
        "ciudad": "Tolapalca_ENFE",
        "latitud": -17.853611,
        "longitud": -66.840278
    },
    {
        "id": 1087,
        "ciudad": "Toledo (GPRS)",
        "latitud": -18.190226,
        "longitud": -67.402098
    },
    {
        "id": 1088,
        "ciudad": "Tolomosa Grande",
        "latitud": -21.616667,
        "longitud": -64.766667
    },
    {
        "id": 1089,
        "ciudad": "Toma Ravelo_H (GPRS)",
        "latitud": -18.9342,
        "longitud": -65.460602
    },
    {
        "id": 1090,
        "ciudad": "Toma Ravelo_M (GPRS)",
        "latitud": -18.93388,
        "longitud": -65.459883
    },
    {
        "id": 1091,
        "ciudad": "Tomatas Grande",
        "latitud": -21.3,
        "longitud": -64.8
    },
    {
        "id": 1092,
        "ciudad": "Tomatitas",
        "latitud": -21.491944,
        "longitud": -64.761111
    },
    {
        "id": 1093,
        "ciudad": "Tomave",
        "latitud": -20.067222,
        "longitud": -66.531111
    },
    {
        "id": 1094,
        "ciudad": "Tomayapo Pueblo",
        "latitud": -21.268333,
        "longitud": -65.045
    },
    {
        "id": 1095,
        "ciudad": "Tomina",
        "latitud": -19.166667,
        "longitud": -64.466667
    },
    {
        "id": 1096,
        "ciudad": "Tomina (GPRS)",
        "latitud": -19.1833,
        "longitud": -64.533302
    },
    {
        "id": 1097,
        "ciudad": "Toralapa",
        "latitud": -17.533333,
        "longitud": -66.466667
    },
    {
        "id": 1098,
        "ciudad": "Toro Toro Potosi",
        "latitud": -18.133333,
        "longitud": -65.763056
    },
    {
        "id": 1099,
        "ciudad": "Totora i_M (GPRS)",
        "latitud": -20.953187,
        "longitud": -65.728387
    },
    {
        "id": 1100,
        "ciudad": "Totora Pampa",
        "latitud": -16.083333,
        "longitud": -66.766667
    },
    {
        "id": 1101,
        "ciudad": "Totora_CBBA",
        "latitud": -17.65,
        "longitud": -66.116667
    },
    {
        "id": 1102,
        "ciudad": "Totorani (Emp. Moscoso)",
        "latitud": -16.961377,
        "longitud": -68.173038
    },
    {
        "id": 1103,
        "ciudad": "Trancas",
        "latitud": -21.3074,
        "longitud": -64.815585
    },
    {
        "id": 1104,
        "ciudad": "Tres Cruces",
        "latitud": -17.622222,
        "longitud": -62.2325
    },
    {
        "id": 1105,
        "ciudad": "Tres Quebradas",
        "latitud": -17.9,
        "longitud": -65.066667
    },
    {
        "id": 1106,
        "ciudad": "Trinidad",
        "latitud": -14.8167,
        "longitud": -64.900002
    },
    {
        "id": 1107,
        "ciudad": "Trinidad Aeropuerto",
        "latitud": -14.823333,
        "longitud": -64.916389
    },
    {
        "id": 1108,
        "ciudad": "Trompillo Aeropuerto",
        "latitud": -17.805,
        "longitud": -63.178056
    },
    {
        "id": 1109,
        "ciudad": "Tucumillas",
        "latitud": -21.461111,
        "longitud": -64.831111
    },
    {
        "id": 1110,
        "ciudad": "Tullma_h",
        "latitud": -19.05,
        "longitud": -65.783333
    },
    {
        "id": 1111,
        "ciudad": "Tumupasa_h",
        "latitud": -19.1,
        "longitud": -67.933333
    },
    {
        "id": 1112,
        "ciudad": "Tumusla",
        "latitud": -20.466667,
        "longitud": -65.615833
    },
    {
        "id": 1113,
        "ciudad": "Tunari",
        "latitud": -16.983333,
        "longitud": -66.683333
    },
    {
        "id": 1114,
        "ciudad": "Tuni EPSAS",
        "latitud": -16.1975,
        "longitud": -68.245833
    },
    {
        "id": 1115,
        "ciudad": "Tupile",
        "latitud": -14.666667,
        "longitud": -68.383333
    },
    {
        "id": 1116,
        "ciudad": "Tupiza",
        "latitud": -21.438333,
        "longitud": -65.715278
    },
    {
        "id": 1117,
        "ciudad": "Tupiza_1_H (GPRS)",
        "latitud": -21.561374,
        "longitud": -65.647734
    },
    {
        "id": 1118,
        "ciudad": "Tupiza_2_H (GPRS)",
        "latitud": -21.524334,
        "longitud": -65.738034
    },
    {
        "id": 1119,
        "ciudad": "Tupiza_ENFE",
        "latitud": -21.441944,
        "longitud": -65.734722
    },
    {
        "id": 1120,
        "ciudad": "Turco",
        "latitud": -18.184722,
        "longitud": -68.173056
    },
    {
        "id": 1121,
        "ciudad": "Turco (Satelital)",
        "latitud": -18.184633,
        "longitud": -68.172986
    },
    {
        "id": 1122,
        "ciudad": "Turuchipa",
        "latitud": -19.816667,
        "longitud": -64.933333
    },
    {
        "id": 1123,
        "ciudad": "Turuchipa_Pti",
        "latitud": -19.8,
        "longitud": -64.95
    },
    {
        "id": 1124,
        "ciudad": "Turumayo",
        "latitud": -21.556667,
        "longitud": -64.778333
    },
    {
        "id": 1125,
        "ciudad": "Ucumasi",
        "latitud": -19.130278,
        "longitud": -67.424722
    },
    {
        "id": 1126,
        "ciudad": "Ulla Ulla",
        "latitud": -15.061111,
        "longitud": -69.271944
    },
    {
        "id": 1127,
        "ciudad": "Ulla Ulla (Satelital)",
        "latitud": -15.0611,
        "longitud": -69.271896
    },
    {
        "id": 1128,
        "ciudad": "Ulla Ulla Aut",
        "latitud": -15.061111,
        "longitud": -69.271944
    },
    {
        "id": 1129,
        "ciudad": "Ulloma",
        "latitud": -17.485556,
        "longitud": -68.493889
    },
    {
        "id": 1130,
        "ciudad": "Uncía",
        "latitud": -18.466667,
        "longitud": -66.566667
    },
    {
        "id": 1131,
        "ciudad": "Univalle",
        "latitud": -17.347778,
        "longitud": -66.221667
    },
    {
        "id": 1132,
        "ciudad": "Univalle (GPRS)",
        "latitud": -17.378323,
        "longitud": -66.170369
    },
    {
        "id": 1133,
        "ciudad": "Urriolagoytia",
        "latitud": -19.169722,
        "longitud": -64.264167
    },
    {
        "id": 1134,
        "ciudad": "Urubichá (GPRS)",
        "latitud": -15.5889,
        "longitud": -63.172199
    },
    {
        "id": 1135,
        "ciudad": "UTO Oruro (GPRS)",
        "latitud": -17.996124,
        "longitud": -67.138932
    },
    {
        "id": 1136,
        "ciudad": "Uyacti Punta",
        "latitud": -17.757778,
        "longitud": -65.126667
    },
    {
        "id": 1137,
        "ciudad": "Uyuni",
        "latitud": -20.471783,
        "longitud": -66.83128
    },
    {
        "id": 1138,
        "ciudad": "Uyuni Aeropuerto",
        "latitud": -20.442834,
        "longitud": -66.846868
    },
    {
        "id": 1139,
        "ciudad": "Uyuni_ENFE",
        "latitud": -20.471667,
        "longitud": -66.828889
    },
    {
        "id": 1140,
        "ciudad": "Vacas",
        "latitud": -17.569444,
        "longitud": -66.221667
    },
    {
        "id": 1141,
        "ciudad": "Vacas - SDC (GPRS)",
        "latitud": -17.574234,
        "longitud": -65.590116
    },
    {
        "id": 1142,
        "ciudad": "Valle Abajo_h",
        "latitud": -18.25,
        "longitud": -63.95
    },
    {
        "id": 1143,
        "ciudad": "Vallecito",
        "latitud": -17.766667,
        "longitud": -63.15
    },
    {
        "id": 1144,
        "ciudad": "Vallecito SEARPI",
        "latitud": -17.716667,
        "longitud": -63.916667
    },
    {
        "id": 1145,
        "ciudad": "Vallegrande",
        "latitud": -18.481899,
        "longitud": -64.108101
    },
    {
        "id": 1146,
        "ciudad": "Vallegrande Aeropuerto",
        "latitud": -18.481944,
        "longitud": -64.108056
    },
    {
        "id": 1147,
        "ciudad": "Vallegrande SENAMHI",
        "latitud": -18.466667,
        "longitud": -64.1
    },
    {
        "id": 1148,
        "ciudad": "Versalles",
        "latitud": -17.633333,
        "longitud": -63.083333
    },
    {
        "id": 1149,
        "ciudad": "Viacha",
        "latitud": -16.658341,
        "longitud": -68.282024
    },
    {
        "id": 1150,
        "ciudad": "Viacha_ENFE",
        "latitud": -16.653611,
        "longitud": -68.291389
    },
    {
        "id": 1151,
        "ciudad": "Viacha_M (GPRS)",
        "latitud": -16.658328,
        "longitud": -68.282102
    },
    {
        "id": 1152,
        "ciudad": "Vibora_h",
        "latitud": -17.35,
        "longitud": -64.05
    },
    {
        "id": 1153,
        "ciudad": "Vila Vila",
        "latitud": -16.543611,
        "longitud": -67.433611
    },
    {
        "id": 1154,
        "ciudad": "Vila Vila - SDC (GPRS)",
        "latitud": -17.984729,
        "longitud": -65.627198
    },
    {
        "id": 1155,
        "ciudad": "Vila Vila Pot_ENFE",
        "latitud": -19.350833,
        "longitud": -65.335556
    },
    {
        "id": 1156,
        "ciudad": "Vilacaya",
        "latitud": -19.983333,
        "longitud": -65.483333
    },
    {
        "id": 1157,
        "ciudad": "Vilaque_h",
        "latitud": -15.65,
        "longitud": -67.983333
    },
    {
        "id": 1158,
        "ciudad": "Villa Abecia",
        "latitud": -20.9806,
        "longitud": -65.230556
    },
    {
        "id": 1159,
        "ciudad": "Villa Adela",
        "latitud": -16.516667,
        "longitud": -68.216667
    },
    {
        "id": 1160,
        "ciudad": "Villa Alcala",
        "latitud": -19.360833,
        "longitud": -64.387778
    },
    {
        "id": 1161,
        "ciudad": "Villa Alcalá (GPRS)",
        "latitud": -19.3608,
        "longitud": -64.387802
    },
    {
        "id": 1162,
        "ciudad": "Villa Amboro",
        "latitud": -17.716667,
        "longitud": -63.566667
    },
    {
        "id": 1163,
        "ciudad": "Villa Armonía",
        "latitud": -16.483333,
        "longitud": -68.116667
    },
    {
        "id": 1164,
        "ciudad": "Villa Aspiazu",
        "latitud": -16.4,
        "longitud": -67.666667
    },
    {
        "id": 1165,
        "ciudad": "Villa Charcas (GPRS)",
        "latitud": -20.7167,
        "longitud": -64.866699
    },
    {
        "id": 1166,
        "ciudad": "Villa Copacabana",
        "latitud": -16.482778,
        "longitud": -68.113889
    },
    {
        "id": 1167,
        "ciudad": "Villa Diego",
        "latitud": -17.590833,
        "longitud": -63.523611
    },
    {
        "id": 1168,
        "ciudad": "Villa El Porvenir (PIQUENDO)",
        "latitud": -15.606944,
        "longitud": -67.247778
    },
    {
        "id": 1169,
        "ciudad": "Villa Granado",
        "latitud": -18.2,
        "longitud": -65.033333
    },
    {
        "id": 1170,
        "ciudad": "Villa Montes - Peña Colorada",
        "latitud": -21.260833,
        "longitud": -63.502778
    },
    {
        "id": 1171,
        "ciudad": "Villa Montes (Bombeo)",
        "latitud": -21.261111,
        "longitud": -63.503333
    },
    {
        "id": 1172,
        "ciudad": "Villa Montes Bombeo (Autom)",
        "latitud": -21.261111,
        "longitud": -63.503333
    },
    {
        "id": 1173,
        "ciudad": "Villa Puni",
        "latitud": -15.666389,
        "longitud": -69.167222
    },
    {
        "id": 1174,
        "ciudad": "Villa San Antonio",
        "latitud": -16.516667,
        "longitud": -68.216667
    },
    {
        "id": 1175,
        "ciudad": "Villa Serrano",
        "latitud": -19.118333,
        "longitud": -64.3225
    },
    {
        "id": 1176,
        "ciudad": "Villa Serrano (GPRS)",
        "latitud": -19.118299,
        "longitud": -64.322502
    },
    {
        "id": 1177,
        "ciudad": "Villa Tunari (GPRS)",
        "latitud": -16.973101,
        "longitud": -65.422501
    },
    {
        "id": 1178,
        "ciudad": "Villa Tunari_H (GPRS)",
        "latitud": -16.972978,
        "longitud": -65.398594
    },
    {
        "id": 1179,
        "ciudad": "Villa Victoria",
        "latitud": -16.483333,
        "longitud": -68.15
    },
    {
        "id": 1180,
        "ciudad": "Villamontes",
        "latitud": -21.254132,
        "longitud": -63.404669
    },
    {
        "id": 1181,
        "ciudad": "Villamontes Aeropuerto",
        "latitud": -21.254722,
        "longitud": -63.4075
    },
    {
        "id": 1182,
        "ciudad": "Villamontes Bombeo",
        "latitud": -21.261111,
        "longitud": -63.503333
    },
    {
        "id": 1183,
        "ciudad": "Villamontes SENAMHI",
        "latitud": -21.25,
        "longitud": -63.45
    },
    {
        "id": 1184,
        "ciudad": "Villazon",
        "latitud": -22.083333,
        "longitud": -65.6
    },
    {
        "id": 1185,
        "ciudad": "Villazon (Satelital)",
        "latitud": -22.067499,
        "longitud": -65.584702
    },
    {
        "id": 1186,
        "ciudad": "Viloco",
        "latitud": -16.866667,
        "longitud": -67.5
    },
    {
        "id": 1187,
        "ciudad": "Viña Quemada",
        "latitud": -19.408333,
        "longitud": -64.852778
    },
    {
        "id": 1188,
        "ciudad": "Viña Quemada (auto)",
        "latitud": -19.408333,
        "longitud": -64.852778
    },
    {
        "id": 1189,
        "ciudad": "Viña Quemada (Satelital)",
        "latitud": -19.4261,
        "longitud": -65.343102
    },
    {
        "id": 1190,
        "ciudad": "Vino Tinto",
        "latitud": -16.480833,
        "longitud": -68.138889
    },
    {
        "id": 1191,
        "ciudad": "Vinto",
        "latitud": -17.433333,
        "longitud": -66.316667
    },
    {
        "id": 1192,
        "ciudad": "Viru Viru",
        "latitud": -17.650292,
        "longitud": -63.136979
    },
    {
        "id": 1193,
        "ciudad": "Viru Viru Aeropuerto",
        "latitud": -17.650361,
        "longitud": -63.137135
    },
    {
        "id": 1194,
        "ciudad": "Viscachas Chirage (GPRS)",
        "latitud": -17.054883,
        "longitud": -66.389964
    },
    {
        "id": 1195,
        "ciudad": "Vitichi",
        "latitud": -20.215556,
        "longitud": -65.493056
    },
    {
        "id": 1196,
        "ciudad": "Vivero Chimboco - SDC (GPRS)",
        "latitud": -17.3869,
        "longitud": -66.040802
    },
    {
        "id": 1197,
        "ciudad": "Vivero Viloma - SDC (GPRS)",
        "latitud": -17.4133,
        "longitud": -66.385002
    },
    {
        "id": 1198,
        "ciudad": "Vivora",
        "latitud": -17.35,
        "longitud": -64.05
    },
    {
        "id": 1199,
        "ciudad": "Volcanes",
        "latitud": -18.1,
        "longitud": -63.666667
    },
    {
        "id": 1200,
        "ciudad": "Wariscata",
        "latitud": -17.916667,
        "longitud": -68.616667
    },
    {
        "id": 1201,
        "ciudad": "Wila Cala (GPRS)",
        "latitud": -15.357249,
        "longitud": -69.044602
    },
    {
        "id": 1202,
        "ciudad": "Winquiri",
        "latitud": -17.616667,
        "longitud": -66.033333
    },
    {
        "id": 1203,
        "ciudad": "Yaco",
        "latitud": -17.166667,
        "longitud": -67.4
    },
    {
        "id": 1204,
        "ciudad": "Yacuces",
        "latitud": -18.916667,
        "longitud": -58.3
    },
    {
        "id": 1205,
        "ciudad": "Yacuiba",
        "latitud": -21.950001,
        "longitud": -63.650002
    },
    {
        "id": 1206,
        "ciudad": "Yacuiba Aeropuerto",
        "latitud": -21.965556,
        "longitud": -63.654444
    },
    {
        "id": 1207,
        "ciudad": "Yamparaez",
        "latitud": -19.192222,
        "longitud": -65.120556
    },
    {
        "id": 1208,
        "ciudad": "Yanamuyo Alto",
        "latitud": -16.633333,
        "longitud": -68.483333
    },
    {
        "id": 1209,
        "ciudad": "Yapacani (GPRS)",
        "latitud": -17.4044,
        "longitud": -63.844398
    },
    {
        "id": 1210,
        "ciudad": "Yaurichambi (GPRS)",
        "latitud": -16.326099,
        "longitud": -68.481102
    },
    {
        "id": 1211,
        "ciudad": "Yayani",
        "latitud": -17.216667,
        "longitud": -65.666667
    },
    {
        "id": 1212,
        "ciudad": "Yerba Buena",
        "latitud": -17.966667,
        "longitud": -64.033333
    },
    {
        "id": 1213,
        "ciudad": "Yesera Norte",
        "latitud": -21.372222,
        "longitud": -64.550833
    },
    {
        "id": 1214,
        "ciudad": "Yesera Sur",
        "latitud": -21.467222,
        "longitud": -64.558333
    },
    {
        "id": 1215,
        "ciudad": "Yocalla",
        "latitud": -19.388889,
        "longitud": -65.910278
    },
    {
        "id": 1216,
        "ciudad": "Yocalla - Pilcomayo_H",
        "latitud": -18.917834,
        "longitud": -63.468389
    },
    {
        "id": 1217,
        "ciudad": "Yotala",
        "latitud": -19.161667,
        "longitud": -65.266389
    },
    {
        "id": 1218,
        "ciudad": "Yunchara",
        "latitud": -21.825833,
        "longitud": -65.228611
    },
    {
        "id": 1219,
        "ciudad": "Yura",
        "latitud": -19.716667,
        "longitud": -66.383333
    },
    {
        "id": 1220,
        "ciudad": "Yura_ENFE",
        "latitud": -19.703611,
        "longitud": -66.368889
    },
    {
        "id": 1221,
        "ciudad": "Zoniquera",
        "latitud": -21.816667,
        "longitud": -67.433333
    },
    {
        "id": 1222,
        "ciudad": "Zudañez",
        "latitud": -19.118889,
        "longitud": -64.703333
    },
    {
        "id": 1223,
        "ciudad": "12 de Mayo - EBC",
        "latitud": -16.623056,
        "longitud": -68.273056
    },
    {
        "id": 1224,
        "ciudad": "4 Esquinas (GPRS)",
        "latitud": -17.183616,
        "longitud": -66.25057
    },
    {
        "id": 1225,
        "ciudad": "Huacaraje",
        "latitud": -13.5388,
        "longitud": -63.7584
    }

];

/* Llena los valores de los dos selectores */
llenarValoresSelector();