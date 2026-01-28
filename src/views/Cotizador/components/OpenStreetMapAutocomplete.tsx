import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  Input,
  InputGroup,
  InputRightElement,
  InputLeftElement,
  Spinner,
  Icon,
  IconButton,
  useColorModeValue,
  Box,
  List,
  ListItem,
  Text,
  useToast,
  Badge,
  Flex,
  Tooltip,
  HStack,
} from '@chakra-ui/react';
import { SearchIcon, CloseIcon } from '@chakra-ui/icons';

// Constantes
const DEBOUNCE_DELAY = 500;
const MIN_SEARCH_LENGTH = 3;
const MAX_RETRIES = 2;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const HISTORY_KEY = 'osm_search_history';
const MAX_HISTORY_ITEMS = 5;
const MIN_RESULTS_THRESHOLD = 3; // Si hay menos de 3 resultados, buscar sin número de calle

/**
 * Normaliza un string para comparación, quitando acentos, mayúsculas y prefijos comunes.
 * @param {string} str - El string a normalizar.
 * @returns {string} El string normalizado.
 */
const normalizeString = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/^provincia\s+(de|del)\s+/i, '')
    .replace(/^pcia\.?\s*/i, '')
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

/**
 * Mapeo extendido de variaciones de nombres de provincias
 */
const PROVINCE_VARIATIONS = {
  'ciudad autonoma de buenos aires': 'capital federal',
  'caba': 'capital federal',
  'buenos aires city': 'capital federal',
  'ciudad de buenos aires': 'capital federal',
  'autonomous city of buenos aires': 'capital federal',
  'provincia de buenos aires': 'buenos aires',
  'bs as': 'buenos aires',
  'pcia buenos aires': 'buenos aires',
  'provincia del chaco': 'chaco',
  'provincia de santa fe': 'santa fe',
  'santa fe province': 'santa fe',
  'provincia de corrientes': 'corrientes',
  'provincia de formosa': 'formosa',
  'provincia de entre rios': 'entre rios',
  'entrerios': 'entre rios',
  'provincia de cordoba': 'cordoba',
  'provincia de mendoza': 'mendoza',
  'provincia de san juan': 'san juan',
  'provincia de san luis': 'san luis',
  'provincia de la rioja': 'la rioja',
  'provincia de catamarca': 'catamarca',
  'provincia de tucuman': 'tucuman',
  'provincia de salta': 'salta',
  'provincia de jujuy': 'jujuy',
  'provincia de santiago del estero': 'santiago del estero',
  'santiago del estero province': 'santiago del estero',
  'provincia de misiones': 'misiones',
  'provincia de la pampa': 'la pampa',
  'la pampa province': 'la pampa',
  'provincia de neuquen': 'neuquen',
  'provincia del neuquen': 'neuquen',
  'provincia de rio negro': 'rio negro',
  'provincia del rio negro': 'rio negro',
  'provincia de chubut': 'chubut',
  'provincia del chubut': 'chubut',
  'provincia de santa cruz': 'santa cruz',
  'provincia de tierra del fuego': 'tierra del fuego',
  'tierra del fuego antartica e islas del atlantico sur': 'tierra del fuego',
};

/**
 * Cache simple para búsquedas
 */
class SearchCache {
  constructor() {
    this.cache = new Map();
  }

  set(key, value) {
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
    });
  }

  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Verificar si el cache expiró
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear() {
    this.cache.clear();
  }
}

/**
 * Gestión de historial de búsquedas
 */
const getSearchHistory = () => {
  try {
    const history = localStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error al leer historial:', error);
    return [];
  }
};

