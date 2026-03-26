/// <reference types="vite/client" />

declare module "*.scss" {
  const content: any;
  export default content;
}

declare module "*.css" {
  const content: any;
  export default content;
}

declare module "*.jpg" {
  const src: any;
  export default src;
}

declare module "*.png" {
  const src: any;
  export default src;
}

declare module "*.svg" {
  import * as React from "react";
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;

  const src: string;
  export default src;
}
