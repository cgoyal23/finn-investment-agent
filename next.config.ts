import type {NextConfig} from 'next';
const config:NextConfig={
  async headers(){return [{source:'/:path*',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'}]},{source:'/login',headers:[{key:'Cross-Origin-Opener-Policy',value:'same-origin-allow-popups'}]}];}
};
export default config;
