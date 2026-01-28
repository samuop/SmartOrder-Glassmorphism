import React from "react";
import {
  Grid,
  GridItem,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Select,
  Spinner,
  Text,
  HStack,
  Box,
  useColorModeValue,
} from "@chakra-ui/react";
import { AtSignIcon } from "@chakra-ui/icons";
import { PAISES } from "../constants/catalogos";
import OpenStreetMapAutocomplete from "../../OpenStreetMapAutocomplete";

const SeccionDomicilioPrincipal = ({
  formData,
  errors,
  provincias,
  isLoadingProvincias,
  handleChange,
  onDomicilioPlaceSelected,
}) => {
  const inputBg = useColorModeValue("white", "#1a202c");
  const labelColor = useColorModeValue("gray.600", "gray.400");

  return (
    <>
      <Text fontWeight="600" fontSize="sm" color={labelColor} letterSpacing="wide">DOMICILIO PRINCIPAL</Text>
      <Grid templateColumns="repeat(4, 1fr)" gap={3}>
        {/* Domicilio */}
        <GridItem colSpan={2}>
          <FormControl size="sm" isInvalid={!!errors.domicilio}>
            <FormLabel fontSize="xs" mb={0.5}>
              Domicilio 🌍 <Text as="span" color="red.500">*</Text>
            </FormLabel>
            <OpenStreetMapAutocomplete
              name="domicilio"
              value={formData.domicilio}
              onChange={handleChange}
              onPlaceSelected={onDomicilioPlaceSelected}
              placeholder="Buscar dirección con OpenStreetMap..."
              size="sm"
              provincias={provincias}
            />
            <FormErrorMessage fontSize="xs">{errors.domicilio}</FormErrorMessage>
          </FormControl>
        </GridItem>

        {/* Localidad */}
        <GridItem>
          <FormControl size="sm">
            <FormLabel fontSize="xs" mb={0.5}>Localidad</FormLabel>
            <Input
              size="sm"
              name="localidad"
              value={formData.localidad}
              onChange={handleChange}
              placeholder="Ciudad"
              bg={inputBg}
            />
          </FormControl>
        </GridItem>

        {/* CP */}
        <GridItem>
          <FormControl size="sm">
            <FormLabel fontSize="xs" mb={0.5}>C.P.</FormLabel>
            <Input
              size="sm"
              name="codigoPostal"
              value={formData.codigoPostal}
              onChange={handleChange}
              placeholder="1000"
              bg={inputBg}
            />
          </FormControl>
        </GridItem>

        {/* Provincia */}
        <GridItem>
          <FormControl size="sm">
            <FormLabel fontSize="xs" mb={0.5}>
              Provincia
              {isLoadingProvincias && <Spinner size="xs" ml={1} />}
            </FormLabel>
            <Select
              size="sm"
              name="codProvincia"
              value={formData.codProvincia}
              onChange={handleChange}
              placeholder={isLoadingProvincias ? "Cargando..." : "Seleccionar..."}
              bg={inputBg}
              disabled={isLoadingProvincias}
            >
              {provincias.map(prov => (
                <option key={prov.value} value={prov.value}>{prov.label}</option>
              ))}
            </Select>
          </FormControl>
        </GridItem>

        {/* País */}
        <GridItem>
          <FormControl size="sm">
            <FormLabel fontSize="xs" mb={0.5}>País</FormLabel>
            <Select
              size="sm"
              name="codPais"
              value={formData.codPais}
              onChange={handleChange}
              bg={inputBg}
            >
              {PAISES.map(pais => (
                <option key={pais.value} value={pais.value}>{pais.label}</option>
              ))}
            </Select>
          </FormControl>
        </GridItem>

        {/* Email */}
        <GridItem>
          <FormControl isInvalid={!!errors.email} size="sm">
            <FormLabel fontSize="xs" mb={0.5}>Email</FormLabel>
            <Input
              size="sm"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              bg={inputBg}
            />
            <FormErrorMessage fontSize="xs">{errors.email}</FormErrorMessage>
          </FormControl>
        </GridItem>

        {/* Teléfono */}
        <GridItem>
          <FormControl size="sm">
            <FormLabel fontSize="xs" mb={0.5}>Teléfono</FormLabel>
            <Input
              size="sm"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="11-1234-5678"
              bg={inputBg}
            />
          </FormControl>
        </GridItem>

        {/* Actividad */}
        <GridItem>
          <FormControl size="sm">
            <FormLabel fontSize="xs" mb={0.5}>Actividad</FormLabel>
            <Input
              size="sm"
              name="actividad"
              value={formData.actividad}
              onChange={handleChange}
              placeholder="Comercio, Industria..."
              bg={inputBg}
            />
          </FormControl>
        </GridItem>

        {/* Rubro */}
        <GridItem>
          <FormControl size="sm">
            <FormLabel fontSize="xs" mb={0.5}>Rubro</FormLabel>
            <Input
              size="sm"
              name="rubroCom"
              value={formData.rubroCom}
              onChange={handleChange}
              placeholder="Electrodomésticos..."
              bg={inputBg}
            />
          </FormControl>
        </GridItem>

        {/* Fax */}
        <GridItem>
          <FormControl size="sm">
            <FormLabel fontSize="xs" mb={0.5}>Fax</FormLabel>
            <Input
              size="sm"
              name="fax"
              value={formData.fax}
              onChange={handleChange}
              placeholder="Fax"
              bg={inputBg}
            />
          </FormControl>
        </GridItem>

        {/* Web */}
        <GridItem>
          <FormControl size="sm">
            <FormLabel fontSize="xs" mb={0.5}>Página Web</FormLabel>
            <Input
              size="sm"
              name="paginaWeb"
              value={formData.paginaWeb}
              onChange={handleChange}
              placeholder="www.ejemplo.com"
              bg={inputBg}
            />
          </FormControl>
        </GridItem>
      </Grid>
    </>
  );
};

export default SeccionDomicilioPrincipal;