const saveToHistory = (searchTerm) => {
  try {
    const history = getSearchHistory();
    const filtered = history.filter(item => item !== searchTerm);
    const newHistory = [searchTerm, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.error('Error al guardar historial:', error);
  }
};

/**
 * Resalta coincidencias en el texto
 */
const highlightMatch = (text, query) => {
  if (!query || !text) return text;

  const normalizedQuery = normalizeString(query);
  const normalizedText = normalizeString(text);
  const index = normalizedText.indexOf(normalizedQuery);

  if (index === -1) return text;

  // Encontrar la posición real en el texto original
  const beforeMatch = text.substring(0, index);
  const match = text.substring(index, index + query.length);
  const afterMatch = text.substring(index + query.length);

  return (
    <>
      {beforeMatch}
      <Text as="span" fontWeight="bold" color="blue.500">
        {match}
      </Text>
      {afterMatch}
    </>
  );
};

/**
 * Detecta si la query parece ser un código postal argentino
 */
const isPostalCode = (query) => {
  return /^\d{4}$/.test(query.trim());
};

/**
 * Componente de autocompletado de direcciones con OpenStreetMap (Nominatim)
 * @param {Object} props
 * @param {string} props.value - Valor actual del input
 * @param {Function} props.onPlaceSelected - Callback cuando se selecciona una dirección
 * @param {Function} props.onChange - Callback cuando cambia el texto
 * @param {string} props.placeholder - Placeholder del input
 * @param {string} props.size - Tamaño del input (Chakra UI)
 * @param {string} props.name - Nombre del input
 * @param {boolean} props.isDisabled - Si el input está deshabilitado
 * @param {Array} props.provincias - Lista de provincias de TANGO en formato [{ value: 'CODIGO', label: 'NOMBRE' }]
 * @param {boolean} props.allowFlexibleSelection - Permite seleccionar solo ciudad/provincia sin dirección específica
 * @param {boolean} props.enableGeolocation - Habilita botón de geolocalización
 * @param {boolean} props.autoSearch - Búsqueda automática mientras se escribe (default: false para ahorrar API calls)
 */
const OpenStreetMapAutocomplete = ({
  value,
  onPlaceSelected,
  onChange,
  placeholder = 'Ingrese dirección y presione Enter o 🔍...',
  size = 'sm',
  name = 'direccion',
  isDisabled = false,
  provincias = [],
  allowFlexibleSelection = false,
  enableGeolocation = false,
  autoSearch = false, // Por defecto DESACTIVADO para ahorrar llamadas a la API
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);

  const toast = useToast();
  const inputBg = useColorModeValue('white', '#1a202c');
  const suggestionBg = useColorModeValue('white', '#2d3748');
  const suggestionHoverBg = useColorModeValue('gray.100', '#4a5568');
  const historyBg = useColorModeValue('gray.50', '#2d3748');

  const wrapperRef = useRef(null);
  const abortControllerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const cacheRef = useRef(new SearchCache());

  // Cargar historial al montar
  useEffect(() => {
    setSearchHistory(getSearchHistory());
  }, []);

  // Cerrar sugerencias cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup de abort controller y debounce al desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  /**
   * Función mejorada para buscar direcciones en Nominatim con búsqueda en dos fases
   */
  const searchAddress = useCallback(async (query, isRetry = false) => {
    if (!query || query.length < MIN_SEARCH_LENGTH) {
      if (!isRetry) {
        toast({
          title: "Búsqueda muy corta",
          description: `Por favor, ingrese al menos ${MIN_SEARCH_LENGTH} caracteres para buscar.`,
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      }
      setShowSuggestions(false);
      return;
    }

    // Verificar cache primero
    const cachedResults = cacheRef.current.get(query);
    if (cachedResults && !isRetry) {
      console.log('✅ Resultados desde cache:', query);
      setSuggestions(cachedResults);
      setShowSuggestions(true);
      setHighlightedIndex(-1);
      return;
    }

    // Cancelar búsqueda anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Crear nuevo controller
    abortControllerRef.current = new AbortController();
    setIsLoading(true);

    try {
      // Detectar si la búsqueda incluye un número de calle
      const hasStreetNumber = /\d+/.test(query);
      let allResults = [];

      // FASE 1: Búsqueda con la query original
      const enhancedQuery = prepareQuery(query);
      console.log('🔍 Fase 1 - Buscando:', enhancedQuery);

      const firstResults = await performSearch(enhancedQuery, abortControllerRef.current.signal);
      allResults = [...firstResults];

      console.log(`📊 Fase 1: ${firstResults.length} resultados`);

      // FASE 2: Si hay pocos resultados Y la búsqueda incluye número, buscar sin número
      if (firstResults.length < MIN_RESULTS_THRESHOLD && hasStreetNumber) {
        // Remover números de la query
        const queryWithoutNumber = query.replace(/\d+/g, '').trim();

        if (queryWithoutNumber.length >= MIN_SEARCH_LENGTH) {
          const enhancedQueryWithoutNumber = prepareQuery(queryWithoutNumber);
          console.log('🔍 Fase 2 - Buscando sin número:', enhancedQueryWithoutNumber);

          const secondResults = await performSearch(enhancedQueryWithoutNumber, abortControllerRef.current.signal);

          console.log(`📊 Fase 2: ${secondResults.length} resultados adicionales`);

          // Combinar resultados, evitando duplicados por place_id
          const existingIds = new Set(allResults.map(r => r.place_id));
          const newResults = secondResults.filter(r => !existingIds.has(r.place_id));

          allResults = [...allResults, ...newResults];
        }
      }

      // Validación geográfica: Filtrar solo resultados de Argentina
      const validResults = allResults.filter(result => {
        const country = result.address?.country?.toLowerCase();
        const countryCode = result.address?.country_code?.toLowerCase();
        return country === 'argentina' || countryCode === 'ar';
      });

      // Priorizar resultados de Chaco, Formosa y Corrientes
      const prioritizedProvinces = ['chaco', 'formosa', 'corrientes'];

      const sortedData = [...validResults].sort((a, b) => {
        const provinceA = normalizeString(a.address?.state || a.address?.province);
        const provinceB = normalizeString(b.address?.state || b.address?.province);

        const isAPrioritized = prioritizedProvinces.includes(provinceA);
        const isBPrioritized = prioritizedProvinces.includes(provinceB);

        if (isAPrioritized && !isBPrioritized) {
          return -1;
        }
        if (!isAPrioritized && isBPrioritized) {
          return 1;
        }
        return 0;
      });

      // Guardar en cache
      cacheRef.current.set(query, sortedData);

      // Guardar en historial
      saveToHistory(query);
      setSearchHistory(getSearchHistory());

      setSuggestions(sortedData);
      setShowSuggestions(true);
      setShowHistory(false);
      setHighlightedIndex(-1);
      setRetryCount(0);

      console.log(`✅ Total: ${sortedData.length} resultados encontrados`);
    } catch (error) {
      // Ignorar errores de cancelación
      if (error.name === 'AbortError') {
        console.log('🔄 Búsqueda cancelada');
        return;
      }

      console.error('❌ Error buscando direcciones:', error);

      // Retry automático
      if (!isRetry && retryCount < MAX_RETRIES) {
        console.log(`🔄 Reintentando... (${retryCount + 1}/${MAX_RETRIES})`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => searchAddress(query, true), 1000);
        return;
      }

      toast({
        title: 'Error de Búsqueda',
        description: 'No se pudieron obtener las direcciones. Intente nuevamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast, retryCount]);

  /**
   * Prepara la query agregando "Argentina" de manera inteligente
   */
  const prepareQuery = (query) => {
    const hasArgentina = /argentina/i.test(query);

    if (hasArgentina) {
      return query;
    }

    if (isPostalCode(query)) {
      return `${query} Argentina`;
    }

    // No agregar Argentina automáticamente para dar más flexibilidad
    // El parámetro countrycodes=ar ya limita a Argentina
    return query;
  };

  /**
   * Realiza una búsqueda a la API de Nominatim
   */
  const performSearch = async (query, signal) => {
    const params = new URLSearchParams({
      q: query,
      countrycodes: 'ar',
      limit: '30', // Aumentado de 15 a 30
      addressdetails: '1',
      format: 'json',
      dedupe: '0', // No deduplicar para obtener más resultados
    });

    const response = await fetch(
      `/CRM/maps/search-address?${params}`,
      { signal }
    );

    if (!response.ok) {
      throw new Error('Error al buscar direcciones');
    }

    return await response.json();
  };

  /**
   * Búsqueda con debounce para autocompletado
   */
  const debouncedSearch = useCallback((query) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      searchAddress(query);
    }, DEBOUNCE_DELAY);
  }, [searchAddress]);

  /**
   * Handler para el cambio del input
   */
  const handleInputChange = (e) => {
    const newValue = e.target.value;

    if (onChange) {
      onChange(e);
    }

    // Búsqueda automática si está habilitada
    if (autoSearch && newValue.length >= MIN_SEARCH_LENGTH) {
      debouncedSearch(newValue);
    } else if (newValue.length < MIN_SEARCH_LENGTH) {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  /**
   * Limpiar campo de búsqueda
   */
  const handleClear = () => {
    if (onChange) {
      onChange({
        target: {
          name,
          value: '',
        },
      });
    }
    setSuggestions([]);
    setShowSuggestions(false);
    setShowHistory(false);
  };

  /**
   * Geolocalización
   */
  const handleGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocalización no disponible',
        description: 'Tu navegador no soporta geolocalización.',
        status: 'warning',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setIsGeolocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          console.log('📍 Ubicación obtenida:', { latitude, longitude });

          // Reverse geocoding
          const params = new URLSearchParams({
            lat: latitude,
            lon: longitude,
            format: 'json',
            addressdetails: '1',
          });

          const response = await fetch(`/CRM/maps/search-address?${params}`);

          if (!response.ok) {
            throw new Error('Error en reverse geocoding');
          }

          const data = await response.json();

          if (data && data[0]) {
            const place = data[0];
            handleSelectSuggestion(place);

            toast({
              title: 'Ubicación detectada',
              description: 'Se ha cargado tu ubicación actual.',
              status: 'success',
              duration: 3000,
              isClosable: true,
            });
          }
        } catch (error) {
          console.error('❌ Error en geolocalización:', error);
          toast({
            title: 'Error de Geolocalización',
            description: 'No se pudo obtener la dirección de tu ubicación.',
            status: 'error',
            duration: 4000,
            isClosable: true,
          });
        } finally {
          setIsGeolocating(false);
        }
      },
      (error) => {
        console.error('❌ Error obteniendo ubicación:', error);
        setIsGeolocating(false);

        let errorMessage = 'No se pudo obtener tu ubicación.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Permiso denegado. Por favor, habilita la geolocalización en tu navegador.';
        }

        toast({
          title: 'Error de Geolocalización',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    );
  }, [toast, onPlaceSelected, onChange, name]);

  /**
   * Extraer componentes de dirección de los datos de Nominatim
   */
  const extractAddressComponents = useCallback((place) => {
    const address = place.address || {};

    // Normalizar el nombre de la provincia recibido de la API
    const apiProvinceName = address.state || address.province || '';
    const normalizedApiProvince = normalizeString(apiProvinceName);

    // Lógica de mapeo dinámico y estricto
    let tangoCode = '';
    let provinceNameForForm = apiProvinceName;
    let provinciaEncontrada = null;
    let mappingWarning = false;

    if (provincias && provincias.length > 0) {
      // Buscar coincidencia exacta
      provinciaEncontrada = provincias.find(p =>
        normalizeString(p.label) === normalizedApiProvince
      );

      // Si no se encuentra, intentar con mapeo alternativo
      if (!provinciaEncontrada) {
        const nombreMapeado = PROVINCE_VARIATIONS[normalizedApiProvince];
        if (nombreMapeado) {
          provinciaEncontrada = provincias.find(p =>
            normalizeString(p.label) === nombreMapeado
          );
        }
      }

      if (provinciaEncontrada) {
        tangoCode = provinciaEncontrada.value;
        provinceNameForForm = provinciaEncontrada.label;
      } else {
        mappingWarning = true;
      }
    }

    // Log de diagnóstico
    console.log('--- DIAGNÓSTICO DE MAPEO DE PROVINCIA ---');
    console.log('API (Original):', apiProvinceName);
    console.log('API (Normalizado):', normalizedApiProvince);
    console.log('Provincias disponibles en Tango:', provincias.map(p => `${p.value}: ${p.label}`).join(', '));
    console.log('Tango (Encontrado):', provinciaEncontrada ? provinciaEncontrada.label : '⚠️ NO ENCONTRADO');
    console.log('Tango (Código Final):', tangoCode || '⚠️ NINGUNO');
    console.log('-----------------------------------------');

    const addressData = {
      streetNumber: address.house_number || '',
      route: address.road || address.street || '',
      locality: address.city || address.town || address.village || address.municipality || '',
      postalCode: address.postcode || '',
      province: provinceNameForForm,
      provinceShort: tangoCode,
      country: address.country || 'Argentina',
      countryShort: address.country_code?.toUpperCase() || 'AR',
      formattedAddress: place.display_name || '',
      lat: place.lat,
      lon: place.lon,
      mappingWarning, // Flag para indicar si hubo problemas de mapeo
    };

    // Construir dirección completa
    const fullAddress = [addressData.route, addressData.streetNumber]
      .filter(Boolean)
      .join(' ');

    addressData.fullAddress = fullAddress || addressData.formattedAddress;

    return addressData;
  }, [provincias]);

  /**
   * Handler cuando se selecciona una sugerencia
   */
  const handleSelectSuggestion = useCallback((place) => {
    const addressData = extractAddressComponents(place);

    // Actualizar el input con la dirección formateada
    if (onChange) {
      onChange({
        target: {
          name,
          value: addressData.fullAddress,
        },
      });
    }

    // Llamar al callback onPlaceSelected si existe
    if (onPlaceSelected) {
      onPlaceSelected(addressData);
    }

    // Advertir si la provincia no se mapeó
    if (addressData.mappingWarning) {
      toast({
        title: 'Advertencia de Provincia',
        description: `No se pudo mapear la provincia "${addressData.province}" a TANGO. Por favor, verifique manualmente.`,
        status: 'warning',
        duration: 6000,
        isClosable: true,
      });
    }

    setShowSuggestions(false);
    setShowHistory(false);
  }, [extractAddressComponents, name, onPlaceSelected, onChange, toast]);

  /**
   * Seleccionar del historial
   */
  const handleSelectHistory = useCallback((term) => {
    if (onChange) {
      onChange({
        target: {
          name,
          value: term,
        },
      });
    }
    searchAddress(term);
    setShowHistory(false);
  }, [onChange, name, searchAddress]);

  /**
   * Manejar navegación con teclado y búsqueda con Enter
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      if (showHistory && searchHistory.length > 0 && highlightedIndex >= 0) {
        handleSelectHistory(searchHistory[highlightedIndex]);
      } else if (showSuggestions && suggestions.length > 0 && highlightedIndex >= 0) {
        handleSelectSuggestion(suggestions[highlightedIndex]);
      } else if (value && value.length >= MIN_SEARCH_LENGTH) {
        searchAddress(value);
      }
      return;
    }

    const itemsToNavigate = showHistory ? searchHistory : suggestions;
    if ((!showSuggestions && !showHistory) || itemsToNavigate.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < itemsToNavigate.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Escape':
        setShowSuggestions(false);
        setShowHistory(false);
        break;
      default:
        break;
    }
  };

  /**
   * Mostrar historial al hacer focus
   */
  const handleFocus = () => {
    if (!value && searchHistory.length > 0) {
      setShowHistory(true);
      setHighlightedIndex(-1);
    }
  };

  /**
   * Determinar el tipo de resultado para iconos
   */
  const getResultIcon = (suggestion) => {
    const type = suggestion.type;
    const addressClass = suggestion.class;

    if (type === 'house' || addressClass === 'building') return '🏠';
    if (type === 'city' || addressClass === 'place') return '🏙️';
    if (type === 'road' || addressClass === 'highway') return '🛣️';
    if (addressClass === 'amenity') return '📍';
    return '📌';
  };

  /**
   * Verificar si la provincia se puede mapear a TANGO
   */
  const canMapProvince = useCallback((suggestion) => {
    const address = suggestion.address || {};
    const apiProvinceName = address.state || address.province || '';
    const normalizedApiProvince = normalizeString(apiProvinceName);

    if (!provincias || provincias.length === 0) return true;

    // Buscar coincidencia directa
    const found = provincias.find(p =>
      normalizeString(p.label) === normalizedApiProvince
    );

    if (found) return true;

    // Buscar en mapeo alternativo
    const mapped = PROVINCE_VARIATIONS[normalizedApiProvince];
    if (mapped) {
      return provincias.some(p => normalizeString(p.label) === mapped);
    }

    return false;
  }, [provincias]);

  // Calcular si hay valor para mostrar el botón de limpiar
  const showClearButton = value && value.length > 0;

  // Calcular ancho del InputRightElement basado en cuántos botones hay
  const rightElementWidth = () => {
    let count = 1; // Siempre hay botón de búsqueda
    if (showClearButton) count++;
    return `${count * 2}rem`;
  };

  return (
    <Box ref={wrapperRef} position="relative" width="100%">
      <InputGroup size={size}>
        {/* Botón de geolocalización (opcional) */}
        {enableGeolocation && (
          <InputLeftElement>
            <Tooltip label="Usar mi ubicación actual" placement="top">
              <IconButton
                aria-label="Geolocalización"
                icon={<Text fontSize="lg">📍</Text>}
                size="xs"
                variant="ghost"
                onClick={handleGeolocation}
                isLoading={isGeolocating}
                isDisabled={isDisabled || isLoading}
              />
            </Tooltip>
          </InputLeftElement>
        )}

        <Input
          name={name}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          bg={inputBg}
          isDisabled={isDisabled}
          autoComplete="off"
          pl={enableGeolocation ? '2.5rem' : undefined}
          pr={rightElementWidth()}
        />

        {/* Botones de acción */}
        <InputRightElement width={rightElementWidth()}>
          <HStack spacing={0}>
            {showClearButton && (
              <Tooltip label="Limpiar" placement="top">
                <IconButton
                  aria-label="Limpiar"
                  icon={<CloseIcon />}
                  size="xs"
                  variant="ghost"
                  onClick={handleClear}
                  isDisabled={isDisabled}
                  boxSize={3}
                />
              </Tooltip>
            )}

            <Tooltip label="Buscar dirección" placement="top">
              <Box
                as="button"
                onClick={() => !isLoading && searchAddress(value)}
                cursor={isLoading ? 'not-allowed' : 'pointer'}
                _hover={{ color: isLoading ? 'gray.400' : 'blue.500' }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                p={2}
              >
                {isLoading ? (
                  <Spinner size="xs" />
                ) : (
                  <Icon as={SearchIcon} color="gray.400" boxSize={3} />
                )}
              </Box>
            </Tooltip>
          </HStack>
        </InputRightElement>
      </InputGroup>

      {/* Lista de historial */}
      {showHistory && searchHistory.length > 0 && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          zIndex={1000}
          mt={1}
          bg={historyBg}
          border="1px solid"
          borderColor="gray.300"
          borderRadius="md"
          boxShadow="md"
        >
          <Box px={3} py={2} borderBottom="1px solid" borderColor="gray.300">
            <Text fontSize="xs" fontWeight="bold" color="gray.600">
              Búsquedas recientes
            </Text>
          </Box>
          <List spacing={0}>
            {searchHistory.map((term, index) => (
              <ListItem
                key={`history-${index}`}
                px={3}
                py={2}
                cursor="pointer"
                bg={highlightedIndex === index ? suggestionHoverBg : 'transparent'}
                _hover={{ bg: suggestionHoverBg }}
                onClick={() => handleSelectHistory(term)}
                borderBottom={index < searchHistory.length - 1 ? '1px solid' : 'none'}
                borderColor="gray.200"
              >
                <HStack>
                  <Text fontSize="lg">🕐</Text>
                  <Text fontSize="sm">{term}</Text>
                </HStack>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Lista de sugerencias */}
      {showSuggestions && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          zIndex={1000}
          mt={1}
          maxH="50vh"
          overflowY="auto"
          bg={suggestionBg}
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          boxShadow="lg"
        >
          {suggestions.length > 0 ? (
            <>
              {/* Contador de resultados */}
              <Box px={3} py={2} borderBottom="1px solid" borderColor="gray.200">
                <Text fontSize="xs" color="gray.600">
                  {suggestions.length} {suggestions.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
                </Text>
              </Box>

              <List spacing={0}>
                {suggestions.map((suggestion, index) => {
                  const canMap = canMapProvince(suggestion);
                  const icon = getResultIcon(suggestion);

                  return (
                    <ListItem
                      key={suggestion.place_id}
                      px={3}
                      py={2}
                      cursor="pointer"
                      bg={highlightedIndex === index ? suggestionHoverBg : 'transparent'}
                      _hover={{ bg: suggestionHoverBg }}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      borderBottom={index < suggestions.length - 1 ? '1px solid' : 'none'}
                      borderColor="gray.200"
                    >
                      <Flex align="flex-start" gap={2} justify="space-between">
                        <Flex align="flex-start" gap={2} flex={1}>
                          {/* Icono del tipo de resultado */}
                          <Text fontSize="lg" mt={0.5}>
                            {icon}
                          </Text>

                          <Box flex={1}>
                            {/* Dirección principal */}
                            <Flex align="center" gap={2}>
                              <Text fontSize="sm" fontWeight="medium">
                                {highlightMatch(
                                  `${suggestion.address?.road || suggestion.address?.street || 'Sin calle'} ${suggestion.address?.house_number || ''}`.trim(),
                                  value
                                )}
                              </Text>

                              {/* Badge de advertencia si no se puede mapear */}
                              {!canMap && (
                                <Tooltip label="Esta provincia no se puede mapear automáticamente a TANGO" placement="top">
                                  <Badge colorScheme="orange" fontSize="2xs">
                                    ⚠️
                                  </Badge>
                                </Tooltip>
                              )}
                            </Flex>

                            {/* Detalles de ubicación */}
                            <Text fontSize="xs" color="gray.500" mt={0.5}>
                              {suggestion.address?.city || suggestion.address?.town || ''}
                              {suggestion.address?.city || suggestion.address?.town ? ', ' : ''}
                              {suggestion.address?.state || ''}
                              {suggestion.address?.postcode ? ` (CP: ${suggestion.address.postcode})` : ''}
                            </Text>

                            {/* Modo flexible: mostrar tipo de selección */}
                            {allowFlexibleSelection && !suggestion.address?.road && (
                              <Badge colorScheme="blue" fontSize="2xs" mt={1}>
                                Solo ubicación (sin dirección específica)
                              </Badge>
                            )}
                          </Box>
                        </Flex>
                      </Flex>
                    </ListItem>
                  );
                })}
              </List>
            </>
          ) : (
            <Box px={3} py={4} textAlign="center">
              <Text fontSize="sm" color="gray.500">
                No se encontraron resultados.
              </Text>
              <Text fontSize="xs" color="gray.400" mt={1}>
                Intenta con otra búsqueda o verifica la ortografía.
              </Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default OpenStreetMapAutocomplete;
