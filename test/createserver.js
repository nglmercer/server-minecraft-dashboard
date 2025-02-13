import { startJavaServerGeneration } from "../src/minecraft/createserver.js";
const configserver = {
    serverName: "serverone",  // Nombre del servidor
    core: "paper",          // Tipo de core
    coreVersion: "1.21.4",    // Versión del core
    startParameters: "-Xms2G -Xmx4G",
    serverPort: 25565,
  };
  
  startJavaServerGeneration(configserver, (result) => {
    if (result) {
      console.log("✅ Servidor creado exitosamente.");
    } else {
      console.log("❌ Error al crear el servidor.");
    }
  });
  