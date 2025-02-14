document.addEventListener('DOMContentLoaded', (event) => {
    const inputCodigo = document.getElementById('codigo-input');
    const previewCodigo = document.getElementById('codigo-preview');

    // Inicializar Highlight.js
    hljs.highlightAll(); // Resalta cualquier bloque <pre><code> que ya exista

    // Función para actualizar la previsualización
    const actualizarPrevisualizacion = () => {
        const codigo = inputCodigo.value;
        previewCodigo.textContent = codigo; // Insertar el código en el <pre><code>
        hljs.highlightElement(previewCodigo); // Volver a resaltar la sintaxis
    };

    // Escuchar el evento 'input' del textarea
    inputCodigo.addEventListener('input', actualizarPrevisualizacion);

    // Inicializar la previsualización al cargar la página (opcional, si quieres mostrar algo inicial)
    actualizarPrevisualizacion();
});