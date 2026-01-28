/**
 * Estilos globales para Box - Vision UI
 * Define variantes para contenedores de página y secciones
 */
export const boxStyles = {
  components: {
    Box: {
      variants: {
        // Contenedor principal de página - fondo transparente para mostrar el gradiente del layout
        pageContainer: {
          bg: "transparent",
          minH: "100vh",
        },
        // Contenedor de sección con efecto glass
        glassSection: (props) => ({
          bg: props.colorMode === "dark"
            ? "linear-gradient(127.09deg, rgba(6, 11, 40, 0.94) 19.41%, rgba(10, 14, 35, 0.49) 76.65%)"
            : "white",
          borderRadius: "20px",
          border: "2px solid",
          borderColor: props.colorMode === "dark"
            ? "rgba(255, 255, 255, 0.125)"
            : "gray.200",
          backdropFilter: props.colorMode === "dark" ? "blur(120px)" : "none",
          boxShadow: props.colorMode === "dark"
            ? "none"
            : "0px 3.5px 5.5px rgba(0, 0, 0, 0.02)",
        }),
      },
    },
  },
};
