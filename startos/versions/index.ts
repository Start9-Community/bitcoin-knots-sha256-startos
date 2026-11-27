import { VersionGraph } from '@start9labs/start-sdk'
import { current } from './current'
import { v_31_2_0 } from './v31.2_0'
import { v_32_1_0 } from './v32.1_0'

export const versionGraph = VersionGraph.of({
  current,
  other: [v_31_2_0, v_32_1_0],
})
