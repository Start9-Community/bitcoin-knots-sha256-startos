import { IMPOSSIBLE, T, VersionInfo } from '@start9labs/start-sdk'
import { bitcoinConfFile } from '../fileModels/bitcoin.conf'
import { storeJson } from '../fileModels/store.json'

/** A datacarriercost of 1 written before 32.x becomes 2, once; store.json's flag keeps a later 1. */
export async function raiseDatacarriercost32(effects: T.Effects) {
  if ((await storeJson.read().once())?.datacarriercost32) return
  if ((await bitcoinConfFile.read().once())?.datacarriercost === 1) {
    await bitcoinConfFile.merge(effects, { datacarriercost: 2 })
  }
  await storeJson.merge(effects, { datacarriercost32: true })
}

export const v_32_1_0 = VersionInfo.of({
  version: '#knotssha:32.1:0',
  releaseNotes: {
    en_US:
      'Bitcoin Knots SHA256 32.1 on Bitcoin Core 32.1. A Datacarrier Cost of 1 saved by an earlier version becomes 2 once; set it again in Mempool Settings to keep 1.',
    es_ES:
      'Bitcoin Knots SHA256 32.1 sobre Bitcoin Core 32.1. Un Datacarrier Cost de 1 guardado por una versión anterior pasa a 2 una sola vez; vuelva a establecerlo en Configuración de Mempool para mantener 1.',
    de_DE:
      'Bitcoin Knots SHA256 32.1 auf Bitcoin Core 32.1. Ein von einer früheren Version gespeicherter Datacarrier Cost von 1 wird einmalig zu 2; setzen Sie ihn in den Mempool-Einstellungen erneut, um 1 zu behalten.',
    pl_PL:
      'Bitcoin Knots SHA256 32.1 na Bitcoin Core 32.1. Datacarrier Cost równy 1, zapisany przez wcześniejszą wersję, jednorazowo zmienia się na 2; aby zachować 1, ustaw go ponownie w Ustawieniach Mempool.',
    fr_FR:
      'Bitcoin Knots SHA256 32.1 sur Bitcoin Core 32.1. Un Datacarrier Cost de 1 enregistré par une version antérieure devient 2 une seule fois ; définissez-le à nouveau dans Paramètres du Mempool pour garder 1.',
  },
  migrations: {
    up: async ({ effects }) => raiseDatacarriercost32(effects),
    down: IMPOSSIBLE,
  },
})
