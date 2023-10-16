const baseApi = 'https://backend-sistema-actualizacion.onrender.com/historico';
/*const baseApi = 'http://localhost:5150/historico';*/
const loadingDiv = document.querySelector('.loading');
console.log('loading: ', loadingDiv);
// Funcion que muestra todas los registros de la tabla de la Base de Datos
function obtenerHistorico() {
    loadingDiv.style.display = 'flex'; // muestra el loading
    const url = `${baseApi}?_sort=id&_order=desc`   

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('La respuesta de la red no fue correcta');
            }
            return response.json(); // Si fue satisfactorio la respuesta a JSON
        })
        .then(data => {
            mostrarValoresTabla(data);
        })
        .catch(error => {
            console.error('Error:', error);
        }).finally(() => {
            // Oculta el div de carga 
            loadingDiv.style.display = 'none';
        });
}

// Funcion que se encarga de mostrar TODOS los valores de la tabla de la Base de Datos
function mostrarValoresTabla(data){
    var tablaCuerpo = document.getElementById('tablaRegistrosBD');

    /*Todo el for es para llenar todos registros de la tabla historico*/
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

obtenerHistorico();