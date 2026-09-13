# Mercado_Viva_Web_APP

Proyecto de la clase de Arquitectura de Software, el reto se basa en el Mercado Viva, una cadena de supermercados que busca expandirse e incluir compras a través de internet, a pesar de eso, cuentan con distintos problemas.

El enfoque de este proyecto se basa, hasta ahora, en la reserva y compra de productos a través del aplicativo web, este proyecto soluciona satisfactoriamente dicha problemática con una interfaz cómoda y agradable a la vista, además de contar con una funcionalidad impecable.

## 🛠️ Guía para Desarrolladores (Entorno Local con Docker)

Este proyecto está configurado para que cualquier desarrollador pueda levantarlo y editar el código fácilmente usando **Docker** y **Docker Compose**, sin necesidad de instalar bases de datos en su computadora.

### Requisitos previos
* Tener [Docker](https://www.docker.com/products/docker-desktop/) instalado y en ejecución.

### ¿Cómo levantar el proyecto?
1. Abre una terminal en la raíz del proyecto.
2. Ejecuta el siguiente comando para construir e iniciar los contenedores:
   ```bash
   docker-compose up --build
   ```
3. La aplicación estará disponible en tu navegador en: `http://localhost:3000`

### ¿Cómo editar los archivos?
El entorno está configurado con **Live Reloading (Nodemon)**. Esto significa que:
1. Puedes abrir los archivos de la carpeta `Backend/` (por ejemplo, editar el Frontend en `Backend/public/Frontend/index.html` o la lógica en `Backend/src/`).
2. Haz tus cambios y guarda el archivo (Ctrl+S).
3. Docker detectará el cambio y el servidor se reiniciará automáticamente. ¡Solo refresca tu navegador para ver los cambios aplicados al instante!

### Detener el proyecto
Para apagar los contenedores, simplemente presiona `Ctrl + C` en la terminal donde se está ejecutando, o corre:
```bash
docker-compose down
```
