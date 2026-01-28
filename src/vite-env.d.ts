/// <reference types="vite/client" />

// Permite importar archivos JS sin errores de tipo
declare module '*.js' {
  const content: any
  export default content
  export = content
}

// Permite importar imágenes
declare module '*.png' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.svg' {
  import * as React from 'react'
  const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>
  export default ReactComponent
}
