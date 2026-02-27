import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  basePath: '/motchama',
  env: {
    NEXT_PUBLIC_BASE_PATH: '/motchama',
  },
}

export default nextConfig
