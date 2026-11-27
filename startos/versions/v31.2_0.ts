import { FileHelper, IMPOSSIBLE, VersionInfo, z } from '@start9labs/start-sdk'
import { bitcoinConfFile, toBitcoinConf } from '../fileModels/bitcoin.conf'

export const v_31_2_0 = VersionInfo.of({
  version: '#knotssha:31.2:0',
  releaseNotes: {
    en_US:
      'Bitcoin Knots SHA256 31.2. Block Notify commands that contain `=` or `;` now run as entered.',
    es_ES:
      'Bitcoin Knots SHA256 31.2. Los comandos de Notificación de bloque que contienen `=` o `;` ahora se ejecutan tal como se introducen.',
    de_DE:
      'Bitcoin Knots SHA256 31.2. Blockbenachrichtigungs-Befehle, die `=` oder `;` enthalten, werden jetzt genau wie eingegeben ausgeführt.',
    pl_PL:
      'Bitcoin Knots SHA256 31.2. Polecenia Powiadomienia o bloku zawierające `=` lub `;` są teraz uruchamiane dokładnie tak, jak je wpisano.',
    fr_FR:
      'Bitcoin Knots SHA256 31.2. Les commandes de Notification de bloc qui contiennent `=` ou `;` sont désormais exécutées telles que saisies.',
  },
  migrations: {
    up: async ({ effects }) => {
      // Earlier releases wrote bitcoin.conf with FileHelper.ini's quoting and escapes.
      const conf = await FileHelper.ini(
        bitcoinConfFile.path,
        z.looseObject({}),
        { bracketedArray: false },
      )
        .read()
        .once()
      if (conf)
        await FileHelper.string(bitcoinConfFile.path).write(
          effects,
          toBitcoinConf(conf),
        )
    },
    down: IMPOSSIBLE,
  },
})
