import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'bitcoind',
  title: 'Bitcoin Knots (SHA256)',
  license: 'MIT',
  donationUrl: null,
  packageRepo:
    'https://github.com/Start9-Community/bitcoin-knots-sha256-startos',
  upstreamRepo: 'https://github.com/paulscode/knots-sha256',
  marketingUrl: 'https://github.com/paulscode/knots-sha256',
  description: { short, long },
  volumes: ['main', 'i2pd', 'public'],
  images: {
    bitcoind: {
      source: {
        dockerBuild: {
          buildArgs: {
            // The release's full version string; see UPDATING.md.
            VERSION: '32.1.knots-sha256.20261113',
          },
        },
      },
      arch: ['x86_64', 'aarch64', 'riscv64'],
    },
    proxy: {
      source: {
        dockerTag: 'ghcr.io/start9labs/btc-rpc-proxy:v0.8.4',
      },
      arch: ['x86_64', 'aarch64', 'riscv64'],
    },
    python: {
      source: {
        dockerTag: 'python:3.14.8-alpine',
      },
      arch: ['x86_64', 'aarch64', 'riscv64'],
    },
    i2pd: {
      source: {
        dockerTag: 'purplei2p/i2pd:release-2.59.0',
      },
      arch: ['x86_64', 'aarch64'],
      emulateMissing: true,
    },
  },
})
