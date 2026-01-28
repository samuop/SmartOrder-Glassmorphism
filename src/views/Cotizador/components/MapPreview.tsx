import React, { useState } from 'react';
import { Box, Image, Text, VStack, Spinner, Link } from '@chakra-ui/react';

/**
 * Componente de preview de mapa usando imagen estática de OpenStreetMap
 * Solución más confiable que Leaflet interactivo para mini-mapas en modales/popovers
 * 
 * @param {Object} props
 * @param {number} props.lat - Latitud
 * @param {number} props.lon - Longitud
 * @param {string} props.address - Dirección formateada para mostrar
 * @param {number} props.width - Ancho del mapa (default: 300px)
 * @param {number} props.height - Alto del mapa (default: 200px)
 * @param {number} props.zoom - Nivel de zoom (default: 15)
 */
const MapPreview = ({
  lat,
  lon,
  address = '',
  width = 300,
  height = 200,
  zoom = 15
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Validar coordenadas
  const parsedLat = parseFloat(lat);
  const parsedLon = parseFloat(lon);
  const isValidCoords = !isNaN(parsedLat) && !isNaN(parsedLon) && 
                        parsedLat >= -90 && parsedLat <= 90 && 
                        parsedLon >= -180 && parsedLon <= 180;

  if (!lat || !lon || !isValidCoords) {
    return (
      <Box
        width={`${width}px`}
        height={`${height}px`}
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="gray.100"
        borderRadius="md"
      >
        <Text fontSize="sm" color="gray.500">
          No hay coordenadas disponibles
        </Text>
      </Box>
    );
  }

  // Calcular el bbox (bounding box) para la imagen del mapa
  // Convertir coordenadas a tiles de OSM
  const calculateTileBounds = (lat, lon, zoom, width, height) => {
    const scale = 256; // Tamaño estándar del tile
    const worldSize = scale * Math.pow(2, zoom);
    
    // Convertir lat/lon a coordenadas pixel
    const latRad = lat * Math.PI / 180;
    const pixelX = (lon + 180) / 360 * worldSize;
    const pixelY = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * worldSize;
    
    // Calcular bounds
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    
    const minX = (pixelX - halfWidth) / worldSize * 360 - 180;
    const maxX = (pixelX + halfWidth) / worldSize * 360 - 180;
    
    const minLatRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * (pixelY + halfHeight) / worldSize)));
    const maxLatRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * (pixelY - halfHeight) / worldSize)));
    
    const minY = minLatRad * 180 / Math.PI;
    const maxY = maxLatRad * 180 / Math.PI;
    
    return `${minX},${minY},${maxX},${maxY}`;
  };

  const bbox = calculateTileBounds(parsedLat, parsedLon, zoom, width, height);
  
  // Usar API de imagen estática con marcador superpuesto
  // Usamos un servicio confiable de tiles de OSM
  const mapImageUrl = `https://render.openstreetmap.org/cgi-bin/export?bbox=${bbox}&scale=2&format=png`;
  
  // URL para abrir en Google Maps (más familiar para usuarios)
  const googleMapsUrl = `https://www.google.com/maps?q=${parsedLat},${parsedLon}`;
  const osmUrl = `https://www.openstreetmap.org/?mlat=${parsedLat}&mlon=${parsedLon}&zoom=${zoom}`;

  return (
    <Box
      width={`${width}px`}
      height={`${height}px`}
      borderRadius="md"
      overflow="hidden"
      boxShadow="md"
      position="relative"
      bg="gray.100"
    >
      {/* Overlay de carga */}
      {isLoading && !hasError && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="gray.100"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={10}
        >
          <VStack spacing={2}>
            <Spinner size="md" color="blue.500" />
            <Text fontSize="xs" color="gray.500">
              Cargando mapa...
            </Text>
          </VStack>
        </Box>
      )}

      {hasError ? (
        <Box
          width="100%"
          height="100%"
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
          gap={2}
        >
          <Text fontSize="sm" color="gray.600">
            📍 Ubicación: {parsedLat.toFixed(6)}, {parsedLon.toFixed(6)}
          </Text>
          <Link 
            href={googleMapsUrl} 
            isExternal 
            color="blue.500" 
            fontSize="sm"
            textDecoration="underline"
          >
            Ver en Google Maps 🔗
          </Link>
        </Box>
      ) : (
        <Box position="relative" width="100%" height="100%">
          {/* Imagen del mapa */}
          <Image
            src={mapImageUrl}
            alt={`Mapa de ${address || 'ubicación'}`}
            width="100%"
            height="100%"
            objectFit="cover"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23f0f0f0' width='300' height='200'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23999' font-family='sans-serif' font-size='14'%3EMapa no disponible%3C/text%3E%3C/svg%3E"
          />

          {/* Marcador en el centro */}
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -100%)"
            fontSize="2xl"
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
            zIndex={5}
          >
            📍
          </Box>

          {/* Overlay con dirección y links */}
          <Box
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            bg="rgba(0, 0, 0, 0.75)"
            color="white"
            p={2}
            backdropFilter="blur(4px)"
          >
            <VStack spacing={1} align="stretch">
              {address && (
                <Text fontSize="xs" noOfLines={2} title={address} fontWeight="medium">
                  {address}
                </Text>
              )}
              <Box display="flex" gap={2} fontSize="2xs">
                <Link 
                  href={googleMapsUrl} 
                  isExternal 
                  color="blue.300" 
                  _hover={{ color: 'blue.200' }}
                  fontWeight="medium"
                >
                  Google Maps →
                </Link>
                <Text color="gray.400">|</Text>
                <Link 
                  href={osmUrl} 
                  isExternal 
                  color="green.300" 
                  _hover={{ color: 'green.200' }}
                  fontWeight="medium"
                >
                  OpenStreetMap →
                </Link>
              </Box>
            </VStack>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default MapPreview;
